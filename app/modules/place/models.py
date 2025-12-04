from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Index, ForeignKey
from sqlalchemy.orm import relationship
from ...database import Base


class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True, index=True)
    google_place_id = Column(String, unique=True, index=True, nullable=True)
    address = Column(String, nullable=True)
    source_url = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True, index=True)
    # Оригинальный рейтинг с карт (4.5)
    google_rating = Column(Float, nullable=True)
    reviews_count = Column(Integer, default=0)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    reviews = relationship(
        "PlaceReview", back_populates="place", cascade="all, delete-orphan"
    )
    analysis = relationship("AnalysisResult", back_populates="place", uselist=False)
    parsing_status = relationship(
        "ParsingRequest", back_populates="place", uselist=False
    )
    tags = relationship("PlaceTag", back_populates="place")
    favorites = relationship("Favorite", back_populates="place")

    __table_args__ = (Index("idx_geo_coords", "latitude", "longitude"),)


class PlaceReview(Base):
    __tablename__ = "place_reviews"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id"), index=True)

    author_name = Column(String, nullable=True)
    rating = Column(Integer, nullable=True)
    text = Column(Text, nullable=True)
    published_time = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    place = relationship("Place", back_populates="reviews")
