from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from ...models import User
from ... import security, schemas
from ..common.repo import BaseRepo


class UserRepo(BaseRepo):
    model = User
