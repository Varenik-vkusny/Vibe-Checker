from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import UserInteraction, LikeState
from .schemas import InteractionUpdate


async def update_interaction(db: AsyncSession, user_id: int, data: InteractionUpdate):
    # 1. Ищем существующую запись
    stmt = select(UserInteraction).where(
        UserInteraction.user_id == user_id, UserInteraction.place_id == data.place_id
    )
    result = await db.execute(stmt)
    interaction = result.scalar_one_or_none()

    # 2. Если нет - создаем
    if not interaction:
        interaction = UserInteraction(
            user_id=user_id,
            place_id=data.place_id,
            rating=LikeState.NONE,
            is_visited=False,
        )
        db.add(interaction)

    # 3. Обновляем поля, если они пришли
    if data.rating is not None:
        interaction.rating = data.rating

    if data.is_visited is not None:
        interaction.is_visited = data.is_visited

    await db.commit()
    await db.refresh(interaction)
    return interaction


async def get_user_interactions_summary(db: AsyncSession, user_id: int):
    """
    Получает списки для AI: что лайкнул, что дизлайкнул, где был.
    Нужно для генерации контекста.
    """
    # Загружаем всё сразу с названиями мест
    stmt = (
        select(UserInteraction)
        .where(UserInteraction.user_id == user_id)
        .join(UserInteraction.place)
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
