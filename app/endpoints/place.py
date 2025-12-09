from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..modules.user.models import User
from ..modules.analysis_result.schemas import (
    AIResponseIn,
    CompareRequest,
    CompareResponse,
    AIResponseOut,
)
from ..dependencies import get_current_user, get_db
from ..services.service_analyzator import get_or_create_place_analysis
from ..services.service_comparator import compare_places_service
from ..modules.pro_mode.schemas import FinalResponse, UserRequest
from ..modules.pro_mode.main import get_places_by_vibe

router = APIRouter()


@router.post("/analyze", response_model=AIResponseOut, status_code=status.HTTP_200_OK)
async def get_place_analysis(
    place: AIResponseIn,
    user_auth: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    result = await get_or_create_place_analysis(url=place.url, db=db, limit=place.limit)

    return result


@router.post("/compare", response_model=CompareResponse, status_code=status.HTTP_200_OK)
async def compare_places(
    places: CompareRequest,
    user_auth: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    compare_result = await compare_places_service(
        urla=places.url_a, urlb=places.url_b, limit=places.limit, db=db
    )

    return compare_result


@router.post(
    "/pro_analyze", response_model=FinalResponse, status_code=status.HTTP_200_OK
)
async def pro_place_analyze(
    user: UserRequest,
    user_auth: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    result = await get_places_by_vibe(user_query=user, db=db)

    return result
