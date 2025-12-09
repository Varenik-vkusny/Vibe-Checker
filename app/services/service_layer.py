from app.model_service.model import analyze_place_with_gemini
from app.modules.parsing.parser import parse_google_reviews
from app.modules.place.schemas import PlaceInfoDTO
from app.modules.analysis_result.schemas import AIAnalysis


async def get_ai_analysis(url: str, limit: int) -> tuple[PlaceInfoDTO, AIAnalysis]:

    place_dto = await parse_google_reviews(url, limit)
    ai_analysis_result = await analyze_place_with_gemini(place_dto)

    print(f"AI Analysis завершен!. Vibe: {ai_analysis_result.vibe_score}")

    return place_dto, ai_analysis_result
