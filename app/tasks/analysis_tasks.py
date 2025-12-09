import asyncio
import logging
from ..celery_app import celery
from ..database import AsyncLocalSession
from ..services.service_layer import get_ai_analysis
from ..modules.place.service import PlaceService
from ..modules.place.repo import PlaceRepo, ReviewRepo
from ..modules.tag.repo import TagRepo
from ..modules.tag.service import TagService
from ..modules.place_tag.repo import PlaceTagRepo
from ..modules.place_tag.service import PlaceTagService
from ..modules.analysis_result.repo import AnalysisRepo
from ..modules.analysis_result.service import AnalysisService
from ..dependencies import get_redis_client

logger = logging.getLogger(__name__)


@celery.task(name="analyze_place_task")
def analyze_place_task(url: str, limit: int):
    return asyncio.run(_process_analysis_async(url, limit))


async def _process_analysis_async(url: str, limit: int):
    logger.info(f"WORKER: Начал обновление для {url}")

    async with AsyncLocalSession() as db:
        try:
            place_dto, ai_analysis_obj = await get_ai_analysis(url=url, limit=limit)

            place_service = PlaceService(PlaceRepo(db), ReviewRepo(db))
            tag_service = TagService(TagRepo(db))
            place_tag_service = PlaceTagService(PlaceTagRepo(db))
            analysis_repo = AnalysisRepo(db)
            analysis_service = AnalysisService(analysis_repo)

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

            redis = get_redis_client()
            cache_key = f"place_analysis:{url}"
            await redis.delete(cache_key)

            logger.info(f"WORKER: Успешно обновил {url}")
            return f"Updated {saved_place.name}"

        except Exception as e:
            logger.error(f"WORKER ERROR: {e}")
            await db.rollback()
            raise e
