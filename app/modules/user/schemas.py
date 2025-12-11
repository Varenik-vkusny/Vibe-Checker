from pydantic import ConfigDict, BaseModel
from typing import Optional
from datetime import datetime
from .models import UserRole


class UserIn(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    email: str
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    email: Optional[str] = None
