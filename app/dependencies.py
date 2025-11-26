from .database import AsyncSession


async def get_db():
    async with AsyncSession() as session:
        yield session
