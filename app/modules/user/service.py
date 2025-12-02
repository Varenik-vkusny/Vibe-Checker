from fastapi import HTTPException, status
from .repo import UserRepo
from ... import schemas, security


class UserService:

    def __init__(self, user_repo: UserRepo):
        self.user_repo = user_repo

    async def register_user(self, user: schemas.UserIn):
        user_db = await self.user_repo.find_one(email=user.email)

        if user_db:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Вы уже зарегестрированы, пожалуйста войдите!",
            )

        hashed_password = security.hash_password(user.password)

        new_user = await self.user_repo.add(
            first_name=user.first_name,
            last_name=user.last_name,
            hashed_password=hashed_password,
            email=user.email,
        )

        await self.user_repo.db.commit()
        await self.user_repo.db.refresh(new_user)

        return new_user

    async def auth_user(self, email: str, password: str):
        db_user = await self.user_repo.find_one(email=email)

        authorization_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильное email или пароль!",
            headers={"WWW-Authenticate": "Bearer"},
        )

        if not db_user:
            raise authorization_exception
        if not security.verify_password(password, db_user.hashed_password):
            raise authorization_exception

        user_data = {"sub": db_user.email}

        access_token = security.create_access_token(data=user_data)

        return {"access_token": access_token, "token_type": "bearer"}

    async def get_user(self, id: int):

        user_db = await self.user_repo.find_one(id=id)

        if not user_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден!"
            )

        return user_db
