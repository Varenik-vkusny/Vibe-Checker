import time
import math
import aiohttp
import asyncio
from typing import List
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO, Location, ReviewDTO
from ..place.repo import PlaceRepo

settings = get_settings()
SERPAPI_API_KEY = settings.serpapi_key


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
    print(f"[SEARCH] Searching via SerpApi Maps: '{query}' near ({lat},{lon})")

    candidates = []
    endpoint = "https://serpapi.com/search.json"

    params = {
        "engine": "google_maps",
        "q": query,
        "type": "search",
        "hl": "ru",
        "api_key": SERPAPI_API_KEY,
    }
    
    if lat is not None and lon is not None:
        params["ll"] = f"@{lat},{lon},14z"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(endpoint, params=params) as response:
                if response.status != 200:
                    print(f"[SEARCH] SerpApi Error status: {response.status}")
                    return []
                data = await response.json()

        local_results = data.get("local_results", [])

        print(f"[SEARCH] Found {len(local_results)} raw results.")

        for item in local_results:
            gps = item.get("gps_coordinates", {})
            place_lat = gps.get("latitude")
            place_lon = gps.get("longitude")

            if lat and lon and place_lat and place_lon:
                dist = calculate_distance(lat, lon, place_lat, place_lon)
                if dist is not None and dist > 30.0:
                    continue

            cid = item.get("data_id")

            photos = []
            if "thumbnail" in item:
                photos.append(item["thumbnail"])

            dto = PlaceInfoDTO(
                place_id=str(cid) if cid else None,
                name=item.get("title", "Unknown"),
                address=item.get("address", "No Address"),
                rating=float(item.get("rating", 0.0)),
                reviews_count=int(item.get("reviews", 0)),
                location=Location(lat=place_lat, lon=place_lon),
                description=item.get("type", ""),
                photos=photos,
                reviews=[],
                url=None,
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
                    date=item.get("date", ""),
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
    place_repo: PlaceRepo,
    limit_places: int = 5,
) -> List[PlaceInfoDTO]:

    t0 = time.time()

    candidates = await find_places_nearby(query, lat, lon, limit=limit_places)

    if not candidates:
        return []

    tasks_api = []
    indices_for_api = []

    print(f"[SEARCH_AND_PARSE] Checking DB for {len(candidates)} candidates...")

    for i, place_dto in enumerate(candidates):
        if not place_dto.place_id:
            continue

        cached_place = await place_repo.get_by_google_id_with_reviews(
            place_dto.place_id
        )

        if cached_place and cached_place.reviews and len(cached_place.reviews) > 0:
            print(
                f"   [CACHE HIT] Found '{place_dto.name}' in DB with {len(cached_place.reviews)} reviews."
            )

            db_reviews_dto = [
                ReviewDTO(
                    author=rev.author_name or "Guest",
                    rating=float(rev.rating or 0.0),
                    date=rev.published_time or "",
                    text=rev.text or "",
                )
                for rev in cached_place.reviews
            ]

            place_dto.reviews = db_reviews_dto
            if cached_place.description:
                place_dto.description = cached_place.description
            if cached_place.photos:
                if isinstance(cached_place.photos, list):
                    place_dto.photos = cached_place.photos

        else:
            print(f"   [CACHE MISS] '{place_dto.name}' needs API fetch.")
            tasks_api.append(
                enrich_place_with_reviews(place_dto.place_id, max_reviews=3)
            )
            indices_for_api.append(i)

    if tasks_api:
        print(
            f"[SEARCH_AND_PARSE] Fetching reviews from API for {len(tasks_api)} places..."
        )
        reviews_results = await asyncio.gather(*tasks_api)

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
