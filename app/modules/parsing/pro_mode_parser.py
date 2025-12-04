from serpapi import GoogleSearch
from ...config import get_settings

settings = get_settings()
SERPAPI_KEY = settings.serpapi_key


# ==========================================
# 1. Функция поиска мест (Кандидатов)
# ==========================================
async def find_places_nearby(query: str, lat: float, lon: float, limit: int = 5):
    """
    Ищет места через SerpApi Google Maps Search.
    Возвращает список мест с базовой инфой (без текстов отзывов).
    """
    print(f"🕵️‍♂️ [SEARCH] Ищем: '{query}' в точке {lat},{lon}")

    params = {
        "api_key": SERPAPI_KEY,
        "engine": "google_maps",
        "q": query,
        "ll": f"@{lat},{lon},15z",  # 15z = зум примерно для района
        "type": "search",
        "hl": "ru",  # язык результатов
    }

    try:
        search = GoogleSearch(params)
        results = search.get_dict()

        local_results = results.get("local_results", [])

        # Если ничего не нашли
        if not local_results:
            print("❌ Ничего не найдено.")
            return []

        candidates = []

        # Берем только топ-N мест, чтобы не тратить кредиты на парсинг отзывов для всех
        for item in local_results[:limit]:
            # SerpApi обычно возвращает gps_coordinates
            gps = item.get("gps_coordinates", {})

            place_data = {
                "place_id": item.get("place_id") or item.get("data_id"),  # ID места
                "name": item.get("title"),
                "rating": item.get("rating", 0.0),
                "reviews_count": item.get("reviews", 0),
                "address": item.get("address"),
                "location": {"lat": gps.get("latitude"), "lon": gps.get("longitude")},
                "types": item.get("type", []),
                "thumbnail": item.get("thumbnail"),
                # Сюда позже положим отзывы
                "reviews_summary": "",
                "reviews": [],
            }
            candidates.append(place_data)

        print(f"✅ Найдено кандидатов: {len(candidates)}")
        return candidates

    except Exception as e:
        print(f"❌ Ошибка поиска SerpApi: {e}")
        return []


# ==========================================
# 2. Функция получения отзывов (Твой код, адаптированный под ID)
# ==========================================
async def enrich_place_with_reviews(place_id: str, max_reviews: int = 5):
    """
    Берет ID места и тянет отзывы через SerpApi (движок google_maps_reviews).
    """
    if not place_id:
        return []

    print(f"📥 [REVIEWS] Качаем отзывы для ID: {place_id}")

    try:
        serp_params = {
            "api_key": SERPAPI_KEY,
            "engine": "google_maps_reviews",
            "place_id": place_id,  # Важно: используем ID, а не data_id
            "sort_by": "qualityScore",  # Лучше брать "полезные" для анализа вайба, или "newestRating"
            "hl": "ru",
        }

        collected_reviews = []

        # Делаем 1 запрос (обычно дает 10 отзывов, нам хватит для анализа)
        search = GoogleSearch(serp_params)
        results = search.get_dict()

        if "error" in results:
            print(f"⚠️ SerpApi Error: {results['error']}")
            return []

        reviews_data = results.get("reviews", [])

        for item in reviews_data[:max_reviews]:
            text = item.get("snippet")
            # Берем только если есть текст (звезды без текста бесполезны для LLM)
            if text:
                collected_reviews.append(text)

        return collected_reviews

    except Exception as e:
        print(f"❌ Ошибка парсинга отзывов: {e}")
        return []


# ==========================================
# 3. Оркестратор этого файла (Главная функция сбора)
# ==========================================
async def search_and_parse_places(
    query: str, lat: float, lon: float, limit_places: int = 5
):
    """
    Полный цикл: Поиск -> Парсинг отзывов -> Склейка результата
    """
    # 1. Ищем места
    candidates = await find_places_nearby(query, lat, lon, limit=limit_places)

    detailed_places = []

    # 2. Для каждого найденного места качаем отзывы
    for place in candidates:
        if place["place_id"]:
            reviews = await enrich_place_with_reviews(place["place_id"], max_reviews=7)

            place["reviews"] = reviews
            # Склеиваем отзывы в один текст для LLM / Векторной БД
            place["reviews_summary"] = (
                " ".join(reviews) if reviews else "Нет текстовых отзывов."
            )

            detailed_places.append(place)
            # Небольшая пауза чтобы не спамить (опционально)
            # time.sleep(0.5)

    return detailed_places
