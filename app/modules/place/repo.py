from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..common.repo import BaseRepo
from .models import Place, PlaceReview
from ..place_tag.models import PlaceTag


class PlaceRepo(BaseRepo):
    model = Place

    async def get_place_by_url_with_full_info(self, url: str):
        query = (
            select(self.model)
            .options(
                selectinload(self.model.analysis),
                selectinload(self.model.tags).selectinload(PlaceTag.tag),
            )
            .where(self.model.source_url == url)
        )

        result_db = await self.db.execute(query)
        existing_place = result_db.scalar_one_or_none()

        return existing_place

    async def get_by_google_id(self, google_id: str) -> Place | None:
        return await self.find_one(google_place_id=google_id)


class ReviewRepo(BaseRepo):
    model = PlaceReview
