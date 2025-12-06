from datetime import datetime
from .repo import PlaceRepo, ReviewRepo
from .schemas import PlaceInfoDTO

UPDATE_THRESHOLD_DAYS = 30


class PlaceService:

    def __init__(self, place_repo: PlaceRepo, review_repo: ReviewRepo):
        self.place_repo = place_repo
        self.review_repo = review_repo

    async def find_place_with_info(self, url: str):

        return await self.place_repo.get_place_by_url_with_full_info(url=url)

    async def create_new_place(
        self,
        source_url: str,
        name: str,
        google_rating: float,
        latitude: float,
        longitude: float,
    ):

        new_place = await self.place_repo.add(
            source_url=source_url,
            name=name,
            google_rating=google_rating,
            latitude=latitude,
            longitude=longitude,
        )

        return new_place

    def _generate_google_url(self, place_id: str) -> str:
        """Генерирует ссылку, если её нет"""
        return f"https://www.google.com/maps/search/?api=1&query=Google&query_place_id={place_id}"

    async def save_or_update_place(self, data: PlaceInfoDTO):
        """
        Создает место или обновляет его, если оно уже есть.
        Отзывы полностью перезаписываются (старые удаляются, новые добавляются).
        """
        place = await self.place_repo.get_by_google_id(data.place_id)

        final_url = data.url if data.url else self._generate_google_url(data.place_id)

        if place:
            place.name = data.name
            place.google_rating = data.rating
            place.address = data.address
            place.reviews_count = data.reviews_count
            place.latitude = data.location.lat
            place.longitude = data.location.lon
            place.updated_at = datetime.utcnow()
            place.description = data.description
            place.photos = data.photos

            # Если пришла новая ссылка, обновляем
            if data.url and place.source_url != data.url:
                place.source_url = data.url

            # Удаляем ТОЛЬКО старые отзывы (Reviews), чтобы перезаписать их
            await self.review_repo.delete(place_id=place.id)

        else:
            # === INSERT ===
            place = await self.place_repo.add(
                google_place_id=data.place_id,
                source_url=final_url,
                name=data.name,
                address=data.address,
                google_rating=data.rating,
                reviews_count=data.reviews_count,
                latitude=data.location.lat,
                longitude=data.location.lon,
                updated_at=datetime.utcnow(),
                description=data.description,
                photos=data.photos,
            )

        # 2. Сохраняем новые отзывы
        if data.reviews:
            for review_text in data.reviews:
                await self.review_repo.add(place_id=place.id, text=review_text)

        await self.place_repo.db.refresh(place)

        return place
