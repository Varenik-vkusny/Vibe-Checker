import time
import math
import aiohttp
import asyncio
from typing import List
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO, Location, ReviewDTO

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
    query: str, lat: float, lon: float, limit_places: int = 5
) -> List[PlaceInfoDTO]:
    """
    Главная функция: ищет места, потом обогащает их отзывами.
    Без изменений логики, только вызовы внутри поменялись.
    """
    t0 = time.time()

    # 1. Ищем места (теперь через google_maps engine)
    candidates = await find_places_nearby(query, lat, lon, limit=limit_places)

    if not candidates:
        return []

    # 2. Обогащаем каждое место отзывами параллельно
    tasks = []
    for place in candidates:
        if place.place_id:
            tasks.append(enrich_place_with_reviews(place.place_id, max_reviews=3))
        else:
            tasks.append(asyncio.sleep(0, result=[]))

    reviews_results = await asyncio.gather(*tasks)

    for place, reviews in zip(candidates, reviews_results):
        if reviews:
            place.reviews = reviews
            print(f"   -> Added {len(reviews)} reviews to '{place.name}'")

    print(f"[SEARCH_AND_PARSE] Total took {time.time() - t0:.2f}s")
    return candidates
