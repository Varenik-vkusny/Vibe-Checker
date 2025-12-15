import time
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from .llm_service import generate_search_params, smart_rerank, explain_selection
from .vector_service import init_vector_db, insert_data_to_qdrant, search_places
from .schemas import UserRequest
from ..place.repo import PlaceRepo, ReviewRepo
from ..place.service import PlaceService
from ..parsing.pro_mode_parser import search_and_parse_places

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def get_places_by_vibe(user_query: UserRequest, db: AsyncSession):
    start_total = time.time()
    logger.info(f"[START] Processing query: '{user_query.query}'")

    place_repo = PlaceRepo(db)
    review_repo = ReviewRepo(db)
    place_service = PlaceService(place_repo=place_repo, review_repo=review_repo)

    t_start = time.time()
    await init_vector_db()
    logger.info(f"[1/6] Qdrant Init: {time.time() - t_start:.2f}s")

    t_start = time.time()
    search_params = await generate_search_params(user_text=user_query.query)
    logger.info(f"Generated query: {search_params.google_search_query}")
    logger.info(f"[2/6] LLM (Query Gen): {time.time() - t_start:.2f}s")

    t_start = time.time()
    places_dtos = await search_and_parse_places(
        query=search_params.google_search_query,
        lat=user_query.lat,
        lon=user_query.lon,
        place_repo=place_repo,
        limit_places=15,
    )
    logger.info(f"[3/6] Parsing (Google + Reviews): {time.time() - t_start:.2f}s")

    if not places_dtos:
        logger.warning("Places not found by parser.")
        return {"recommendations": []}

    t_start = time.time()
    for dto in places_dtos:
        await place_service.save_or_update_place(dto)
    await db.commit()
    logger.info(f"[4/6] SQL Save: {time.time() - t_start:.2f}s")

    t_start = time.time()
    await insert_data_to_qdrant(places_dtos)

    candidates = await search_places(
        user_query=user_query.query,
        lat=user_query.lat,
        lon=user_query.lon,
        radius_meters=user_query.radius,
        limit=15,
    )
    logger.info(f"[5/6] Qdrant (Upsert + Search): {time.time() - t_start:.2f}s")

    t_start = time.time()

    for c in candidates:
        print(f"Name: {c.get('name')}")
        print(f"Summary data: {c.get('reviews_summary')}")
        print(f"Address: {c.get('address')}")
        print("-" * 20)

    top_candidates = smart_rerank(
        user_query=user_query.query,
        candidates=candidates,
        top_k=5,
        acoustics=user_query.acoustics,
        lighting=user_query.lighting,
        crowdedness=user_query.crowdedness,
        budget=user_query.budget,
        restrictions=user_query.restrictions
    )
    final_result = await explain_selection(user_query.query, top_candidates)
    logger.info(f"[6/6] LLM (Final Rerank): {time.time() - t_start:.2f}s")

    total_time = time.time() - start_total
    logger.info(f"[DONE] Total execution time: {total_time:.2f}s")

    return final_result
