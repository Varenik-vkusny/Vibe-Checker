import pytest
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import AsyncMock, MagicMock

from app.database import Base
from app.dependencies import get_db, get_redis_client
from app.main import app
from app.security import hash_password, create_access_token

from app.modules.user.models import User

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_async_engine = create_async_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool
)

TestAsyncLocalSession = async_sessionmaker(
    bind=test_async_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def mock_redis_global(mocker):

    mock_redis_instance = AsyncMock()
    mock_redis_instance.get.return_value = None
    mock_redis_instance.set.return_value = True
    mock_redis_instance.delete.return_value = True

    mocker.patch("redis.asyncio.Redis", return_value=mock_redis_instance)

    mocker.patch("redis.asyncio.ConnectionPool.from_url", return_value=MagicMock())
    mocker.patch("app.config_redis.redis_pool", MagicMock())

    mocker.patch(
        "app.services.service_analyzator.get_redis_client",
        return_value=mock_redis_instance,
    )
    mocker.patch("app.dependencies.get_redis_client", return_value=mock_redis_instance)

    app.dependency_overrides[get_redis_client] = lambda: mock_redis_instance

    return mock_redis_instance


@pytest.fixture(autouse=True, scope="function")
async def prepare_database():
    async with test_async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestAsyncLocalSession() as session:
        yield session


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        email="test@example.com",
        first_name="Test",
        last_name="User",
        hashed_password=hash_password("test_password"),
        role="USER",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
async def authenticated_client(client: AsyncClient, test_user: User) -> AsyncClient:
    token_data = {"sub": test_user.email}
    access_token = create_access_token(token_data)
    client.headers["Authorization"] = f"Bearer {access_token}"
    return client
