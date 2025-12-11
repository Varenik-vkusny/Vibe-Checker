from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepo:
    model = None

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_one(self, **filter_by):
        stmt = select(self.model).filter_by(**filter_by)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_all(self):
        stmt = select(self.model)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def find_all_by(self, **filter_by):
        stmt = select(self.model).filter_by(**filter_by)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def add(self, **kwargs):

        new_model = self.model(**kwargs)

        self.db.add(new_model)
        await self.db.flush()

        return new_model

    async def delete(self, **filter_by):
        stmt = delete(self.model).filter_by(**filter_by)
        await self.db.execute(stmt)
        await self.db.flush()
