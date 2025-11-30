from pydantic import ConfigDict, BaseModel
from typing import Optional, List
from datetime import datetime


# --- Схемы для регистрации и авторизации ---
class UserIn(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    email: Optional[str] = None


# --- Схемы для первой фичи, а также валидации данных от парсера и ИИ ---
class AIResponseIn(BaseModel):
    url: str
    limit: int


class PlaceInfo(BaseModel):
    name: str
    google_rating: Optional[float] = None
    url: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class Summary(BaseModel):
    verdict: str
    pros: List[str]
    cons: List[str]


class Scores(BaseModel):
    food: int
    service: int
    atmosphere: int
    value: int


class DetailedAttributes(BaseModel):
    has_wifi: Optional[bool] = None
    has_parking: Optional[bool] = None
    outdoor_seating: Optional[bool] = None
    noise_level: Optional[str] = None  # Low, Medium, High
    service_speed: Optional[str] = None  # Fast, Average, Slow
    cleanliness: Optional[str] = None  # Low, Medium, High

    model_config = ConfigDict(from_attributes=True)


class AIAnalysis(BaseModel):
    summary: Summary
    scores: Scores
    vibe_score: int
    tags: List[str]
    price_level: str
    best_for: List[str]
    detailed_attributes: DetailedAttributes


class AIResponseOut(BaseModel):
    place_info: PlaceInfo
    ai_analysis: AIAnalysis

    model_config = ConfigDict(from_attributes=True)


# --- Схемы для фичи сравнения ---
class CompareRequest(BaseModel):
    url_a: str
    url_b: str
    limit: int = 50


class WinnerCategory(BaseModel):
    food: str
    service: str
    atmosphere: str
    value: str


class ComparisonData(BaseModel):
    winner_category: WinnerCategory
    key_differences: List[str]
    place_a_unique_pros: List[str]
    place_b_unique_pros: List[str]
    verdict: str


class CompareResponse(BaseModel):
    place_a: PlaceInfo
    place_b: PlaceInfo
    comparison: ComparisonData
