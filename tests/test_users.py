import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.user.models import User
from app.security import verify_password


@pytest.mark.anyio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    payload = {
        "first_name": "New",
        "last_name": "Member",
        "email": "new@vibe.com",
        "password": "securepassword",
    }

    response = await client.post("/users/", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@vibe.com"

    # Проверяем в БД
    stmt = select(User).where(User.email == "new@vibe.com")
    db_user = (await db_session.execute(stmt)).scalar_one_or_none()
    assert db_user is not None
    # Проверяем, что пароль захеширован
    assert db_user.hashed_password != "securepassword"
    assert verify_password("securepassword", db_user.hashed_password)


@pytest.mark.anyio
async def test_register_duplicate_email(client: AsyncClient, test_user: User):
    payload = {
        "first_name": "Impostor",
        "email": test_user.email,  # email уже существует
        "password": "123",
    }
    response = await client.post("/users/", json=payload)
    assert response.status_code == 409


@pytest.mark.anyio
async def test_login_success(client: AsyncClient, test_user: User):
    # OAuth2PasswordRequestForm ожидает username и password в form-data
    payload = {
        "username": test_user.email,
        "password": "test_password",  # пароль из фикстуры test_user
    }
    response = await client.post("/users/token", data=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()

    assert response.json()["email"] == test_user.email


@pytest.mark.anyio
async def test_get_profile_not_found(client: AsyncClient):
    response = await client.get("/users/999999")
    assert response.status_code == 404
