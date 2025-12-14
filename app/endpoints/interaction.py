from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..dependencies import get_current_user, get_db
from ..modules.user.models import User
from ..modules.interactions import service, schemas

router = APIRouter()


@router.post("/update", response_model=schemas.InteractionOut)
async def update_user_interaction(
    data: schemas.InteractionUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Установить лайк/дизлайк или отметить посещение.
    Пример body: {"place_id": 12, "rating": "LIKE"}
    Или: {"place_id": 12, "is_visited": true}
    """
    result = await service.update_interaction(db, user.id, data)
    return result
