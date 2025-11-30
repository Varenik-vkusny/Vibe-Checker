from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from .. import schemas, models
from ..dependencies import get_current_user, get_db
from ..services.service_analyzator import get_or_create_place_analysis
from ..services.service_comparator import compare_places_service

router = APIRouter()


@router.post(
    "/analyze", response_model=schemas.AIResponseOut, status_code=status.HTTP_200_OK
)
async def get_place_analysis(
    place: schemas.AIResponseIn,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    result = await get_or_create_place_analysis(url=place.url, db=db, limit=place.limit)

    return result


@router.post("/compare", response_model=schemas.CompareResponse, status_code=status.HTTP_200_OK)
async def compare_places(places: schemas.CompareRequest, db: AsyncSession = Depends(get_db)):

    compare_result = await compare_places_service(urla=places.url_a, urlb=places.url_b, limit=places.limit, db=db)


    return compare_result