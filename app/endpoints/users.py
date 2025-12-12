from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from ..modules.user.models import User
from ..dependencies import get_db, get_current_user
from ..modules.user.schemas import UserIn, UserOut, Token
from ..modules.user.service import UserService
from ..modules.user.repo import UserRepo


router = APIRouter()


async def get_user_service(db: AsyncSession = Depends(get_db)):
    repo = UserRepo(db)
    return UserService(repo)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserIn, service: UserService = Depends(get_user_service)):

    new_user = await service.register_user(user=user)

    return new_user


@router.get("/me", response_model=UserOut, status_code=status.HTTP_200_OK)
async def get_user(me: User = Depends(get_current_user)):

    return me


@router.post("/token", response_model=Token, status_code=status.HTTP_200_OK)
async def auth(
    user: OAuth2PasswordRequestForm = Depends(),
    service: UserService = Depends(get_user_service),
):

    auth_result = await service.auth_user(email=user.username, password=user.password)

    return auth_result


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):

    service = await get_user_service(db=db)

    await service.delete_user(email=user.email)

    return
