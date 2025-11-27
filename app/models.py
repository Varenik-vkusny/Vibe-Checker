import enum
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
from datetime import datetime


# --- ENUMS (Строгие типы для статусов и ролей) ---
class TaskStatus(str, enum.Enum):
    PENDING = "pending"  # В очереди (ждет воркера)
    PROCESSING = "processing"  # Воркер сейчас парсит/думает
    COMPLETED = "completed"  # Готово, результат в базе
    FAILED = "failed"  # Ошибка (сайт лежал, и т.д.)


class UserRole(str, enum.Enum):
    ADMIN = "admin"  # Батя
    USER = "user"  # Обычный
    SERVICE = "service"  # Для API-ключей


# ==========================================
# 1. USERS (Пользователи)
# ==========================================
# Зачем: Авторизация, Личный кабинет, Избранное.
# Критерий: Администрирование прав доступа (RBAC).
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


# ==========================================
# 2. PLACES (Мета-реестр мест)
# ==========================================
# Зачем: Храним только "скелет" места. Ссылку и координаты.
# Оптимизация: Не храним мусор (фотки, меню). Весит мало.
class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)

    # Ссылка на источник (Google/2GIS). Уникальная, чтобы не было дублей.
    source_url = Column(String, unique=True, nullable=False, index=True)

    # Название (нужно для поиска в приложении)
    name = Column(String, nullable=True, index=True)

    # Геопозиция (FLOAT). Критически важно для карты.
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    # uselist=False означает связь 1:1
    analysis = relationship("AnalysisResult", back_populates="place", uselist=False)
    parsing_status = relationship(
        "ParsingRequest", back_populates="place", uselist=False
    )

    tags = relationship("PlaceTag", back_populates="place")
    favorites = relationship("Favorite", back_populates="place")

    # Индекс для супер-быстрого поиска "Места рядом со мной"
    __table_args__ = (Index("idx_geo_coords", "latitude", "longitude"),)


# ==========================================
# 3. ANALYSIS RESULTS (Золотой фонд)
# ==========================================
# Зачем: Храним результат работы ИИ. Это наш КЭШ.
# Оптимизация: Вместо 1000 отзывов храним 1 JSON и 1 сжатый текст.
class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True)
    # Связь 1:1 с Place
    place_id = Column(Integer, ForeignKey("places.id"), unique=True, nullable=False)

    # Вердикт ИИ текстом ("Хорошее место для свиданий...")
    summary_text = Column(Text, nullable=False)

    # Оценка атмосферы (0-100)
    vibe_score = Column(Integer, default=0)

    # Сюда кладем графики, оценки по категориям.
    # В Postgres это будет тип JSONB (Binary JSON) - супер быстро.
    # Пример: {"food": 9, "service": 5, "noise": "high"}
    details = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    place = relationship("Place", back_populates="analysis")


# ==========================================
# 4. PARSING REQUESTS (Журнал состояний)
# ==========================================
# Зачем: Чтобы знать, парсится ли ссылка сейчас или уже готова.
# Оптимизация: Дедупликация задач (не запускаем 2 парсера на 1 ссылку).
class ParsingRequest(Base):
    __tablename__ = "parsing_requests"

    id = Column(Integer, primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id"), unique=True)

    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, index=True)
    error_message = Column(String, nullable=True)  # Если упало, пишем почему
    last_attempt = Column(DateTime, default=datetime.utcnow)

    place = relationship("Place", back_populates="parsing_status")


# ==========================================
# 5. TAGS & 6. PLACE_TAGS (Тегирование)
# ==========================================
# Зачем: Умный поиск ("Найди тихие места").
# Критерий: Связь Many-to-Many.
class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)  # "Wi-Fi", "Вкусно", "Дорого"

    places = relationship("PlaceTag", back_populates="tag")


class PlaceTag(Base):
    __tablename__ = "place_tags"

    place_id = Column(Integer, ForeignKey("places.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)

    # Насколько ИИ уверен в этом теге (0.0 - 1.0)
    confidence = Column(Float, default=1.0)

    place = relationship("Place", back_populates="tags")
    tag = relationship("Tag", back_populates="places")


# ==========================================
# 7. FAVORITES (Доп. таблица)
# ==========================================
# Зачем: Чтобы юзер мог сохранять любимые места.
class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id"), primary_key=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    place = relationship("Place", back_populates="favorites")
