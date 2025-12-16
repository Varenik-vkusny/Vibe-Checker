from pydantic import ConfigDict, BaseModel
from typing import Optional, List
from datetime import datetime
from .models import UserRole


class UserIn(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: str
    password: str


class UserPreferences(BaseModel):
    acoustics: int = 50
    lighting: int = 50
    crowdedness: int = 50
    budget: int = 50
    restrictions: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class UserPreferencesUpdate(BaseModel):
    acoustics: Optional[int] = None
    lighting: Optional[int] = None
    crowdedness: Optional[int] = None
    budget: Optional[int] = None
    restrictions: Optional[List[str]] = None


class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    email: str
    role: UserRole
    created_at: datetime
    preferences: UserPreferences

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_user(cls, user):
        """Create UserOut from User model instance"""
        return cls(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            preferences=UserPreferences(
                acoustics=user.preferences_acoustics,
                lighting=user.preferences_lighting,
                crowdedness=user.preferences_crowdedness,
                budget=user.preferences_budget,
                restrictions=user.preferences_restrictions or []
            )
        )


class Token(BaseModel):
    access_token: str
    token_type: str

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    email: Optional[str] = None
