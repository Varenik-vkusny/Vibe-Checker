from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ...modules.common.repo import BaseRepo
from .models import Favorite

from ...modules.place.models import Place
from ...modules.place_tag.models import PlaceTag

class FavoritesRepo(BaseRepo):
    model = Favorite

    async def get_favorites_by_user(self, user_id: int):
        stmt = (
            select(self.model)
            .where(self.model.user_id == user_id)
            .options(
                selectinload(self.model.place)
                .selectinload(Place.tags)
                .selectinload(PlaceTag.tag)
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()
