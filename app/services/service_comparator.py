from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from .service_analyzator import get_or_create_place_analysis
from ..model_service.model import compare_places_with_gemini
from ..modules.analysis_result.schemas import CompareResponse


async def compare_places_service(
    urla: str, urlb: str, limit: int, db: AsyncSession
) -> CompareResponse:

    try:
        response_a = await get_or_create_place_analysis(url=urla, limit=limit, db=db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка анализа Place A: {str(e)}")

    try:
        response_b = await get_or_create_place_analysis(url=urlb, limit=limit, db=db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка анализа Place B: {str(e)}")

    comparison_data = await compare_places_with_gemini(
        analysis_a=response_a.ai_analysis,
        analysis_b=response_b.ai_analysis,
        name_a=response_a.place_info.name,
        name_b=response_b.place_info.name,
    )

    return CompareResponse(
        place_a=response_a.place_info,
        place_b=response_b.place_info,
        comparison=comparison_data,
    )
