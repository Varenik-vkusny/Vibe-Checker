from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship
from ...database import Base


class Favorite(Base):
    __tablename__ = "favorites"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id"), primary_key=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="favorites")
    place = relationship("Place", back_populates="favorites")
