import json
import logging
import google.generativeai as genai
from sentence_transformers import CrossEncoder
from .schemas import SearchParams, FinalResponse
from ...config import get_settings

settings = get_settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_API_KEY = settings.gemini_api_key
genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel(
    "gemini-2.5-flash", generation_config={"response_mime_type": "application/json"}
)

print("Загружаю Reranker (работает локально на CPU)...")
# BGE-M3 отличный выбор, он мультиязычный
try:
    reranker = CrossEncoder("BAAI/bge-reranker-v2-m3", device="cpu")
    print("Reranker готов.")
except Exception as e:
    logger.error(f"Ошибка загрузки Reranker: {e}")
    raise e


def clean_json_string(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        return text[7:]
    elif text.startswith("```"):
        return text[3:]
    if text.endswith("```"):
        return text[:-3]
    return text.strip()


async def run_gemini_inference(prompt: str) -> str:
    try:
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini Error: {e}")
        return "{}"


# --- ШАГ 1: Поиск ---
async def generate_search_params(user_text: str) -> SearchParams:
    prompt = f"""You are a query generator for Google Maps.
    User request: "{user_text}"
    Extract the main category and place type.
    JSON format: {{"q": "Search Query", "type": "place_type"}}
    """
    txt = await run_gemini_inference(prompt)
    try:
        data = json.loads(clean_json_string(txt))
        return SearchParams(**data)
    except:
        return SearchParams(
            google_search_query=user_text, place_type="point_of_interest"
        )


def smart_rerank(user_query: str, candidates: list[dict], top_k=5):
    if not candidates:
        return []

    pairs = []
    doc_indices = []

    for i, c in enumerate(candidates):
        name = c.get("name", "")
        # Используем 'or', чтобы даже если ключ есть но значение пустая строка, сработал дефолт
        address = c.get("address") or "Адрес не указан"

        logging.info(f"Адрес в реранке: {address}")

        summary = c.get("reviews_summary")
        if not summary and c.get("types"):
            summary = " ".join(c["types"])

        desc = summary if summary else "Нет описания"

        # ИЗМЕНЕНИЕ: Добавляем адрес в контекст для BERT'а
        # Теперь BERT поймет, если юзер искал конкретную улицу
        doc_text = f"Title: {name}. Address: {address}. Description: {desc}"

        pairs.append([user_query, doc_text])
        doc_indices.append(i)

    if not pairs:
        return candidates[:top_k]

    # Получаем сырые очки (logits). Они могут быть отрицательными (-10...10)
    scores = reranker.predict(pairs)

    # --- ИСПРАВЛЕНИЕ ОЦЕНОК (Min-Max Scaling) ---
    # Чтобы оценки были красивые (например от 60 до 99), а не все 50.
    min_score = min(scores)
    max_score = max(scores)

    scored_results = []

    for idx, raw_score in enumerate(scores):
        original_candidate_index = doc_indices[idx]
        candidate = candidates[original_candidate_index]

        # Нормализация: (x - min) / (max - min).
        # Если max == min (один результат), даем 0.9
        if max_score > min_score:
            norm_score = (raw_score - min_score) / (max_score - min_score)
        else:
            norm_score = 0.9

        # Немного магии: чтобы не было 0%, подтянем нижнюю границу к 50%
        # Итоговая формула: 0.5 + (0.5 * norm_score) -> диапазон 50-100 баллов
        final_score = 0.5 + (0.49 * norm_score)

        candidate["ai_score"] = float(final_score)
        candidate["debug_raw_score"] = float(raw_score)  # для отладки
        scored_results.append(candidate)

    # Сортируем от лучшего к худшему
    sorted_candidates = sorted(
        scored_results, key=lambda x: x["ai_score"], reverse=True
    )

    # Возвращаем только TOP_K лучших
    return sorted_candidates[:top_k]


# --- ШАГ 3: Объяснение (ОБНОВЛЕННЫЙ) ---
async def explain_selection(user_query: str, top_places: list[dict]) -> FinalResponse:
    if not top_places:
        return FinalResponse(recommendations=[])

    places_context = []
    for idx, p in enumerate(top_places):
        summary = p.get("reviews_summary", "Нет отзывов")
        if summary and len(summary) > 600:
            summary = summary[:600] + "..."

        # ИЗМЕНЕНИЕ: Передаем адрес в промпт для Gemini
        # Если адреса нет (или он пустой), передаем "Адрес не указан"
        final_address = p.get("address") or "Адрес не указан"
        places_context.append(
            {
                "id": idx,
                "name": p["name"],
                "address": final_address,
                "info": summary,
            }
        )

        logging.info(f"Адрес места: {final_address}")

    prompt = f"""
    User Request: "{user_query}"
    
    You are a local guide. Provided below are the TOP {len(top_places)} places found for this request.
    Generate a short, convincing reason (in Russian) why EACH place fits the request.
    
    If the user asked for a specific location, mention the address.
    
    RULES:
    1. Output JSON only: {{ "reviews": {{ "0": "reason...", "1": "reason..." }} }}
    2. Be concise (max 1 sentence per place).
    3. Use details from 'info' and 'address'.
    
    Places:
    {json.dumps(places_context, ensure_ascii=False)}
    """

    resp_text = await run_gemini_inference(prompt)

    reasons_map = {}
    try:
        clean = clean_json_string(resp_text)
        parsed = json.loads(clean)
        reasons_map = parsed.get("reviews", {})
    except Exception as e:
        logger.error(f"Explain JSON Error: {e}")

    final_output = []
    for idx, p in enumerate(top_places):
        # Получаем reason по индексу
        reason = reasons_map.get(str(idx))
        if not reason:
            reason = f"Хороший вариант: {p.get('name')}"

        # Теперь ai_score точно есть, так как мы берем places из smart_rerank
        ai_score = p.get("ai_score", 0.5)
        match_score = int(ai_score * 100)

        final_output.append(
            {
                "place_id": p.get("place_id", "unknown"),
                "name": p["name"],
                "address": p.get("address", ""),  # <--- Можно добавить и сюда
                "match_score": match_score,
                "reason": reason,
            }
        )

    return FinalResponse(recommendations=final_output)
