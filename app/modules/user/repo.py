from .models import User
from ..common.repo import BaseRepo


class UserRepo(BaseRepo):
    model = User
