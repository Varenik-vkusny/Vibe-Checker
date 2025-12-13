import time
import math
import aiohttp
import asyncio
from typing import List
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO, Location, ReviewDTO
from ..place.repo import PlaceRepo

settings = get_settings()
SERPAPI_API_KEY = settings.serpapi_key  # Используем тот же ключ


def calculate_distance(lat1, lon1, lat2, lon2) -> float:
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    try:
        R = 6371
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(
            math.radians(lat1)
        ) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) * math.sin(dLon / 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except Exception:
        return 99999.0


async def find_places_nearby(
    query: str, lat: float, lon: float, limit: int = 5
) -> List[PlaceInfoDTO]:
    """
    Ищет места через SerpApi (engine=google_maps).
    Использует параметр 'll' (@lat,lon,zoom) для точного гео-поиска.
    """
    print(f"[SEARCH] Searching via SerpApi Maps: '{query}' near ({lat},{lon})")

    candidates = []
    endpoint = "https://serpapi.com/search.json"

    # Формируем параметр ll для Google Maps (@lat,lon,14z)
    ll_param = f"@{lat},{lon},14z"

    params = {
        "engine": "google_maps",
        "q": query,
        "ll": ll_param,
        "type": "search",  # Важно для поиска мест
        "hl": "ru",
        "api_key": SERPAPI_API_KEY,
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(endpoint, params=params) as response:
                if response.status != 200:
                    print(f"[SEARCH] SerpApi Error status: {response.status}")
                    return []
                data = await response.json()

        # SerpApi возвращает результаты в 'local_results' для engine=google_maps
        local_results = data.get("local_results", [])

        print(f"[SEARCH] Found {len(local_results)} raw results.")

        for item in local_results:
            # Получаем координаты из ответа
            gps = item.get("gps_coordinates", {})
            place_lat = gps.get("latitude")
            place_lon = gps.get("longitude")

            # Фильтрация по расстоянию
            if lat and lon and place_lat and place_lon:
                dist = calculate_distance(lat, lon, place_lat, place_lon)
                if dist is not None and dist > 30.0:
                    continue

            cid = item.get("data_id")  # Это и есть нужный нам ID (0x...)

            # Фото
            photos = []
            if "thumbnail" in item:
                photos.append(item["thumbnail"])

            # Маппинг DTO
            dto = PlaceInfoDTO(
                place_id=str(cid) if cid else None,
                name=item.get("title", "Unknown"),
                address=item.get("address", "No Address"),
                rating=float(item.get("rating", 0.0)),
                reviews_count=int(item.get("reviews", 0)),
                location=Location(lat=place_lat, lon=place_lon),
                description=item.get("type", ""),  # Категория (напр. "Ресторан")
                photos=photos,
                reviews=[],
                url=None,  # Можно сформировать maps ссылку, если нужно
            )
            candidates.append(dto)

            if len(candidates) >= limit:
                break

        print(f"[SEARCH] Returned {len(candidates)} candidates after filtering.")
        return candidates

    except Exception as e:
        print(f"[SEARCH] Exception: {e}")
        return []


async def enrich_place_with_reviews(
    place_id: str, max_reviews: int = 5
) -> List[ReviewDTO]:
    """
    Тянет отзывы используя engine=google_maps_reviews и data_id
    """
    if not place_id:
        return []

    print(f"[REVIEWS] Fetching reviews for Data ID: {place_id}")

    endpoint = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps_reviews",
        "data_id": place_id,
        "hl": "ru",
        "sort_by": "newestFirst",
        "api_key": SERPAPI_API_KEY,
    }

    collected_reviews = []

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(endpoint, params=params) as response:
                if response.status != 200:
                    print(f"[REVIEWS] Error fetching details: {response.status}")
                    return []
                data = await response.json()

        raw_reviews = data.get("reviews", [])

        for item in raw_reviews:
            snippet = item.get("snippet") or item.get("text")

            if snippet:
                review = ReviewDTO(
                    author=item.get("user", {}).get("name", "Guest"),
                    rating=float(item.get("rating") or 0.0),
                    date=item.get(
                        "date", ""
                    ),  # SerpApi дает строку, напр "2 месяца назад"
                    text=snippet,
                )
                collected_reviews.append(review)

            if len(collected_reviews) >= max_reviews:
                break

        print(f"[REVIEWS] Successfully loaded {len(collected_reviews)} reviews.")
        return collected_reviews

    except Exception as e:
        print(f"[REVIEWS] SerpApi Review Error: {e}")
        return []


async def search_and_parse_places(
    query: str,
    lat: float,
    lon: float,
    place_repo: PlaceRepo,  # <--- ДОБАВИЛИ АРГУМЕНТ
    limit_places: int = 5,
) -> List[PlaceInfoDTO]:
    """
    Главная функция:
    1. Ищет места (API).
    2. Проверяет БД: если место есть и есть отзывы -> берет из БД.
    3. Если нет -> тянет отзывы из API.
    """
    t0 = time.time()

    # 1. Ищем кандидатов через Google Maps (поиск по локации)
    # Это дешевый запрос, его оставляем
    candidates = await find_places_nearby(query, lat, lon, limit=limit_places)

    if not candidates:
        return []

    # Списки для разделения задач
    tasks_api = []
    indices_for_api = (
        []
    )  # Чтобы потом знать, к какому кандидату привязать результат API

    print(f"[SEARCH_AND_PARSE] Checking DB for {len(candidates)} candidates...")

    for i, place_dto in enumerate(candidates):
        if not place_dto.place_id:
            continue

        # 2. Проверяем наличие в базе данных
        # Используем новый метод с подгрузкой отзывов
        cached_place = await place_repo.get_by_google_id_with_reviews(
            place_dto.place_id
        )

        # Логика кеширования: Если место есть и у него есть отзывы (например > 0)
        # Можно добавить проверку по дате обновления (cached_place.updated_at), если нужно
        if cached_place and cached_place.reviews and len(cached_place.reviews) > 0:
            print(
                f"   [CACHE HIT] Found '{place_dto.name}' in DB with {len(cached_place.reviews)} reviews."
            )

            # Маппим отзывы из БД (SQLAlchemy models) в Pydantic DTO
            db_reviews_dto = [
                ReviewDTO(
                    author=rev.author_name or "Guest",
                    rating=float(rev.rating or 0.0),
                    date=rev.published_time or "",
                    text=rev.text or "",
                )
                for rev in cached_place.reviews
            ]

            # Обновляем кандидата данными из БД
            place_dto.reviews = db_reviews_dto

            # Опционально: если в БД есть более подробное описание или фото, можно тоже подтянуть
            if cached_place.description:
                place_dto.description = cached_place.description
            if cached_place.photos:
                # cached_place.photos у тебя JSON, убедись что там список строк
                if isinstance(cached_place.photos, list):
                    place_dto.photos = cached_place.photos

        else:
            # Если в базе нет или нет отзывов — ставим в очередь на API запрос
            print(f"   [CACHE MISS] '{place_dto.name}' needs API fetch.")
            tasks_api.append(
                enrich_place_with_reviews(place_dto.place_id, max_reviews=3)
            )
            indices_for_api.append(i)

    # 3. Выполняем запросы к API только для тех, кого не нашли в БД
    if tasks_api:
        print(
            f"[SEARCH_AND_PARSE] Fetching reviews from API for {len(tasks_api)} places..."
        )
        reviews_results = await asyncio.gather(*tasks_api)

        # Привязываем результаты обратно к кандидатам
        for idx_in_candidates, reviews in zip(indices_for_api, reviews_results):
            candidate = candidates[idx_in_candidates]
            if reviews:
                candidate.reviews = reviews
                print(
                    f"   -> Added {len(reviews)} reviews to '{candidate.name}' (from API)"
                )
    else:
        print("[SEARCH_AND_PARSE] All reviews fetched from DB! No API calls needed.")

    print(f"[SEARCH_AND_PARSE] Total took {time.time() - t0:.2f}s")
    return candidates
