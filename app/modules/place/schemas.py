from pydantic import BaseModel
from typing import Optional, List, Union


class PlaceInfo(BaseModel):
    name: str
    google_rating: Optional[float] = None
    url: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    photos: List[str] = []


class Location(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None


class ReviewDTO(BaseModel):
    author: str = "Guest"
    rating: float = 0.0
    date: str = ""
    text: str = ""


class PlaceInfoDTO(BaseModel):
    place_id: str
    name: str
    address: str = ""
    rating: float = 0.0
    reviews_count: int = 0
    location: Location
    url: Optional[str] = None
    description: Optional[str] = None  # Описание (editorial summary)
    photos: List[str] = []  # Список URL картинок (src)

    reviews: List[str] = []  # Список текстов отзывов


class ReviewItem(BaseModel):
    author: str
    rating: Union[float, str]
    date: str
    text: str
    images: List[str] = []
