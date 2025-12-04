import asyncio
from .llm_service import generate_search_params, rerank_and_explain
from .vector_service import init_vector_db, insert_data_to_qdrant, search_places
from .schemas import UserRequest
from ..parsing.pro_mode_parser import search_and_parse_places


async def get_places_by_vibe(user_query: UserRequest):

    await init_vector_db()

    search_params = await generate_search_params(user_text=user_query.query)

    places = await search_and_parse_places(
        query=search_params.google_search_query,
        lat=user_query.lat,
        lon=user_query.lon,
        limit_places=5,
    )

    if not places:
        print("❌ Места не найдены.")
        return {"recommendations": []}

    await insert_data_to_qdrant(places)

    candidates = await search_places(user_query=user_query.query, limit=5)

    final_result = await rerank_and_explain(
        user_query=user_query.query, candidates=candidates
    )

    return final_result


if __name__ == "__main__":
    user_req = UserRequest(query="тихое место поработать с кофе", lat=43.2, lon=76.8)

    result = asyncio.run(get_places_by_vibe(user_req))

    import json

    print("\n🏁 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:")
    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))
