import asyncio
import re
from urllib.parse import unquote
from outscraper import ApiClient
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO, Location, ReviewDTO

settings = get_settings()

# We only need the Outscraper key now for reviews/search
OUTSCRAPER_API_KEY = settings.outscraper_api_key  # Make sure to add this to your config
# If you still use Google Maps API for photos/static maps, keep it:
GOOGLE_API_KEY = settings.google_api_key_parse

client = ApiClient(api_key=OUTSCRAPER_API_KEY)


async def parse_google_reviews(url: str, max_reviews: int = 10) -> PlaceInfoDTO:
    print(f"[PARSER] Start: {url}")

    place_dto = PlaceInfoDTO(
        place_id="",
        name="Unknown Place",
        location=Location(lat=None, lon=None),
        url=url,
        reviews=[],
    )

    try:
        # Outscraper can handle the Google Maps URL directly.
        # It will fetch details AND reviews in one go.
        results = await asyncio.to_thread(
            client.google_maps_reviews,
            query=[url],
            reviews_limit=max_reviews,
            language="ru",
            limit=1,  # We expect 1 place from 1 URL
        )

        if not results or not results[0]:
            print("Outscraper returned no results.")
            return place_dto

        data = results[0]  # The first place found

        # 1. Map Basic Info
        place_dto.place_id = data.get("place_id", "unknown")
        place_dto.name = data.get("name", "Unknown Place")
        place_dto.address = data.get("full_address", data.get("formatted_address", ""))
        place_dto.rating = float(data.get("rating") or 0.0)
        place_dto.reviews_count = int(data.get("reviews") or 0)

        # 2. Map Location
        place_dto.location = Location(
            lat=data.get("latitude"), lon=data.get("longitude")
        )

        # 3. Map Description (Outscraper often returns 'about' or 'description')
        place_dto.description = (data.get("about") or {}).get("summary") or data.get(
            "description", ""
        )

        # 4. Map Photos
        # Outscraper returns photo URLs.
        # If you prefer Google API photos, you can still use the place_id later,
        # but Outscraper gives you direct links here.
        place_dto.photos = data.get("photos", [])[:5]

        # 5. Map Reviews
        reviews_data = data.get("reviews_data", [])
        for item in reviews_data:
            review_text = item.get("review_text", "")
            if review_text:
                review = ReviewDTO(
                    author=item.get("author_title", "Guest"),
                    rating=float(item.get("review_rating") or 0),
                    date=item.get("review_datetime_utc", ""),
                    text=review_text,
                )
                place_dto.reviews.append(review)

        print(f"Info found: {place_dto.name}, Reviews loaded: {len(place_dto.reviews)}")

    except Exception as e:
        print(f"Outscraper Error: {e}")

    return place_dto
