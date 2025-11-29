from fastapi import APIRouter, Depends, status
from ..services.service_layer import get_ai_analysis
from .. import schemas

router = APIRouter()


@router.post("/", response_model=schemas.AIResponseOut, status_code=status.HTTP_200_OK)
async def get_place_analysis(place: schemas.AIResponseIn):

    result = await get_ai_analysis(url=place.url, limit=place.limit)

    return result
