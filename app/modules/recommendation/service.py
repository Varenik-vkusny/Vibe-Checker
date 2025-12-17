import json
import logging
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...modules.user.models import UserLog, ActionType
from ...modules.favorites.models import Favorite
from ...modules.pro_mode.llm_service import run_gemini_inference
from ...modules.pro_mode.main import get_places_by_vibe
from ...modules.pro_mode.schemas import UserRequest
from ...modules.user.activity_service import log_user_action
from ..interactions.service import get_user_interactions_summary

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def get_user_context(user_id: int, db: AsyncSession) -> str:

    interactions = await get_user_interactions_summary(db, user_id)

    try:
        stmt_logs = (
            select(UserLog)
            .where(UserLog.user_id == user_id)
            .order_by(UserLog.created_at.desc())
            .limit(10)
        )
        result_logs = await db.execute(stmt_logs)
        logs = result_logs.scalars().all()
    except Exception as e:
        logger.error(f"Error fetching UserLogs in get_user_context: {e}")
        logs = []

    try:
        stmt_favs = (
            select(Favorite)
            .options(selectinload(Favorite.place))
            .where(Favorite.user_id == user_id)
            .limit(5)
        )
        result_favs = await db.execute(stmt_favs)
        favorites = result_favs.scalars().all()
    except Exception as e:
        logger.error(f"Error fetching Favorites in get_user_context: {e}")
        favorites = []

    context_parts = []

    if favorites:
        fav_names = [f.place.name for f in favorites if f.place]
        context_parts.append(f"User likes: {', '.join(fav_names)}.")

    if interactions["likes"]:
        context_parts.append(f"User LOVES: {', '.join(interactions['likes'])}.")

    if interactions["dislikes"]:
        context_parts.append(
            f"User DISLIKES (Avoid similar): {', '.join(interactions['dislikes'])}."
        )

    if interactions["visited"]:
        context_parts.append(
            f"User already visited: {', '.join(interactions['visited'])}."
        )
    recent_searches = []
    for log in logs:
        try:
            data = (
                log.payload
                if isinstance(log.payload, dict)
                else json.loads(log.payload)
            )

            if log.action_type == ActionType.SEARCH:
                q = data.get("query")
                if q:
                    recent_searches.append(q)

            elif log.action_type == ActionType.ANALYZE:
                p_name = data.get("place_name")
                tags = data.get("tags", [])
                if p_name:
                    context_parts.append(
                        f"Interested in: {p_name} ({', '.join(tags)})."
                    )

            elif log.action_type == ActionType.COMPARE:
                pa = data.get("place_a")
                pb = data.get("place_b")
                if pa and pb:
                    context_parts.append(f"Compared {pa} vs {pb}.")

        except Exception:
            continue

    if recent_searches:
        unique_searches = list(set(recent_searches))[:5]
        context_parts.append(f"Recent interests: {'; '.join(unique_searches)}.")

    if not context_parts:
        return "User is new to the city. Interested in popular local spots with good reviews."

    return " ".join(context_parts)


async def generate_discovery_query(
    user_context: str, current_time: str, lat: float, lon: float
) -> str:

    prompt = f"""
    You are a smart local guide.
    
    User Context:
    {user_context}
    
    Current Time: {current_time}
    Coordinates: {lat}, {lon}
    
    Task:
    Generate ONE Google Maps search query to find a NEW place for this user.
    
    RULES:
    1. If user DISLIKES something, do NOT generate a query that would find similar places.
    2. If user already VISITED a place, try to find something different (unless they LOVE it, then find similar).
    3. Output ONLY the raw query string.
    
    Example input: "User LOVES: Jazz Bar. DISLIKES: Techno Club."
    Example output: "Cozy jazz lounge with live music"
    """

    response_text = await run_gemini_inference(prompt)

    clean_query = response_text.replace('"', "").replace("JSON", "").strip()

    if not clean_query or len(clean_query) < 3:
        return "Best places nearby"

    return clean_query


async def inspire_me(user_id: int, lat: float, lon: float, db: AsyncSession):

    context = await get_user_context(user_id, db)
    current_time = datetime.now().strftime("%H:%M")

    logger.info(f"Inspire Me Context for user {user_id}: {context}")

    generated_query = await generate_discovery_query(context, current_time, lat, lon)
    logger.info(f"Generated Inspire Query: {generated_query}")

    from ..user.repo import UserRepo

    user_repo = UserRepo(db)
    user = await user_repo.find_one(id=user_id)

    request_dto = UserRequest(
        query=generated_query,
        lat=lat,
        lon=lon,
        radius=2000,
        acoustics=user.preferences_acoustics if user else 50,
        lighting=user.preferences_lighting if user else 50,
        crowdedness=user.preferences_crowdedness if user else 50,
        budget=user.preferences_budget if user else 50,
        restrictions=user.preferences_restrictions if user else [],
    )

    try:
        results = await get_places_by_vibe(request_dto, db)
    except Exception as e:
        logger.error(f"Pro Mode failed inside Inspire Me: {e}")
        raise e

    from ..interactions.service import get_user_disliked_google_place_ids

    disliked_ids = await get_user_disliked_google_place_ids(db, user_id)

    if disliked_ids and results.recommendations:
        original_count = len(results.recommendations)
        results.recommendations = [
            r for r in results.recommendations if r.get("place_id") not in disliked_ids
        ]
        logger.info(
            f"Filtered {original_count - len(results.recommendations)} disliked places."
        )

    await log_user_action(
        db,
        user_id,
        ActionType.INSPIRE_REQUEST,
        {"generated_query": generated_query, "lat": lat, "lon": lon},
    )

    return results
