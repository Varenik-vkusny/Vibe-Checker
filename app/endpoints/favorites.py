from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..dependencies import get_db, get_current_user
from ..modules.user.models import User
from ..modules.favorites.service import FavoritesService

router = APIRouter()

async def get_favorites_service(db: AsyncSession = Depends(get_db)):
    return FavoritesService(db)

@router.post("/{place_id}")
async def toggle_favorite(
    place_id: str,
    user: User = Depends(get_current_user),
    service: FavoritesService = Depends(get_favorites_service)
):
    result = await service.toggle_favorite(user.id, place_id)
    if not result:
        raise HTTPException(status_code=404, detail="Place not found")
    return result

@router.get("")
async def get_favorites(
    user: User = Depends(get_current_user),
    service: FavoritesService = Depends(get_favorites_service)
):
    return await service.get_bookmarks(user.id)
