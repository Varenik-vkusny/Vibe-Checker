from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from ..services.service_layer import get_ai_analysis
from ..modules.place.service import PlaceService
from ..modules.place.repo import PlaceRepo, ReviewRepo

# Импортируем DTO для сохранения
from ..modules.place.schemas import PlaceInfoDTO
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


async def get_or_create_place_analysis(
    url: str, db: AsyncSession, limit: int
) -> AIResponseOut:

    # Инициализация репозиториев
    place_repo = PlaceRepo(db)
    review_repo = ReviewRepo(db)
    place_service = PlaceService(place_repo=place_repo, review_repo=review_repo)

    tag_repo = TagRepo(db)
    tag_service = TagService(tag_repo=tag_repo)

    place_tag_repo = PlaceTagRepo(db)
    place_tag_service = PlaceTagService(place_tag_repo=place_tag_repo)

    analysis_repo = AnalysisRepo(db)
    analysis_service = AnalysisService(analysis_repo=analysis_repo)

    # 1. Проверка кэша
    existing_place = await place_service.find_place_with_info(url=url)

    if existing_place and existing_place.analysis:
        last_update = existing_place.analysis.created_at or datetime.min
        is_fresh = (datetime.utcnow() - last_update).days < ANALYSIS_FRESHNESS_DAYS

        if is_fresh:
            print(f"💎 Hit Cache for URL: {url}")
            tags_list = [pt.tag.name for pt in existing_place.tags]

            # Собираем объекты из БД
            ai_analysis = AIAnalysis(
                summary=Summary(**existing_place.analysis.summary),  # JSON -> Pydantic
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
                photos=existing_place.photos or [],  # Защита от None
            )
            return AIResponseOut(place_info=place_info, ai_analysis=ai_analysis)
        else:
            print(f"⌛ Cache expired for {existing_place.name}, reparsing...")

    # 2. Если кэша нет - идем в сервис (Парсинг + AI)
    try:
        # Получаем два объекта: DTO (для БД) и Analysis (для БД и ответа)
        place_dto, ai_analysis_obj = await get_ai_analysis(url=url, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")

    # 3. Сохраняем Место (Place + Reviews)
    # place_dto уже содержит список строк отзывов, так что просто передаем его
    saved_place = await place_service.save_or_update_place(place_dto)

    await analysis_repo.delete(place_id=saved_place.id)

    await analysis_service.create_new_analysis(
        place_id=saved_place.id,
        summary=ai_analysis_obj.summary.model_dump(),  # Pydantic -> Dict для JSON поля в БД
        scores=ai_analysis_obj.scores.model_dump(),
        vibe_score=ai_analysis_obj.vibe_score,
        price_level=ai_analysis_obj.price_level,
        best_for=ai_analysis_obj.best_for,
        detailed_attributes=ai_analysis_obj.detailed_attributes.model_dump(),
    )

    # 5. Сохраняем Теги
    for tag_name in ai_analysis_obj.tags:
        tag = await tag_service.create_tag_if_not_exists(tag_name=tag_name)
        await place_tag_service.create_tag_link_if_not_exists(
            place_id=saved_place.id, tag_id=tag.id
        )

    await db.commit()

    # 6. Формируем ответ для контроллера
    place_info_out = PlaceInfo(
        name=place_dto.name,
        google_rating=place_dto.rating,
        url=url,
        latitude=place_dto.location.lat,
        longitude=place_dto.location.lon,
        description=place_dto.description,
        photos=place_dto.photos,
    )

    return AIResponseOut(place_info=place_info_out, ai_analysis=ai_analysis_obj)
