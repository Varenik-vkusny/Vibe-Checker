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
from app.modules.user.activity_service import log_user_action
from app.modules.user.models import ActionType

router = APIRouter()


@router.post("/analyze", response_model=AIResponseOut, status_code=status.HTTP_200_OK)
async def get_place_analysis(
    place: AIResponseIn,
    user_auth: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    result = await get_or_create_place_analysis(url=place.url, db=db, limit=place.limit)

    try:
        payload = {
            "place_name": result.place_info.name,
            "url": place.url,
            "tags": result.ai_analysis.tags[:5] if result.ai_analysis.tags else [],
        }
        await log_user_action(db, user_auth.id, ActionType.ANALYZE, payload)
    except Exception as e:
        print(f"Log error: {e}")

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

    try:
        payload = {
            "place_a": compare_result.place_a.name,
            "place_b": compare_result.place_b.name,
            "winner": compare_result.comparison.verdict,
        }
        await log_user_action(db, user_auth.id, ActionType.COMPARE, payload)
    except Exception as e:
        print(f"Log error: {e}")

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

    await log_user_action(db, user_auth.id, ActionType.SEARCH, {"query": user.query})

    return result
