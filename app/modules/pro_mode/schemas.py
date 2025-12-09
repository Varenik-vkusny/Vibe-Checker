from pydantic import BaseModel, Field
from typing import List


# Входные данные от юзера
class UserRequest(BaseModel):
    query: str
    lat: float
    lon: float
    radius: int = 2000


# Промежуточная структура (Результат работы LLM "Query Expansion")
class SearchParams(BaseModel):
    google_search_query: str
    place_type: str = "restaurant"


class PlaceData(BaseModel):
    place_id: str
    name: str
    address: str
    rating: float
    reviews_summary: str
    location: dict


class VibeRecommendation(BaseModel):
    place_id: str
    name: str
    address: str = ""
    match_score: int = Field(..., description="0-100")
    reason: str = Field(..., description="Почему это место подходит под вайб")


class FinalResponse(BaseModel):
    recommendations: List[VibeRecommendation]
