from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.dependencies import get_db, get_current_user
from app.modules.user.models import User
from app.modules.recommendation.service import inspire_me


router = APIRouter()


class InspireRequest(BaseModel):
    lat: float
    lon: float


@router.post("/inspire", status_code=status.HTTP_200_OK)
async def get_inspiration(
    request: InspireRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate personalized recommendations based on user history (Smart Discovery).
    """
    try:
        results = await inspire_me(
            user_id=current_user.id, lat=request.lat, lon=request.lon, db=db
        )
        return results
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in inspire_me: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
