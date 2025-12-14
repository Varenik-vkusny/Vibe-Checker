import json
import logging
import math
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

print("Loading Reranker (CPU)...")
try:
    reranker = CrossEncoder("BAAI/bge-reranker-v2-m3", device="cpu")
    print("Reranker ready.")
except Exception as e:
    logger.error(f"Error loading Reranker: {e}")
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


def safe_float(val) -> float:
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return 0.0
        return f
    except (TypeError, ValueError):
        return 0.0


async def run_gemini_inference(prompt: str) -> str:

    try:
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini Error: {e}")
        return "{}"


async def generate_search_params(user_text: str) -> SearchParams:

    prompt = f"""You are a query generator for Google Maps.
    User request: "{user_text}"
    Extract the main category and place type.
    JSON format: {{"google_search_query": "Search Query", "place_type": "place_type"}}
    """
    txt = await run_gemini_inference(prompt)
    try:
        data = json.loads(clean_json_string(txt))
        if "q" in data and "google_search_query" not in data:
            data["google_search_query"] = data["q"]
        return SearchParams(**data)
    except Exception:
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
        address = c.get("address") or "Адрес не указан"

        logging.info(f"Rerank address processing: {address}")

        summary = c.get("reviews_summary")
        if not summary and c.get("types"):
            summary = " ".join(c["types"])

        desc = summary if summary else "Нет описания"

        doc_text = f"Title: {name}. Address: {address}. Description: {desc}"

        pairs.append([user_query, doc_text])
        doc_indices.append(i)

    if not pairs:
        return candidates[:top_k]

    scores = reranker.predict(pairs)

    min_score = min(scores)
    max_score = max(scores)

    scored_results = []

    for idx, raw_score in enumerate(scores):
        original_candidate_index = doc_indices[idx]
        candidate = candidates[original_candidate_index]

        if max_score > min_score:
            norm_score = (raw_score - min_score) / (max_score - min_score)
        else:
            norm_score = 0.9

        final_score = 0.5 + (0.49 * norm_score)

        candidate["ai_score"] = float(final_score)
        candidate["debug_raw_score"] = float(raw_score)
        scored_results.append(candidate)

    sorted_candidates = sorted(
        scored_results, key=lambda x: x["ai_score"], reverse=True
    )

    return sorted_candidates[:top_k]


async def explain_selection(user_query: str, top_places: list[dict]) -> FinalResponse:

    if not top_places:
        return FinalResponse(recommendations=[])

    places_context = []
    for idx, p in enumerate(top_places):
        summary = p.get("reviews_summary", "Нет отзывов")
        if summary and len(summary) > 600:
            summary = summary[:600] + "..."

        final_address = p.get("address") or "Адрес не указан"
        places_context.append(
            {
                "id": idx,
                "name": p["name"],
                "address": final_address,
                "info": summary,
            }
        )

        logging.info(f"Place address for explanation: {final_address}")

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
        reason = reasons_map.get(str(idx))
        if not reason:
            reason = f"Отличный вариант: {p.get('name')}"

        ai_score = p.get("ai_score", 0.5)
        match_score = int(safe_float(ai_score) * 100)

        lat = safe_float(p.get("lat_float") or p.get("location", {}).get("lat"))
        lon = safe_float(p.get("lon_float") or p.get("location", {}).get("lon"))
        rating = safe_float(p.get("rating", 0.0))

        try:
            num_reviews = int(p.get("reviews_count", 0) or 0)
        except Exception:
            num_reviews = 0

        photos = p.get("photos", [])
        image_url = photos[0] if isinstance(photos, list) and photos else None

        final_output.append(
            {
                "place_id": str(p.get("place_id", "unknown")),
                "name": p["name"],
                "address": p.get("address", ""),
                "match_score": match_score,
                "reason": reason,
                "lat": lat,
                "lon": lon,
                "rating": rating,
                "num_reviews": num_reviews,
                "price_level": p.get("price_level", "$$"),
                "image_url": image_url,
                "tags": p.get("tags", []),
            }
        )

    return FinalResponse(recommendations=final_output)
