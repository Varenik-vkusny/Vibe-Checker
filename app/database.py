from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from .config import get_settings


settings = get_settings()


DB_URL = settings.db_url


async_engine = create_async_engine(DB_URL)

AsyncSession = async_sessionmaker(
    bind=async_engine, autoflush=True, expire_on_commit=False
)

Base = declarative_base()
from . import models
