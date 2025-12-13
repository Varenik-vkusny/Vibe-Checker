from pydantic import BaseModel
from .models import LikeState


class InteractionUpdate(BaseModel):
    place_id: int
    rating: LikeState | None = None
    is_visited: bool | None = None


class InteractionOut(BaseModel):
    place_id: int
    rating: LikeState
    is_visited: bool
