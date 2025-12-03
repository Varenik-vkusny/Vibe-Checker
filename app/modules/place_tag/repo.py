from ..common.repo import BaseRepo
from .models import PlaceTag


class PlaceTagRepo(BaseRepo):
    model = PlaceTag
