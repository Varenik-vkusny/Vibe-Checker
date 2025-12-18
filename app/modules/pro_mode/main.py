import asyncio
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from .llm_service import generate_search_params, smart_rerank, explain_selection
from .vector_service import init_vector_db, insert_data_to_qdrant, search_places
from .schemas import UserRequest
from .utils import PerformanceTimer
from ..place.repo import PlaceRepo, ReviewRepo
from ..place.service import PlaceService
from ..parsing.pro_mode_parser import search_and_parse_places

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def get_places_by_vibe(
    user_query: UserRequest, db: AsyncSession, user_id: Optional[int] = None
):
    with PerformanceTimer(f"Total Request Processing: '{user_query.query}'"):
        if user_id:
            from ..user.repo import UserRepo

            user_repo = UserRepo(db)
            user = await user_repo.find_one(id=user_id)
            if user:
                if user_query.acoustics == 50:
                    user_query.acoustics = user.preferences_acoustics
                if user_query.lighting == 50:
                    user_query.lighting = user.preferences_lighting
                if user_query.crowdedness == 50:
                    user_query.crowdedness = user.preferences_crowdedness
                if user_query.budget == 50:
                    user_query.budget = user.preferences_budget
                if not user_query.restrictions:
                    user_query.restrictions = user.preferences_restrictions or []

                logger.info(
                    f"Loaded user preferences: acoustics={user_query.acoustics}, lighting={user_query.lighting}, "
                    f"crowdedness={user_query.crowdedness}, budget={user_query.budget}, restrictions={user_query.restrictions}"
                )

        place_repo = PlaceRepo(db)
        review_repo = ReviewRepo(db)
        place_service = PlaceService(place_repo=place_repo, review_repo=review_repo)

        # Run Qdrant Init and Query Generation in parallel
        with PerformanceTimer("Phase 1: Init + Query Generation"):
            _, search_params = await asyncio.gather(
                init_vector_db(), generate_search_params(user_text=user_query.query)
            )

        logger.info(f"Generated query: {search_params.google_search_query}")

        with PerformanceTimer(
            f"Phase 2: Parsing (Google + Reviews) query='{search_params.google_search_query}'"
        ):
            places_dtos = await search_and_parse_places(
                query=search_params.google_search_query,
                lat=user_query.lat,
                lon=user_query.lon,
                place_repo=place_repo,
                limit_places=15,
            )

        if not places_dtos:
            logger.warning("Places not found by parser.")
            return {"recommendations": []}

        with PerformanceTimer(f"Phase 3: SQL Save (count={len(places_dtos)})"):
            for dto in places_dtos:
                await place_service.save_or_update_place(dto)
            await db.commit()

        await insert_data_to_qdrant(places_dtos)

        with PerformanceTimer("Phase 4: Qdrant Retrieval"):
            candidates = await search_places(
                user_query=user_query.query,
                lat=user_query.lat,
                lon=user_query.lon,
                radius_meters=user_query.radius,
                limit=15,
            )

        # Debug print candidates
        # for c in candidates:
        #     print(f"Name: {c.get('name')}")
        #     print("-" * 20)

        top_candidates = await smart_rerank(
            user_query=user_query.query,
            candidates=candidates,
            top_k=5,
            acoustics=user_query.acoustics,
            lighting=user_query.lighting,
            crowdedness=user_query.crowdedness,
            budget=user_query.budget,
            restrictions=user_query.restrictions,
            user_lat=user_query.lat,
            user_lon=user_query.lon,
        )

        final_result = await explain_selection(user_query.query, top_candidates)

        return final_result
