from pydantic import BaseModel
from typing import Optional, List


class PlaceInfo(BaseModel):
    name: str
    google_rating: Optional[float] = None
    url: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PlaceInfoDTO(BaseModel):
    place_id: str
    name: str
    address: str = ""
    rating: float = 0.0
    reviews_count: int = 0
    location: dict

    reviews: List[str] = []  # Список текстов отзывов
