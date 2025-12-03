from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Index,
)
from sqlalchemy.orm import relationship
from ...database import Base


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
