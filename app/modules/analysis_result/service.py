from .repo import AnalysisRepo
from typing import List


class AnalysisService:

    def __init__(self, analysis_repo: AnalysisRepo):
        self.analysis_repo = analysis_repo

    async def create_new_analysis(
        self,
        place_id: int,
        summary: dict,
        scores: dict,
        vibe_score: int,
        price_level: str,
        best_for: List[dict],
        detailed_attributes: dict,
    ):

        new_analysis = await self.analysis_repo.add(
            place_id=place_id,
            summary=summary,
            scores=scores,
            vibe_score=vibe_score,
            price_level=price_level,
            best_for=best_for,
            detailed_attributes=detailed_attributes,
        )

        return new_analysis
