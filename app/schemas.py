from pydantic import ConfigDict, BaseModel
from typing import Optional, List
from datetime import datetime


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


class AIResponseIn(BaseModel):
    url: str
    limit: int


class PlaceInfo(BaseModel):
    name: str
    google_rating: float
    url: str
    latitude: float
    longitude: float


class Summary(BaseModel):
    verdict: str
    pros: List[str]
    cons: List[str]


class Scores(BaseModel):
    food: int
    service: int
    atmosphere: int
    value: int


class AIAnalysis(BaseModel):
    summary: Summary
    scores: Scores
    vibe_score: int
    tags: List[str]
    price_level: str
    best_for: List[str]


class AIResponseOut(BaseModel):
    place_info: PlaceInfo
    ai_analysis: AIAnalysis

    model_config = ConfigDict(from_attributes=True)
