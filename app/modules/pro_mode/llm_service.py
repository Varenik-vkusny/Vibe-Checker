from openai import AsyncOpenAI
import json
from .schemas import SearchParams, FinalResponse

client = AsyncOpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)

MODEL_NAME = "llama3.1"


async def generate_search_params(user_text: str) -> SearchParams:
    """
    Шаг 2: Превращаем "хочу пожрать дешево" в "cheap fast food near me"
    """
    prompt = f"""
    You are a search assistant. Convert user description into a specific Google Maps search query.
    User says: "{user_text}"
    
    Return JSON only: {{ "google_search_query": "...", "place_type": "..." }}
    """

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return SearchParams(**data)


async def rerank_and_explain(user_query: str, candidates: list[dict]) -> FinalResponse:
    """
    Шаг 5: Анализируем кандидатов и пишем объяснение
    """
    candidates_text = json.dumps(
        [
            {
                "id": c.get("place_id"),
                "name": c.get("name"),
                "reviews": c.get("reviews_summary"),
            }
            for c in candidates
        ],
        ensure_ascii=False,
    )

    prompt = f"""
    User Request: "{user_query}"
    
    Candidate Places (with reviews):
    {candidates_text}
    
    Task:
    1. Select top 3-5 places that PERFECTLY match the user's specific vibe.
    2. For the "reason" field: Write a UNIQUE explanation based on specific details found in the reviews (e.g., mention specific food, interior details, or noise level). Do NOT use generic phrases like "proximity to a cafe".
    3. If the reviews mention negative aspects related to the user's request (e.g., "loud music" when user asked for "quiet"), discard that place.
    
    Return strict JSON:
    {{
      "recommendations": [
        {{ "place_id": "...", "name": "...", "match_score": 85, "reason": "Mentions comfortable chairs and quiet jazz, perfect for work." }}
      ]
    }}
    """

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    data = json.loads(response.choices[0].message.content)
    return FinalResponse(**data)
