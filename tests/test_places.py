import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from httpx import AsyncClient
from unittest.mock import AsyncMock

# Импортируем модели БД
from app.modules.place.models import Place
from app.modules.analysis_result.models import AnalysisResult
from app.modules.tag.models import Tag
from app.modules.place_tag.models import PlaceTag

# Импортируем Pydantic схемы
from app.modules.place.schemas import PlaceInfoDTO, Location, PlaceInfo, ReviewDTO
from app.modules.analysis_result.schemas import (
    AIAnalysis,
    Summary,
    Scores,
    DetailedAttributes,
    ComparisonData,
    WinnerCategory,
    AIResponseOut,
)

# --- MOCK DATA ---

# ИСПРАВЛЕНИЕ 1: reviews должны быть объектами ReviewDTO, а не строками
MOCK_PLACE_DTO = PlaceInfoDTO(
    place_id="google_place_id_123",
    name="Mock Coffee Shop",
    address="Mock Street, 42",
    rating=4.8,
    reviews_count=150,
    location=Location(lat=43.2389, lon=76.8897),
    url="https://maps.google.com/?q=mock",
    description="A very cozy place.",
    photos=["http://example.com/photo.jpg"],
    reviews=[
        ReviewDTO(author="Alice", rating=5.0, date="yesterday", text="Great wifi!"),
        ReviewDTO(author="Bob", rating=3.0, date="today", text="Coffee is sour"),
    ],
)

MOCK_AI_ANALYSIS = AIAnalysis(
    summary=Summary(verdict="Good", pros=["Wifi"], cons=["Noise"]),
    scores=Scores(food=8, service=9, atmosphere=10, value=9),
    vibe_score=92,
    tags=["work", "wifi", "cozy"],
    price_level="$$",
    best_for=["work"],
    detailed_attributes=DetailedAttributes(has_wifi=True),
)

MOCK_PLACE_INFO_SCHEMA = PlaceInfo(
    name="Mock Coffee Shop",
    google_rating=4.8,
    url="https://maps.google.com/?q=mock",
    latitude=43.2389,
    longitude=76.8897,
    description="Desc",
    photos=[],
)

MOCK_COMPARISON = ComparisonData(
    winner_category=WinnerCategory(food="A", service="B", atmosphere="A", value="Draw"),
    key_differences=["Diff 1"],
    place_a_unique_pros=["Pro A"],
    place_b_unique_pros=["Pro B"],
    verdict="A is better",
)


@pytest.mark.anyio
async def test_analyze_place_new_entry(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
    mocker,
):
    """Тест создания нового анализа (вызов парсера)."""

        mocker.patch(
        "app.services.service_analyzator.get_ai_analysis",
        return_value=(MOCK_PLACE_DTO, MOCK_AI_ANALYSIS),
        new_callable=AsyncMock,
    )

    payload = {"url": "https://maps.google.com/?q=new_place", "limit": 5}
    response = await authenticated_client.post("/place/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["place_info"]["name"] == "Mock Coffee Shop"
    assert data["ai_analysis"]["vibe_score"] == 92

    # Проверка БД: Place
    place = (
        await db_session.execute(select(Place).where(Place.name == "Mock Coffee Shop"))
    ).scalar_one_or_none()
    assert place is not None

    # Проверка БД: Tags
    stmt = (
        select(Tag)
        .join(PlaceTag, PlaceTag.tag_id == Tag.id)
        .where(PlaceTag.place_id == place.id)
    )
    tags = (await db_session.execute(stmt)).scalars().all()

    tag_names = [t.name for t in tags]
    assert "work" in tag_names
    assert len(tags) == 3


@pytest.mark.anyio
async def test_analyze_place_existing_fresh(
    authenticated_client: AsyncClient, db_session: AsyncSession, mocker
):
    """Тест: данные берутся из БД, парсер НЕ вызывается."""

    # 1. Создаем Place
    existing_place = Place(
        source_url="https://maps.google.com/?q=existing",
        name="Old Coffee",
        google_rating=4.0,
    )
    db_session.add(existing_place)
    await db_session.commit()
    await db_session.refresh(existing_place)

    # 2. Создаем AnalysisResult
    # ИСПРАВЛЕНИЕ 2: Добавлены price_level и best_for,
    # так как схема AIAnalysis требует их (они не Optional)
    existing_analysis = AnalysisResult(
        place_id=existing_place.id,
        summary={"verdict": "Old", "pros": [], "cons": []},
        scores={"food": 5, "service": 5, "atmosphere": 5, "value": 5},
        vibe_score=50,
        detailed_attributes={},
        price_level="$$",  # Важно!
        best_for=["chill"],  # Важно!
    )
    db_session.add(existing_analysis)
    await db_session.commit()

    # 3. Мок парсера (чтобы убедиться, что он НЕ вызывается)
    mock_parser = mocker.patch(
        "app.services.service_analyzator.get_ai_analysis",
        side_effect=Exception("Parser called unexpectedly!"),
    )

    # 4. Запрос
    payload = {"url": "https://maps.google.com/?q=existing", "limit": 5}
    response = await authenticated_client.post("/place/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_analysis"]["vibe_score"] == 50
    mock_parser.assert_not_called()


@pytest.mark.anyio
async def test_compare_places(authenticated_client: AsyncClient, mocker):
    """Тест сравнения. Мокаем сервис анализа и сервис Gemini сравнения."""

    mock_analysis_response = AIResponseOut(
        place_info=MOCK_PLACE_INFO_SCHEMA, ai_analysis=MOCK_AI_ANALYSIS
    )

        mocker.patch(
        "app.services.service_comparator.get_or_create_place_analysis",
        return_value=mock_analysis_response,
        new_callable=AsyncMock,
    )

    mocker.patch(
        "app.services.service_comparator.compare_places_with_gemini",
        return_value=MOCK_COMPARISON,
        new_callable=AsyncMock,
    )

    payload = {
        "url_a": "https://maps.google.com/?q=A",
        "url_b": "https://maps.google.com/?q=B",
        "limit": 50,
    }

    response = await authenticated_client.post("/place/compare", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["comparison"]["verdict"] == "A is better"
    assert data["place_a"]["name"] == "Mock Coffee Shop"


@pytest.mark.anyio
async def test_pro_analyze_vector_search(authenticated_client: AsyncClient, mocker):
    """Тест Pro Mode (endpoint вызывает векторный сервис)."""

    mock_response = {
        "recommendations": [
            {
                "place_id": "1",
                "name": "Secret Bar",
                "address": "Hidden St.",
                "match_score": 99,
                "reason": "Vibe match",
            }
        ]
    }

    mocker.patch("app.endpoints.place.get_places_by_vibe", return_value=mock_response, new_callable=AsyncMock)

    payload = {
        "query": "quiet bar",
        "lat": 43.2,
        "lon": 76.9,
        "radius": 1000,
    }

    response = await authenticated_client.post("/place/pro_analyze", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) == 1
    assert data["recommendations"][0]["name"] == "Secret Bar"
