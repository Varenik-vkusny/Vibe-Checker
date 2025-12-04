from datetime import datetime, timedelta
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

    async def save_or_update_place(self, data: PlaceInfoDTO):
        """
        Создает место или обновляет его, если оно уже есть.
        Отзывы полностью перезаписываются (старые удаляются, новые добавляются).
        """
        place = await self.place_repo.get_by_google_id(data.place_id)

        if place:
            place.name = data.name
            place.google_rating = data.rating
            place.address = data.address
            place.reviews_count = data.reviews_count
            place.latitude = data.location["lat"]
            place.longitude = data.location["lon"]
            place.updated_at = datetime.utcnow()

            # Удаляем старые отзывы (чтобы залить актуальные)
            await self.place_repo.delete(id=place.id)

        else:
            # === INSERT ===
            place = await self.place_repo.add(
                google_place_id=data.place_id,
                name=data.name,
                address=data.address,
                google_rating=data.rating,
                reviews_count=data.reviews_count,
                latitude=data.location["lat"],
                longitude=data.location["lon"],
                updated_at=datetime.utcnow(),
            )
            await self.place_repo.db.refresh(place)

        # 2. Сохраняем новые отзывы
        if data.reviews:
            for review_text in data.reviews:
                # Используем ReviewRepo, а не PlaceRepo!
                await self.review_repo.add(place_id=place.id, text=review_text)

        # 3. Фиксируем транзакцию
        await self.place_repo.db.commit()
        await self.place_repo.db.refresh(place)  # Чтобы подтянулись связи, если нужно

        return place
