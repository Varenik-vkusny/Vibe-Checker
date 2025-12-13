import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ...database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"  # Было "admin"
    USER = "USER"  # Было "user"
    SERVICE = "SERVICE"  # Было "service"


class ActionType(str, enum.Enum):
    SEARCH = "SEARCH"
    VIEW_PLACE = "VIEW_PLACE"
    INSPIRE_REQUEST = "INSPIRE_REQUEST"
    ANALYZE = "ANALYZE"
    COMPARE = "COMPARE"


class UserLog(Base):
    __tablename__ = "user_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_type = Column(Enum(ActionType), nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logs")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    favorites = relationship("Favorite", back_populates="user")
    logs = relationship("UserLog", back_populates="user")
