from sqlalchemy.ext.asyncio import AsyncSession
from .llm_service import generate_search_params, rerank_and_explain
from .vector_service import init_vector_db, insert_data_to_qdrant, search_places
from .schemas import UserRequest
from ..place.schemas import PlaceInfoDTO
from ..place.repo import PlaceRepo, ReviewRepo
from ..place.service import PlaceService
from ..parsing.pro_mode_parser import search_and_parse_places


async def get_places_by_vibe(user_query: UserRequest, db: AsyncSession):

    place_repo = PlaceRepo(db)
    review_repo = ReviewRepo(db)
    place_service = PlaceService(place_repo=place_repo, review_repo=review_repo)
    await init_vector_db()

    search_params = await generate_search_params(user_text=user_query.query)

    places_raw = await search_and_parse_places(
        query=search_params.google_search_query,
        lat=user_query.lat,
        lon=user_query.lon,
        limit_places=5,
    )

    if not places_raw:
        print("❌ Места не найдены.")
        return {"recommendations": []}

    processed_places = []

    for p_data in places_raw:
        # Превращаем сырой dict из парсера в строгий DTO
        dto = PlaceInfoDTO(
            place_id=p_data["place_id"],
            name=p_data["name"],
            address=p_data.get("address", ""),
            rating=float(p_data.get("rating", 0.0)),
            reviews_count=int(p_data.get("reviews_count", 0)),
            location=p_data["location"],
            reviews=p_data.get("reviews", []),  # Список текстов
        )

        # Магия обновления: если место есть - обновит, если нет - создаст
        # И перезапишет отзывы на свежие
        await place_service.save_or_update_place(dto)

        # Добавляем в список для Qdrant
        # (p_data уже содержит reviews_summary, который сделал парсер, используем его)
        processed_places.append(p_data)

    await insert_data_to_qdrant(processed_places)

    candidates = await search_places(user_query=user_query.query, limit=5)

    final_result = await rerank_and_explain(
        user_query=user_query.query, candidates=candidates
    )

    return final_result
