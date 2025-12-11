from sqlalchemy import select
from .models import User
from ..common.repo import BaseRepo


class UserRepo(BaseRepo):
    model = User

    async def get_all_users_with_order(self):
        result = await self.db.execute(select(User).order_by(User.id.desc()))
        users = result.scalars().all()

        return users
