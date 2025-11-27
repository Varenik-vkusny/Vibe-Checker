from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..dependencies import get_db
from .. import models, schemas, security


router = APIRouter()


@router.post("/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(user: schemas.UserIn, db: AsyncSession = Depends(get_db)):

    user_res = await db.execute(
        select(models.User).where(models.User.email == user.email)
    )

    user_db = user_res.scalar_one_or_none()

    if user_db:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Вы уже зарегестрированы, пожалуйста войдите!",
        )

    hashed_password = security.hash_password(user.password)

    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        hashed_password=hashed_password,
        email=user.email,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.get(
    "/{user_id}", response_model=schemas.UserOut, status_code=status.HTTP_200_OK
)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):

    user_res = await db.execute(select(models.User).where(models.User.id == user_id))

    user_db = user_res.scalar_one_or_none()

    if not user_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден!"
        )

    return user_db


@router.post("/token", response_model=schemas.Token, status_code=status.HTTP_200_OK)
async def auth(
    user: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):

    db_user_result = await db.execute(
        select(models.User).where(models.User.email == user.username)
    )

    db_user = db_user_result.scalar_one_or_none()

    authorization_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неправильное email или пароль!",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not db_user:
        raise authorization_exception
    if not security.verify_password(user.password, db_user.hashed_password):
        raise authorization_exception

    user_data = {"sub": db_user.email}

    access_token = security.create_access_token(data=user_data)

    return {"access_token": access_token, "token_type": "bearer"}
