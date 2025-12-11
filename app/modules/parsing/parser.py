import aiohttp
import re
from typing import Optional
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO, Location, ReviewDTO

settings = get_settings()

# Важно: Убедись, что в конфиге теперь ключ от SerpApi, а не от Serper
SERPAPI_API_KEY = settings.serpapi_key  # Или переименуй в settings.serpapi_api_key


async def resolve_short_url(short_url: str) -> str:
    """
    Асинхронно раскрывает короткие ссылки (goo.gl, maps.app.goo.gl)
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.head(short_url, allow_redirects=True) as response:
                return str(response.url)
    except Exception as e:
        print(f"[PARSER] Error resolving URL: {e}")
        return short_url


def extract_data_id(url: str) -> Optional[str]:
    """
    Вытаскивает data_id (CID) вида 0x...:0x... из ссылки
    """
    match = re.search(r"(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)", url)
    if match:
        return match.group(1)
    return None


async def parse_google_reviews(url: str, max_reviews: int = 10) -> PlaceInfoDTO:
    print(f"[PARSER] Start SerpApi (Maps) for URL: {url}")

    # Инициализируем пустой DTO
    place_dto = PlaceInfoDTO(
        place_id="",
        name="Unknown Place",
        location=Location(lat=None, lon=None),
        url=url,
        reviews=[],
        photos=[],
    )

    # 1. Обработка ссылки (раскрытие редиректа + поиск ID)
    full_url = url
    if "goo.gl" in url or "maps.app" in url or "bit.ly" in url:
        full_url = await resolve_short_url(url)

    data_id = extract_data_id(full_url)

    if not data_id:
        print("[PARSER] Could not extract 'data_id' (CID) from URL.")
        # Можно попробовать fallback поиск, но пока вернем пустой, чтобы не гадать
        return place_dto

    place_dto.place_id = data_id

    # 2. Запрос к SerpApi (движок google_maps_reviews)
    endpoint = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps_reviews",
        "data_id": data_id,
        "api_key": SERPAPI_API_KEY,
        "hl": "ru",
        "sort_by": "newestFirst",
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(endpoint, params=params) as response:
                if response.status != 200:
                    print(f"[PARSER] SerpApi Error: {response.status}")
                    return place_dto

                data = await response.json()

        if "error" in data:
            print(f"[PARSER] SerpApi returned error: {data['error']}")
            return place_dto

        # 3. Маппинг данных (Place Info)
        place_info = data.get("place_info", {})

        place_dto.name = place_info.get("title", "Unknown Place")
        place_dto.address = place_info.get("address", "")
        place_dto.rating = float(place_info.get("rating", 0.0))
        place_dto.reviews_count = int(place_info.get("reviews", 0))

        # Координаты
        gps = place_info.get("gps_coordinates", {})
        if gps:
            place_dto.location = Location(
                lat=gps.get("latitude"), lon=gps.get("longitude")
            )

        # Фото (SerpApi иногда дает их в place_info, но чаще это отдельный запрос.
        # Здесь возьмем хотя бы thumbnail если есть в отзывах или images_results если бы мы юзали другой движок)
        # В google_maps_reviews фото самого места не всегда приходят массивом,
        # но часто есть поле images в result.
        # В данном движке фото чаще лежат в 'local_results' при поиске, а тут мы берем конкретное место.
        # Попробуем взять из поля photos, если оно есть (иногда бывает), или оставим пустым.
        # Для надежности можно использовать изображение из первого отзыва, если совсем нет, но пока оставим []
        place_dto.photos = []

        # 4. Маппинг отзывов
        raw_reviews = data.get("reviews", [])

        for item in raw_reviews:
            snippet = item.get("snippet") or item.get("text")

            # Если текста нет, можно пропустить или сохранить пустой
            if snippet:
                review_dto = ReviewDTO(
                    author=item.get("user", {}).get("name", "Guest"),
                    rating=float(item.get("rating") or 0.0),
                    date=item.get("date", ""),
                    text=snippet,
                )
                place_dto.reviews.append(review_dto)

            # Вытаскиваем фото из отзывов, если у места нет фото
            if not place_dto.photos and "images" in item:
                # item['images'] - список ссылок (или объектов)
                # SerpApi обычно отдает прямые ссылки в списке images
                images_list = item.get("images", [])
                for img in images_list:
                    if isinstance(img, str):
                        place_dto.photos.append(img)
                    elif isinstance(img, dict) and "thumbnail" in img:
                        place_dto.photos.append(img["thumbnail"])

            if len(place_dto.reviews) >= max_reviews:
                break

        # Ограничим фото
        place_dto.photos = place_dto.photos[:5]

        print(
            f"[PARSER] Success: {place_dto.name}, Reviews extracted: {len(place_dto.reviews)}"
        )

    except Exception as e:
        print(f"[PARSER] Critical Error: {e}")
        import traceback

        traceback.print_exc()

    return place_dto
