from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Boolean,
    Enum,
    DateTime,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ...database import Base


class LikeState(str, enum.Enum):
    LIKE = "LIKE"
    DISLIKE = "DISLIKE"
    NONE = "NONE"


class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False)

    rating = Column(Enum(LikeState), default=LikeState.NONE, nullable=False)
    is_visited = Column(Boolean, default=False, nullable=False)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="interactions")
    place = relationship("Place")

    __table_args__ = (
        UniqueConstraint("user_id", "place_id", name="uq_user_place_interaction"),
    )
