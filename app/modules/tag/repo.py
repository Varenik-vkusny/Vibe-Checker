from ..common.repo import BaseRepo
from .models import Tag


class TagRepo(BaseRepo):
    model = Tag
