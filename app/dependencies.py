from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from . import security, schemas, models
from .database import AsyncLocalSession


async def get_db():
    async with AsyncLocalSession() as session:
        yield session


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):

    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Вы не авторизованы!",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, key=security.SECRET_KEY, algorithms=[security.ALGORITHM]
        )

        email: str = payload.get("sub")

        if not email:
            raise credential_exception

        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credential_exception

    db_user_result = await db.execute(
        select(models.User).where(models.User.email == token_data.email)
    )

    db_user = db_user_result.scalar_one_or_none()

    if not db_user:
        raise credential_exception

    return db_user
