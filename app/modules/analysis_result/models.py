from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    JSON,
)
from sqlalchemy.orm import relationship
from ...database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True)
    place_id = Column(Integer, ForeignKey("places.id"), unique=True, nullable=False)
    summary = Column(JSON, nullable=False)
    scores = Column(JSON, nullable=False)
    vibe_score = Column(Integer, default=0)
    price_level = Column(String, nullable=True)
    best_for = Column(JSON, nullable=True)
    detailed_attributes = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    place = relationship("Place", back_populates="analysis")
