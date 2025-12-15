from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from .models import UserInteraction, LikeState
from .schemas import InteractionUpdate
from ..place.models import Place


async def update_interaction(db: AsyncSession, user_id: int, data: InteractionUpdate):

    stmt_place = select(Place).where(Place.google_place_id == data.place_id)
    result_place = await db.execute(stmt_place)
    place = result_place.scalar_one_or_none()

    if not place:
        if data.place_id.isdigit():
            stmt_place_id = select(Place).where(Place.id == int(data.place_id))
            result_place_id = await db.execute(stmt_place_id)
            place = result_place_id.scalar_one_or_none()

        if not place:
            raise HTTPException(status_code=404, detail="Place not found in database")

    real_place_id = place.id

    stmt = select(UserInteraction).where(
        UserInteraction.user_id == user_id, UserInteraction.place_id == real_place_id
    )
    result = await db.execute(stmt)
    interaction = result.scalar_one_or_none()

    if not interaction:
        interaction = UserInteraction(
            user_id=user_id,
            place_id=real_place_id,
            rating=LikeState.NONE,
            is_visited=False,
        )
        db.add(interaction)

    if data.rating is not None:
        interaction.rating = data.rating

    if data.is_visited is not None:
        interaction.is_visited = data.is_visited

    await db.commit()
    await db.refresh(interaction)
    return interaction


async def get_user_interactions_summary(db: AsyncSession, user_id: int):
    stmt = (
        select(UserInteraction)
        .options(selectinload(UserInteraction.place))
        .where(UserInteraction.user_id == user_id)
    )
    result = await db.execute(stmt)
    items = result.scalars().all()

    likes = []
    dislikes = []
    visited = []

    for i in items:
        place_name = i.place.name
        if i.rating == LikeState.LIKE:
            likes.append(place_name)
        elif i.rating == LikeState.DISLIKE:
            dislikes.append(place_name)

        if i.is_visited:
            visited.append(place_name)

    return {"likes": likes, "dislikes": dislikes, "visited": visited}
