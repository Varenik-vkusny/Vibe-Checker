from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from .service_analyzator import get_or_create_place_analysis
from ..model_service.model import compare_places_with_gemini


async def compare_places_service(urla: str, urlb: str, limit: int, db: AsyncSession):

    try:
        resulta = await get_or_create_place_analysis(url=urla, limit=limit, db=db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка анализа Place A: {str(e)}")

    try:
        resultb = await get_or_create_place_analysis(url=urlb, limit=limit, db=db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка анализа Place B: {str(e)}")

    compare_result = await compare_places_with_gemini(
        place_a_json=resulta["ai_analysis"],
        place_b_json=resultb["ai_analysis"],
        name_a=resulta["place_info"]["name"],
        name_b=resultb["place_info"]["name"],
    )

    return {
        "place_a": resulta["place_info"],
        "place_b": resultb["place_info"],
        "comparison": compare_result,
    }
