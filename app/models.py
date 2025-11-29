import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    ForeignKey,
    DateTime,
    Enum,
    Index,
    JSON,
)
from sqlalchemy.orm import relationship
from .database import Base


# --- ENUMS ---
class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    SERVICE = "service"


# --- 1. USERS ---
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


# --- 2. PLACES ---
class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    source_url = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True, index=True)
    # Оригинальный рейтинг с карт (4.5)
    google_rating = Column(Float, nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    analysis = relationship("AnalysisResult", back_populates="place", uselist=False)
    parsing_status = relationship(
        "ParsingRequest", back_populates="place", uselist=False
    )
    tags = relationship("PlaceTag", back_populates="place")
    favorites = relationship("Favorite", back_populates="place")

    __table_args__ = (Index("idx_geo_coords", "latitude", "longitude"),)


# --- 3. ANALYSIS RESULTS (ОБНОВЛЕНО ПОД JSON) ---
class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id"), unique=True, nullable=False)

    # Summary: Сохраняем весь объект summary (verdict, pros, cons) как JSON
    # Это проще, чем создавать 3 таблицы для плюсов и минусов
    summary = Column(JSON, nullable=False)

    # Scores: {"food": 8, "service": 4...}
    scores = Column(JSON, nullable=False)

    # Vibe Score (число для сортировки)
    vibe_score = Column(Integer, default=0)

    # Price Level ($, $$, $$$) - удобно для фильтров
    price_level = Column(String, nullable=True)

    # Best For: ["dating", "work"] - храним как JSON массив
    best_for = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    place = relationship("Place", back_populates="analysis")


# --- 4. PARSING REQUESTS ---
class ParsingRequest(Base):
    __tablename__ = "parsing_requests"
    id = Column(Integer, primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id"), unique=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, index=True)
    error_message = Column(String, nullable=True)
    last_attempt = Column(DateTime, default=datetime.utcnow)
    place = relationship("Place", back_populates="parsing_status")


# --- 5. TAGS & PLACE_TAGS ---
class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    places = relationship("PlaceTag", back_populates="tag")


class PlaceTag(Base):
    __tablename__ = "place_tags"
    place_id = Column(Integer, ForeignKey("places.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    confidence = Column(Float, default=1.0)

    place = relationship("Place", back_populates="tags")
    tag = relationship("Tag", back_populates="places")


# --- 7. FAVORITES ---
class Favorite(Base):
    __tablename__ = "favorites"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id"), primary_key=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="favorites")
    place = relationship("Place", back_populates="favorites")
