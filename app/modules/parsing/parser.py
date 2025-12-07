import googlemaps
from serpapi import GoogleSearch
import re
from urllib.parse import unquote
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO, Location, ReviewDTO

settings = get_settings()

GOOGLE_API_KEY = settings.google_api_key_parse
SERPAPI_KEY = settings.serpapi_key


async def parse_google_reviews(url: str, max_reviews: int = 10) -> PlaceInfoDTO:
    print(f"🚀 [PARSER] Start: {url}")

    # Инициализируем DTO с пустыми/дефолтными значениями
    # PlaceInfoDTO требует обязательные поля при создании
    place_dto = PlaceInfoDTO(
        place_id="",
        name="Unknown Place",
        location=Location(lat=None, lon=None),
        url=url,
    )

    # --- ЭТАП 1: Google Maps API ---
    try:
        gmaps = googlemaps.Client(key=GOOGLE_API_KEY)

        # Координаты из URL
        coords_match = re.search(r"@([-.\d]+),([-.\d]+)", url)
        lat_url, lng_url = (
            (float(coords_match.group(1)), float(coords_match.group(2)))
            if coords_match
            else (None, None)
        )

        # Имя из URL
        name_match = re.search(r"/place/([^/]+)/@", url)
        query_name = (
            unquote(name_match.group(1)).replace("+", " ") if name_match else ""
        )

        # Поиск Place ID
        places_result = gmaps.places(
            query=query_name,
            location=(lat_url, lng_url) if lat_url and lng_url else None,
            radius=50 if lat_url and lng_url else None,
        )

        if not places_result["results"]:
            print("❌ Place not found in Google API.")
            return place_dto

        place_id = places_result["results"][0]["place_id"]
        place_dto.place_id = place_id

        # Детали (Photos + Editorial Summary)
        details = gmaps.place(
            place_id=place_id,
            fields=[
                "name",
                "rating",
                "user_ratings_total",
                "geometry",
                "formatted_address",
                "editorial_summary",
                "photo",
            ],
        )
        data = details.get("result", {})

        # Заполнение DTO
        place_dto.name = data.get("name", "Unknown Place")
        place_dto.rating = float(data.get("rating", 0.0))
        place_dto.reviews_count = data.get("user_ratings_total", 0)
        place_dto.address = data.get("formatted_address", "")

        # Локация
        loc = data.get("geometry", {}).get("location", {})
        place_dto.location = Location(lat=loc.get("lat"), lon=loc.get("lng"))

        # Описание (если есть)
        summary_obj = data.get("editorial_summary", {})
        if summary_obj:
            place_dto.description = summary_obj.get("overview")

        # Фотографии (формируем ссылки)
        raw_photos = data.get("photos", [])
        photo_urls = []
        for p in raw_photos[:5]:
            ref = p.get("photo_reference")
            if ref:
                url_photo = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={ref}&key={GOOGLE_API_KEY}"
                photo_urls.append(url_photo)
        place_dto.photos = photo_urls

        print(f"✅ Info found: {place_dto.name}, Photos: {len(place_dto.photos)}")

    except Exception as e:
        print(f"❌ Google API Error: {e}")
        return place_dto

    # --- ЭТАП 2: SerpApi (Отзывы) ---
    if place_dto.place_id:
        print("🔄 Fetching reviews via SerpApi...")
        try:
            serp_params = {
                "api_key": SERPAPI_KEY,
                "engine": "google_maps_reviews",
                "place_id": place_dto.place_id,
                "sort_by": "newestRating",
                "hl": "ru",
                "start": 0,
            }

            collected_reviews_strs = []

            while len(collected_reviews_strs) < max_reviews:
                search = GoogleSearch(serp_params)
                results = search.get_dict()

                if "error" in results:
                    print(f"⚠️ SerpApi Error: {results['error']}")
                    break

                batch = results.get("reviews", [])
                if not batch:
                    break

                for item in batch:
                    text = item.get("snippet", "")

                    if text:
                        review = ReviewDTO(
                            author=item.get("user", {}).get("name", "Guest"),
                            rating=float(item.get("rating", 0)),
                            date=item.get("date", ""),
                            text=text,
                        )
                        place_dto.reviews.append(review)

                    if len(collected_reviews_strs) >= max_reviews:
                        break

                # Пагинация
                if (
                    "serpapi_pagination" in results
                    and "next" in results["serpapi_pagination"]
                ):
                    serp_params["start"] += 10
                else:
                    break

            place_dto.reviews = collected_reviews_strs
            print(f"✅ Reviews loaded: {len(place_dto.reviews)}")

        except Exception as e:
            print(f"❌ SerpApi Parsing Error: {e}")

    return place_dto
