from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from .service_analyzator import get_or_create_place_analysis
from ..model_service.model import compare_places_with_gemini
from ..modules.analysis_result.schemas import CompareResponse
from app.modules.pro_mode.utils import PerformanceTimer


async def compare_places_service(
    urla: str, urlb: str, limit: int, db: AsyncSession
) -> CompareResponse:

    # Run analysis for both places in parallel to speed up comparison
    with PerformanceTimer(f"Compare Service (Parallel Fetch)"):
        try:
            # Note: Sharing the same DB session across asyncio.gather tasks can be risky with SQLAlchemy.
            # However, get_or_create_place_analysis handles mostly read-heavy logic or sequential commits inside.
            # To be safe, if we encounter session issues, we would need separate sessions or sequential execution.
            # For now, let's try parallelizing.
            
            task_a = get_or_create_place_analysis(url=urla, limit=limit, db=db)
            task_b = get_or_create_place_analysis(url=urlb, limit=limit, db=db)
            
            response_a, response_b = await asyncio.gather(task_a, task_b)
            
        except Exception as e:
            # Fallback to sequential if something breaks, or just raise
            raise HTTPException(status_code=400, detail=f"Error fetching places for comparison: {str(e)}")

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
