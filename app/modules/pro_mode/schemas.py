
from pydantic import BaseModel, Field
from typing import List, Optional


class UserRequest(BaseModel):
    query: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    radius: int = 2000
    acoustics: Optional[int] = 50
    lighting: Optional[int] = 50
    crowdedness: Optional[int] = 50
    budget: Optional[int] = 50
    restrictions: Optional[List[str]] = []


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
    lat: Optional[float] = None
    lon: Optional[float] = None
    rating: Optional[float] = 0.0
    num_reviews: Optional[int] = 0
    price_level: Optional[str] = "$$"
    image_url: Optional[str] = None
    tags: List[str] = []


class FinalResponse(BaseModel):
    recommendations: List[VibeRecommendation]
