from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from ..dependencies import get_db
from ..modules.user.schemas import UserIn, UserOut, Token
from ..modules.user.service import UserService
from ..modules.user.repo import UserRepo


router = APIRouter()


async def get_user_service(db: AsyncSession = Depends(get_db)):
    repo = UserRepo(db)
    return UserService(repo)


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserIn, service: UserService = Depends(get_user_service)):

    new_user = await service.register_user(user=user)

    return new_user


@router.get("/{user_id}", response_model=UserOut, status_code=status.HTTP_200_OK)
async def get_user(user_id: int, service: UserService = Depends(get_user_service)):

    user_db = await service.get_user(id=user_id)

    return user_db


@router.post("/token", response_model=Token, status_code=status.HTTP_200_OK)
async def auth(
    user: OAuth2PasswordRequestForm = Depends(),
    service: UserService = Depends(get_user_service),
):

    auth_result = await service.auth_user(email=user.username, password=user.password)

    return auth_result
