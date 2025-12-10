import asyncio
import time
import math
from typing import List
from outscraper import ApiClient
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO, Location, ReviewDTO

settings = get_settings()
OUTSCRAPER_API_KEY = settings.outscraper_api_key

client = ApiClient(api_key=OUTSCRAPER_API_KEY)


def calculate_distance(lat1, lon1, lat2, lon2) -> float:
    if not lat1 or not lon1 or not lat2 or not lon2:
        return 99999.0
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(
        math.radians(lat1)
    ) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


async def find_places_nearby(
    query: str, lat: float, lon: float, limit: int = 5
) -> List[PlaceInfoDTO]:

    # Construct a query string that includes location to guide the scraper
    # Outscraper works best with a query string like "pizza near lat,lon"
    # or using their language/region parameters.
    search_query = f"{query}"

    print(f"[SEARCH] Searching via Outscraper: '{search_query}' near {lat},{lon}")

    try:
        # We use google_maps_search logic
        # Note: Outscraper 'limit' is per query.
        results = await asyncio.to_thread(
            client.google_maps_search,
            query=[search_query],
            limit=limit,
            language="ru",
            region="kz",  # Optional: helps with localization
            # Injecting coordinates into the request context if supported by library wrapper
            # standard way is usually textual query or specific parameters.
            # For strict location, we rely on the query text or post-filtering.
            # To be precise, we can append coordinates to the query text:
            # query=[f"{query} near {lat},{lon}"]
        )

        # NOTE: Using "near lat,lon" in query string is the most robust way
        # for scrapers to find local data without viewport parameters.
        if not results or not results[0]:
            # Retry with explicit coordinates in query if first failed
            results = await asyncio.to_thread(
                client.google_maps_search,
                query=[f"{query} near {lat},{lon}"],
                limit=limit,
                language="ru",
            )

        flat_results = []
        for r in results:
            flat_results.extend(r)

        candidates = []

        for item in flat_results:
            place_lat = item.get("latitude")
            place_lon = item.get("longitude")

            # Distance Filter
            dist = calculate_distance(lat, lon, place_lat, place_lon)
            if dist > 15.0:
                continue

            # Mapping
            dto = PlaceInfoDTO(
                place_id=item.get("place_id"),
                name=item.get("name", "Unknown"),
                address=item.get(
                    "full_address", item.get("formatted_address", "No Address")
                ),
                rating=float(item.get("rating") or 0.0),
                reviews_count=int(item.get("reviews") or 0),
                location=Location(lat=place_lat, lon=place_lon),
                description=(item.get("about") or {}).get("summary")
                or item.get("description"),
                photos=item.get("photos", []),  # Outscraper gives URLs directly
                reviews=[],
                url=item.get("google_maps_url"),  # Useful to have
            )
            candidates.append(dto)

            if len(candidates) >= limit:
                break

        return candidates

    except Exception as e:
        print(f"Outscraper Search Error: {e}")
        return []


async def enrich_place_with_reviews(
    place_id: str, max_reviews: int = 5
) -> List[ReviewDTO]:
    """
    Fetches reviews for a specific place_id using Outscraper.
    """
    if not place_id:
        return []

    print(f"[REVIEWS] Fetching for ID: {place_id}")

    try:
        # google_maps_reviews can accept place_id directly
        results = await asyncio.to_thread(
            client.google_maps_reviews,
            query=[place_id],
            reviews_limit=max_reviews,
            language="ru",
            limit=1,
        )

        collected_reviews = []

        if results and results[0]:
            data = results[0]
            reviews_data = data.get("reviews_data", [])

            for item in reviews_data:
                text = item.get("review_text")
                if text:
                    review = ReviewDTO(
                        author=item.get("author_title", "Guest"),
                        rating=float(item.get("review_rating") or 0),
                        date=item.get("review_datetime_utc", ""),
                        text=text,
                    )
                    collected_reviews.append(review)

        return collected_reviews

    except Exception as e:
        print(f"Outscraper Review Error: {e}")
        return []


async def search_and_parse_places(
    query: str, lat: float, lon: float, limit_places: int = 5
) -> List[PlaceInfoDTO]:
    # This logic remains largely the same, just calling the updated functions

    t0 = time.time()
    candidates = await find_places_nearby(query, lat, lon, limit=limit_places)
    print(f"Search took {time.time() - t0:.2f}s")

    if not candidates:
        return []

    t1 = time.time()
    tasks = []
    for place in candidates:
        if place.place_id:
            tasks.append(enrich_place_with_reviews(place.place_id, max_reviews=7))
        else:
            tasks.append(asyncio.sleep(0, result=[]))

    reviews_results = await asyncio.gather(*tasks)
    print(f"Reviews took {time.time() - t1:.2f}s")

    for place, reviews in zip(candidates, reviews_results):
        place.reviews = reviews

    return candidates
