import redis.asyncio as redis
from .config import get_settings

settings = get_settings()

redis_pool = redis.ConnectionPool.from_url(
    settings.redis_url, encoding="utf-8", decode_responses=True
)
