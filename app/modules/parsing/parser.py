import googlemaps
from serpapi import GoogleSearch
import re
from urllib.parse import unquote
from ...config import get_settings

settings = get_settings()

# ==========================================
# 👇 ВСТАВЬ СЮДА СВОИ КЛЮЧИ
GOOGLE_API_KEY = settings.google_api_key_parse
SERPAPI_KEY = settings.serpapi_key
# ==========================================


async def parse_google_reviews(url: str, max_reviews: int = 10):
    print(f"🚀 [PARSER] Start: {url}")

    # 1. Инициализируем структуру ТОЧНО как ты просил
    result = {
        "place_name": "Unknown Place",
        "rating": "0.0",
        "reviews_count": 0,
        "reviews": [],
        "location": {"lat": None, "lon": None},
    }

    # --- ЭТАП 1: Google Maps API (Координаты, Имя, ID) ---
    try:
        gmaps = googlemaps.Client(key=GOOGLE_API_KEY)

        # Парсим URL
        coords_match = re.search(r"@([-.\d]+),([-.\d]+)", url)
        lat_url, lng_url = (
            (float(coords_match.group(1)), float(coords_match.group(2)))
            if coords_match
            else (None, None)
        )

        name_match = re.search(r"/place/([^/]+)/@", url)
        query_name = (
            unquote(name_match.group(1)).replace("+", " ") if name_match else ""
        )

        # Ищем Place ID
        places_result = gmaps.places(
            query=query_name,
            location=(lat_url, lng_url) if lat_url and lng_url else None,
            radius=50 if lat_url and lng_url else None,
        )

        if not places_result["results"]:
            print("❌ Place not found in Google API.")
            return result

        place_id = places_result["results"][0]["place_id"]

        # Получаем детали (Рейтинг, Координаты, Кол-во отзывов)
        details = gmaps.place(
            place_id=place_id,
            fields=["name", "rating", "user_ratings_total", "geometry"],
        )
        data = details.get("result", {})

        # Заполняем результат
        result["place_name"] = data.get("name", "Unknown Place")
        result["rating"] = str(
            data.get("rating", 0.0)
        )  # Приводим к строке, как в твоем формате
        result["reviews_count"] = data.get("user_ratings_total", 0)

        loc = data.get("geometry", {}).get("location", {})
        result["location"] = {
            "lat": loc.get("lat"),
            "lon": loc.get("lng"),  # Google дает lng, мы пишем в lon
        }

        print(f"✅ Info found: {result['place_name']} (ID: {place_id})")

    except Exception as e:
        print(f"❌ Google API Error: {e}")
        return result

    # --- ЭТАП 2: SerpApi (Отзывы) ---
    # Если нашли ID места, идем за отзывами
    if place_id:
        print("🔄 Fetching reviews via SerpApi...")
        try:
            serp_params = {
                "api_key": SERPAPI_KEY,
                "engine": "google_maps_reviews",
                "place_id": place_id,
                "sort_by": "newestRating",  # Сортировка: Сначала новые
                "hl": "ru",
                "start": 0,
            }

            collected_reviews = []

            while len(collected_reviews) < max_reviews:
                search = GoogleSearch(serp_params)
                results = search.get_dict()

                if "error" in results:
                    print(f"⚠️ SerpApi Error: {results['error']}")
                    break

                batch = results.get("reviews", [])
                if not batch:
                    break

                for item in batch:
                    # Фикс для картинок (строки или словари)
                    raw_imgs = item.get("images", [])
                    clean_imgs = []
                    if raw_imgs:
                        if isinstance(raw_imgs[0], str):
                            clean_imgs = raw_imgs
                        elif isinstance(raw_imgs[0], dict):
                            clean_imgs = [
                                img.get("thumbnail")
                                for img in raw_imgs
                                if img.get("thumbnail")
                            ]

                    collected_reviews.append(
                        {
                            "author": item.get("user", {}).get("name"),
                            "rating": item.get("rating"),
                            "date": item.get("date"),
                            "text": item.get("snippet"),
                            "images": clean_imgs,
                        }
                    )

                    if len(collected_reviews) >= max_reviews:
                        break

                # Пагинация
                if (
                    "serpapi_pagination" in results
                    and "next" in results["serpapi_pagination"]
                ):
                    serp_params["start"] += 10
                else:
                    break

            result["reviews"] = collected_reviews
            print(f"✅ Reviews loaded: {len(result['reviews'])}")

        except Exception as e:
            print(f"❌ SerpApi Parsing Error: {e}")

    return result
