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

    detailed_attributes = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    place = relationship("Place", back_populates="analysis")
