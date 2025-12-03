from pydantic import BaseModel
from typing import Optional


class PlaceInfo(BaseModel):
    name: str
    google_rating: Optional[float] = None
    url: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
