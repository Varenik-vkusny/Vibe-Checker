import math
import asyncio
import time
from typing import List
from serpapi import GoogleSearch
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO, Location, ReviewDTO

settings = get_settings()
SERPAPI_KEY = settings.serpapi_key


def calculate_distance(lat1, lon1, lat2, lon2) -> float:
    """
    Вычисляет расстояние между двумя точками в километрах (Haversine formula).
    """
    if not lat1 or not lon1 or not lat2 or not lon2:
        return 99999.0  # Если координат нет, считаем что далеко

    R = 6371  # Радиус Земли в км
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(
        math.radians(lat1)
    ) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ==========================================
# 1. Функция поиска (Возвращает список DTO)
# ==========================================
async def find_places_nearby(
    query: str, lat: float, lon: float, limit: int = 5
) -> List[PlaceInfoDTO]:

    print(f"🕵️‍♂️ [SEARCH] Ищем: '{query}' в точке {lat},{lon}")

    params = {
        "api_key": SERPAPI_KEY,
        "engine": "google_maps",
        "q": query,
        "ll": f"@{lat},{lon},15z",
        "type": "search",
        "hl": "ru",
    }

    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        local_results = results.get("local_results", [])

        if not local_results:
            print("❌ Ничего не найдено.")
            return []

        candidates = []

        for item in local_results:  # Берем всех, фильтруем, потом обрежем по limit
            gps = item.get("gps_coordinates", {})
            place_lat = gps.get("latitude")
            place_lon = gps.get("longitude")

            # 🔥 ЖЕСТКИЙ ФИЛЬТР РАССТОЯНИЯ (например, 15 км)
            # Это уберет "Sempre" из Москвы, если ты в Астане
            dist = calculate_distance(lat, lon, place_lat, place_lon)
            if dist > 15.0:
                # print(f"⚠️ Пропускаем '{item.get('title')}', так как он далеко ({dist:.1f} км)")
                continue

            # Собираем фото
            photos = []
            if item.get("thumbnail"):
                photos.append(item.get("thumbnail"))

            dto = PlaceInfoDTO(
                place_id=item.get("place_id") or item.get("data_id"),
                name=item.get("title", "Unknown"),
                address=item.get("address", ""),
                rating=float(item.get("rating", 0.0)),
                reviews_count=int(item.get("reviews", 0)),
                location=Location(lat=place_lat, lon=place_lon),
                photos=photos,
                reviews=[],
                url=None,
            )
            candidates.append(dto)

            if len(candidates) >= limit:
                break

        print(f"✅ Найдено кандидатов (рядом): {len(candidates)}")
        return candidates

    except Exception as e:
        print(f"❌ Ошибка поиска SerpApi: {e}")
        return []


# ==========================================
# 2. Функция отзывов (Возвращает список строк)
# ==========================================
async def enrich_place_with_reviews(place_id: str, max_reviews: int = 5) -> List[str]:
    """
    Тянет отзывы и форматирует их в строки для LLM.
    """
    if not place_id:
        return []

    print(f"📥 [REVIEWS] Качаем отзывы для ID: {place_id}")

    try:
        serp_params = {
            "api_key": SERPAPI_KEY,
            "engine": "google_maps_reviews",
            "place_id": place_id,
            "sort_by": "qualityScore",
            "hl": "ru",
        }

        collected_reviews = []
        search = GoogleSearch(serp_params)
        results = search.get_dict()

        if "error" in results:
            print(f"⚠️ SerpApi Error: {results['error']}")
            return []

        reviews_data = results.get("reviews", [])

        for item in reviews_data[:max_reviews]:
            text = item.get("snippet")
            if text:
                review = ReviewDTO(
                    author=item.get("user", {}).get("name", "Guest"),
                    rating=float(item.get("rating", 0)),
                    date=item.get("date", ""),
                    text=text,
                )
                collected_reviews.append(review)

        return collected_reviews

    except Exception as e:
        print(f"❌ Ошибка парсинга отзывов: {e}")
        return []


# ==========================================
# 3. Оркестратор (Возвращает DTO с отзывами)
# ==========================================
async def search_and_parse_places(
    query: str, lat: float, lon: float, limit_places: int = 5
) -> List[PlaceInfoDTO]:

    t0 = time.time()
    # 1. Поиск мест
    candidates = await find_places_nearby(query, lat, lon, limit=limit_places)
    print(f"   ⏱️ Sub-step: Google Search took {time.time() - t0:.2f}s")

    if not candidates:
        return []

    t1 = time.time()
    # 2. Параллельная загрузка отзывов
    tasks = []
    for place in candidates:
        if place.place_id:
            tasks.append(enrich_place_with_reviews(place.place_id, max_reviews=7))
        else:
            tasks.append(asyncio.sleep(0, result=[]))

    reviews_results = await asyncio.gather(*tasks)
    print(
        f"   ⏱️ Sub-step: Reviews Download ({len(tasks)} places parallel) took {time.time() - t1:.2f}s"
    )

    # 3. Сборка
    for place, reviews in zip(candidates, reviews_results):
        place.reviews = reviews

    return candidates
