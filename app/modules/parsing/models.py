import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Enum,
)
from sqlalchemy.orm import relationship
from ...database import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ParsingRequest(Base):
    __tablename__ = "parsing_requests"
    id = Column(Integer, primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id"), unique=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, index=True)
    error_message = Column(String, nullable=True)
    last_attempt = Column(DateTime, default=datetime.utcnow)
    place = relationship("Place", back_populates="parsing_status")
