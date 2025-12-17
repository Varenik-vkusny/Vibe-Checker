import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from httpx import AsyncClient
from unittest.mock import AsyncMock

from app.modules.place.models import Place
from app.modules.analysis_result.models import AnalysisResult
from app.modules.tag.models import Tag
from app.modules.place_tag.models import PlaceTag

from app.modules.place.schemas import PlaceInfoDTO, Location, PlaceInfo, ReviewDTO
from app.modules.analysis_result.schemas import (
    AIAnalysis,
    Summary,
    Scores,
    DetailedAttributes,
    ComparisonData,
    WinnerCategory,
    AIResponseOut,
    ComparisonScores,
)

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
    scores=ComparisonScores(
        place_a=Scores(food=32, service=54, atmosphere=65, value=98),
        place_b=Scores(food=52, service=52, atmosphere=67, value=69),
    ),
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

    place = (
        await db_session.execute(select(Place).where(Place.name == "Mock Coffee Shop"))
    ).scalar_one_or_none()
    assert place is not None

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

    existing_place = Place(
        source_url="https://maps.google.com/?q=existing",
        name="Old Coffee",
        google_rating=4.0,
    )
    db_session.add(existing_place)
    await db_session.commit()
    await db_session.refresh(existing_place)

    existing_analysis = AnalysisResult(
        place_id=existing_place.id,
        summary={"verdict": "Old", "pros": [], "cons": []},
        scores={"food": 5, "service": 5, "atmosphere": 5, "value": 5},
        vibe_score=50,
        detailed_attributes={},
        price_level="$$",
        best_for=["chill"],
    )
    db_session.add(existing_analysis)
    await db_session.commit()

    mock_parser = mocker.patch(
        "app.services.service_analyzator.get_ai_analysis",
        side_effect=Exception("Parser called unexpectedly!"),
    )

    payload = {"url": "https://maps.google.com/?q=existing", "limit": 5}
    response = await authenticated_client.post("/place/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["ai_analysis"]["vibe_score"] == 50
    mock_parser.assert_not_called()


@pytest.mark.anyio
async def test_compare_places(authenticated_client: AsyncClient, mocker):

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

    mocker.patch(
        "app.endpoints.place.get_places_by_vibe",
        return_value=mock_response,
        new_callable=AsyncMock,
    )

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
