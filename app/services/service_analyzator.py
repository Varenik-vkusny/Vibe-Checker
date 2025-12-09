import json
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from ..dependencies import get_redis_client
from ..services.service_layer import get_ai_analysis
from ..modules.place.service import PlaceService
from ..modules.place.repo import PlaceRepo, ReviewRepo
from ..modules.tag.repo import TagRepo
from ..modules.tag.service import TagService
from ..modules.place_tag.repo import PlaceTagRepo
from ..modules.place_tag.service import PlaceTagService
from ..modules.analysis_result.repo import AnalysisRepo
from ..modules.analysis_result.service import AnalysisService
from ..modules.analysis_result.schemas import (
    AIAnalysis,
    AIResponseOut,
    PlaceInfo,
    Summary,
    Scores,
    DetailedAttributes,
)

ANALYSIS_FRESHNESS_DAYS = 30
REDIS_TTL = 3600 * 24


async def get_or_create_place_analysis(
    url: str, db: AsyncSession, limit: int
) -> AIResponseOut:

    redis = get_redis_client()
    cache_key = f"place_analysis:{url}"

    cached_data = await redis.get(cache_key)
    if cached_data:
        print(f"HIT REDIS CACHE: {url}")
        data_dict = json.loads(cached_data)
        return AIResponseOut(**data_dict)

    place_repo = PlaceRepo(db)
    review_repo = ReviewRepo(db)
    place_service = PlaceService(place_repo=place_repo, review_repo=review_repo)

    tag_repo = TagRepo(db)
    tag_service = TagService(tag_repo=tag_repo)

    place_tag_repo = PlaceTagRepo(db)
    place_tag_service = PlaceTagService(place_tag_repo=place_tag_repo)

    analysis_repo = AnalysisRepo(db)
    analysis_service = AnalysisService(analysis_repo=analysis_repo)

    existing_place = await place_service.find_place_with_info(url=url)

    final_response = None

    if existing_place and existing_place.analysis:
        last_update = existing_place.analysis.created_at or datetime.min
        is_fresh = (datetime.utcnow() - last_update).days < ANALYSIS_FRESHNESS_DAYS

        if is_fresh:
            print(f"Hit Cache for URL: {url}")
            tags_list = [pt.tag.name for pt in existing_place.tags]

            ai_analysis = AIAnalysis(
                summary=Summary(**existing_place.analysis.summary),
                scores=Scores(**existing_place.analysis.scores),
                vibe_score=existing_place.analysis.vibe_score,
                tags=tags_list,
                price_level=existing_place.analysis.price_level,
                best_for=existing_place.analysis.best_for or [],
                detailed_attributes=DetailedAttributes(
                    **(existing_place.analysis.detailed_attributes or {})
                ),
            )

            place_info = PlaceInfo(
                name=existing_place.name,
                google_rating=existing_place.google_rating,
                url=existing_place.source_url,
                latitude=existing_place.latitude,
                longitude=existing_place.longitude,
                description=existing_place.description,
                photos=existing_place.photos or [],
            )
            final_response = AIResponseOut(
                place_info=place_info, ai_analysis=ai_analysis
            )
        else:
            print(f"Cache expired for {existing_place.name}, reparsing...")

    if not final_response:
        try:
            place_dto, ai_analysis_obj = await get_ai_analysis(url=url, limit=limit)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")

        saved_place = await place_service.save_or_update_place(place_dto)
        await analysis_repo.delete(place_id=saved_place.id)

        await analysis_service.create_new_analysis(
            place_id=saved_place.id,
            summary=ai_analysis_obj.summary.model_dump(),
            scores=ai_analysis_obj.scores.model_dump(),
            vibe_score=ai_analysis_obj.vibe_score,
            price_level=ai_analysis_obj.price_level,
            best_for=ai_analysis_obj.best_for,
            detailed_attributes=ai_analysis_obj.detailed_attributes.model_dump(),
        )

        for tag_name in ai_analysis_obj.tags:
            tag = await tag_service.create_tag_if_not_exists(tag_name=tag_name)
            await place_tag_service.create_tag_link_if_not_exists(
                place_id=saved_place.id, tag_id=tag.id
            )

        await db.commit()

        place_info_out = PlaceInfo(
            name=place_dto.name,
            google_rating=place_dto.rating,
            url=url,
            latitude=place_dto.location.lat,
            longitude=place_dto.location.lon,
            description=place_dto.description,
            photos=place_dto.photos,
        )

        final_response = AIResponseOut(
            place_info=place_info_out, ai_analysis=ai_analysis_obj
        )

    if final_response:
        await redis.set(cache_key, final_response.model_dump_json(), ex=REDIS_TTL)

    return final_response
