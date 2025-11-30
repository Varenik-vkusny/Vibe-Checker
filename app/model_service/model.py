import json
import logging
import google.generativeai as genai
from app.config import get_settings


settings = get_settings()
api_key = settings.gemini_api_key


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [AI-SERVICE] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

genai.configure(api_key=api_key)

ALLOWED_TAGS = [
    "quiet",
    "noisy",
    "cozy",
    "luxury",
    "party",
    "instagrammable",
    "wifi",
    "power_outlets",
    "pet_friendly",
    "hookah",
    "live_music",
    "tasty_coffee",
    "vegan_options",
    "good_cocktails",
    "craft_beer",
    "fast_service",
    "slow_service",
    "friendly_staff",
    "cheap",
    "expensive",
]

ALLOWED_SCENARIOS = [
    "dating",
    "friends",
    "work",
    "family",
    "solo",
    "breakfast",
    "business",
]


async def analyze_reviews_with_gemini(reviews_list: list[str], place_name: str):
    logger.info(f"🚀 Запуск анализа для места: '{place_name}'")

    if not reviews_list:
        logger.warning("⚠️ Список отзывов пуст! Возвращаю заглушку.")
        return _get_empty_response()

    truncated_reviews = reviews_list[:100]
    reviews_text = "\n---\n".join(truncated_reviews)

    logger.info(
        f"📝 Подготовлено {len(truncated_reviews)} отзывов ({len(reviews_text)} символов)."
    )

    prompt = f"""
    You are an expert restaurant critic and data analyst. 
    Analyze the following reviews for the place named "{place_name}".
    
    Your goal is to extract structured data about the "vibe" and quality of the place.
    Be objective. If reviews are conflicting, take the majority opinion.

    Output MUST be a valid JSON object with the following schema:
    {{
        "summary": {{
            "verdict": "A short, punchy summary (2 sentences max) in Russian language.",
            "pros": ["List of 3 main pros in Russian"],
            "cons": ["List of 3 main cons in Russian"]
        }},
        "scores": {{
            "food": int (1-10),
            "service": int (1-10),
            "atmosphere": int (1-10),
            "value": int (1-10)
        }},
        "vibe_score": int (0-100) (An overall score based on sentiment),
        "tags": ["List of tags selected ONLY from the allowed list"],
        "price_level": "String: '$' (Cheap), '$$' (Moderate), or '$$$' (Expensive)",
        "best_for": ["List of scenarios selected ONLY from the allowed scenarios list"],
        "detailed_attributes": {{
            "has_wifi": "Bool or Null (if unsure)",
            "has_parking": "Bool or Null",
            "outdoor_seating": "Bool or Null",
            "noise_level": "String: 'Low', 'Medium', 'High'",
            "service_speed": "String: 'Fast', 'Average', 'Slow'",
            "portion_size": "String: 'Small', 'Average', 'Large'",
            "cleanliness": "String: 'Low', 'Medium', 'High'"
        }}
    }}

    CONSTRAINTS:
    1. Tags MUST be chosen from this list: {json.dumps(ALLOWED_TAGS)}
    2. Scenarios MUST be chosen from this list: {json.dumps(ALLOWED_SCENARIOS)}
    3. Return ONLY raw JSON, no markdown formatting.

    REVIEWS DATA:
    {reviews_text}
    """

    model_name = "gemini-2.5-flash"

    try:
        logger.info(f"🤖 Инициализация модели: {model_name}...")
        model = genai.GenerativeModel(model_name)

        logger.info("⏳ Отправка запроса в Gemini API...")

        response = await model.generate_content_async(
            prompt, generation_config={"response_mime_type": "application/json"}
        )

        logger.info("✅ Ответ получен. Парсинг JSON...")
        result_json = json.loads(response.text)

        logger.info(
            f"🎉 Анализ завершен! Vibe Score: {result_json.get('vibe_score', 'N/A')}"
        )
        return result_json

    except Exception as e:
        logger.error(f"🔥 Ошибка при анализе Gemini: {e}")
        if "404" in str(e) or "not found" in str(e).lower():
            logger.error(
                "🛑 Скорее всего, название модели неверное или у тебя нет доступа к 2.5-flash."
            )

        return _get_empty_response()


def _get_empty_response():
    """Вспомогательная функция для возврата пустой структуры"""
    return {
        "summary": {
            "verdict": "Не удалось проанализировать.",
            "pros": [],
            "cons": [],
        },
        "scores": {"food": 0, "service": 0, "atmosphere": 0, "value": 0},
        "vibe_score": 0,
        "tags": [],
        "price_level": "$$",
        "best_for": [],
    }


async def compare_places_with_gemini(
    place_a_json: dict, place_b_json: dict, name_a: str, name_b: str
):
    logger.info("⚔️ Запуск AI сравнения двух мест...")

    context_a = {
        k: place_a_json[k]
        for k in ["summary", "scores", "tags", "price_level", "vibe_score"]
        if k in place_a_json
    }
    context_b = {
        k: place_b_json[k]
        for k in ["summary", "scores", "tags", "price_level", "vibe_score"]
        if k in place_b_json
    }

    prompt = f"""
    You are an expert restaurant/service critic.
    Compare two venues: "{name_a}" (Place A) and "{name_b}" (Place B).
    Based ONLY on the provided JSON data.
    
    CRITICAL INSTRUCTION:
    1. Look closely at "detailed_attributes" and "scores". 
    2. In your text output (key_differences, verdict), USE THE REAL NAMES ("{name_a}", "{name_b}") instead of "Place A/B" where appropriate to make it sound natural.
    3. Output strictly in Russian.

    DATA FOR "{name_a}": {json.dumps(context_a, ensure_ascii=False)}
    DATA FOR "{name_b}": {json.dumps(context_b, ensure_ascii=False)}

    Output MUST be a valid JSON matching this schema:
    {{
        "winner_category": {{
            "food": "String: 'place_a', 'place_b', or 'draw'",
            "service": "String: 'place_a', 'place_b', or 'draw'",
            "atmosphere": "String: 'place_a', 'place_b', or 'draw'",
            "value": "String: 'place_a', 'place_b', or 'draw'"
        }},
        "key_differences": ["List of 3-4 strings describing MAIN differences"],
        "place_a_unique_pros": ["List of pros unique to {name_a}"],
        "place_b_unique_pros": ["List of pros unique to {name_b}"],
        "verdict": "A summarized advice (2-3 sentences). Example: 'If you want quiet atmosphere go to {name_a}...'"
    }}
    
    Constraint: Return ONLY raw JSON.
    """

    model_name = "gemini-2.5-flash"

    try:
        model = genai.GenerativeModel(model_name)
        response = await model.generate_content_async(
            prompt, generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"🔥 Ошибка сравнения: {e}")

        return {
            "winner_category": {
                "food": "draw",
                "service": "draw",
                "atmosphere": "draw",
                "value": "draw",
            },
            "key_differences": ["Не удалось сравнить."],
            "place_a_unique_pros": [],
            "place_b_unique_pros": [],
            "verdict": "Ошибка сервиса сравнения.",
        }
