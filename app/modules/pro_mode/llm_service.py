import math
import json
import logging
from openai import AsyncOpenAI
from sentence_transformers import CrossEncoder
from .schemas import SearchParams, FinalResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


client = AsyncOpenAI(
    base_url="http://host.docker.internal:11434/v1",
    api_key="ollama",
)

QUERY_MODEL = "qwen3:4b"
RERANK_MODEL = "qwen3:4b"

reranker = CrossEncoder("BAAI/bge-reranker-v2-m3", device="cpu")


def calculate_distance(lat1, lon1, lat2, lon2) -> int:
    """Возвращает метры"""
    if not lat1 or not lon1 or not lat2 or not lon2:
        return 99999
    R = 6371e3  # Метры
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return int(R * c)


async def generate_search_params(user_text: str) -> SearchParams:
    """
    Шаг 2: Генерируем запрос для Google.
    Максимально простой промпт.
    """
    prompt = f"""Convert user request to Google Maps search query.
    User: "{user_text}"
    
    JSON Output format: {{"q": "category", "type": "place_type"}}
    
    Examples:
    User: "Хочу пиццу" -> {{"q": "Пиццерия", "type": "restaurant"}}
    User: "Кофе попить" -> {{"q": "Кофейня", "type": "cafe"}}
    User: "Gym near me" -> {{"q": "Gym", "type": "gym"}}
    """

    response = await client.chat.completions.create(
        model=QUERY_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    try:
        data = json.loads(response.choices[0].message.content)
        return SearchParams(**data)
    except Exception as e:
        logger.error(f"Search params error: {e}")
        return SearchParams(
            google_search_query=user_text, place_type="point_of_interest"
        )


def smart_rerank(user_query: str, candidates: list[dict], top_k=3):
    """
    Использует BERT-модель, чтобы оценить релевантность.
    Это в 100 раз быстрее, чем спрашивать у LLM.
    """
    if not candidates:
        return []

    # Готовим пары [Запрос, Текст места]
    pairs = []
    for c in candidates:
        # Собираем текст для оценки: Имя + Адрес + Немного отзывов
        doc_text = (
            f"{c['name']} {c.get('address','')} {c.get('reviews_summary','')[:500]}"
        )
        pairs.append([user_query, doc_text])

    # Получаем scores
    scores = reranker.predict(pairs)

    # Приписываем очки кандидатам
    for i, score in enumerate(scores):
        candidates[i]["ai_score"] = float(score)  # score от -10 до 10 обычно

    # Сортируем (от большего к меньшему)
    sorted_candidates = sorted(candidates, key=lambda x: x["ai_score"], reverse=True)
    return sorted_candidates[:top_k]


async def explain_selection(user_query: str, top_places: list[dict]) -> FinalResponse:
    """
    LLM теперь не выбирает, она просто описывает уже выбранных победителей.
    """

    # Формируем короткий контекст только для победителей
    context_list = []
    for p in top_places:
        context_list.append(
            {
                "name": p["name"],
                "review_snippet": (p.get("reviews_summary") or "")[
                    :600
                ],  # Мало текста -> быстро
            }
        )

    prompt = f"""
    You are a foodie guide. Write a short reason (1 sentence) in Russian why these places fit the request: "{user_query}".
    
    Data: {json.dumps(context_list, ensure_ascii=False)}
    
    Output JSON: {{ "recommendations": [ {{ "name": "...", "reason": "..." }} ] }}
    """

    response = await client.chat.completions.create(
        model=RERANK_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    ai_resp = json.loads(response.choices[0].message.content)
    ai_recs = {rec["name"]: rec["reason"] for rec in ai_resp.get("recommendations", [])}

    # Собираем итоговый ответ
    final_output = []
    for p in top_places:
        reason = ai_recs.get(p["name"], "Хороший вариант на основе отзывов.")
        final_output.append(
            {
                "place_id": p["place_id"],
                "name": p["name"],
                "match_score": int(
                    (p["ai_score"] + 10) * 5
                ),  # Нормализация скора примерно в 0-100
                "reason": reason,
            }
        )

    return FinalResponse(recommendations=final_output)
