from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..services.service_layer import get_ai_analysis
from .. import schemas, models
from ..dependencies import get_current_user, get_db

router = APIRouter()


@router.post("/", response_model=schemas.AIResponseOut, status_code=status.HTTP_200_OK)
async def get_place_analysis(
    place: schemas.AIResponseIn,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    query = (
        select(models.Place)
        .options(
            selectinload(models.Place.analysis),
            selectinload(models.Place.tags).selectinload(models.PlaceTag.tag),
        )
        .where(models.Place.source_url == place.url)
    )

    result_db = await db.execute(query)
    existing_place = result_db.scalar_one_or_none()

    if existing_place and existing_place.analysis:

        tags_list = [pt.tag.name for pt in existing_place.tags]

        return {
            "place_info": {
                "name": existing_place.name,
                "google_rating": existing_place.google_rating,
                "url": existing_place.source_url,
                "latitude": existing_place.latitude,
                "longitude": existing_place.longitude,
            },
            "ai_analysis": {
                "summary": existing_place.analysis.summary,
                "scores": existing_place.analysis.scores,
                "vibe_score": existing_place.analysis.vibe_score,
                "tags": tags_list,
                "price_level": existing_place.analysis.price_level,
                "best_for": existing_place.analysis.best_for,
            },
        }

    # Здесь нужно будет прикрутить логику для Celery
    try:
        ai_result_raw = await get_ai_analysis(url=place.url, limit=place.limit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")

    ai_data = ai_result_raw["ai_analysis"]
    place_info = ai_result_raw["place_info"]

    if not existing_place:
        new_place = models.Place(
            source_url=place_info["url"],
            name=place_info["name"],
            google_rating=(
                float(place_info["google_rating"])
                if place_info["google_rating"]
                else 0.0
            ),
            latitude=place_info["latitude"],
            longitude=place_info["longitude"],
        )
        db.add(new_place)
        await db.flush()
        place_id = new_place.id
    else:
        place_id = existing_place.id

    new_analysis = models.AnalysisResult(
        place_id=place_id,
        summary=ai_data["summary"],  # JSON
        scores=ai_data["scores"],  # JSON
        vibe_score=ai_data["vibe_score"],
        price_level=ai_data["price_level"],
        best_for=ai_data["best_for"],  # JSON list
    )
    db.add(new_analysis)

    for tag_name in ai_data["tags"]:
        tag_res = await db.execute(
            select(models.Tag).where(models.Tag.name == tag_name)
        )
        tag = tag_res.scalar_one_or_none()

        if not tag:
            tag = models.Tag(name=tag_name)
            db.add(tag)
            await db.flush()

        link_res = await db.execute(
            select(models.PlaceTag).where(
                models.PlaceTag.place_id == place_id,
                models.PlaceTag.tag_id == tag.id,
            )
        )
        if not link_res.scalar_one_or_none():
            new_link = models.PlaceTag(place_id=place_id, tag_id=tag.id)
            db.add(new_link)

    await db.commit()

    return ai_result_raw
