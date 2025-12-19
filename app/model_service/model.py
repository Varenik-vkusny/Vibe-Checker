import json
import logging
from google import genai
import httpx
import io
from PIL import Image
from app.config import get_settings
from app.modules.analysis_result.schemas import (
    AIAnalysis,
    Summary,
    Scores,
    DetailedAttributes,
    ComparisonData,
    WinnerCategory,
    ComparisonScores,
)
from app.modules.place.schemas import PlaceInfoDTO
from app.modules.pro_mode.utils import PerformanceTimer

settings = get_settings()
api_key = settings.gemini_api_key

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [AI-SERVICE] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

client = genai.Client(api_key=api_key)

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


async def download_images(urls: list[str], limit: int = 3):
    with PerformanceTimer(f"Download Images (count={len(urls)})"):
        images = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for url in urls[:limit]:  # Берем только первые N фото, чтобы не перегружать
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        img_bytes = io.BytesIO(resp.content)
                        img = Image.open(img_bytes)
                        images.append(img)
                except Exception as e:
                    logger.warning(f"⚠️ Не удалось скачать фото: {e}")
                    continue
        return images


async def analyze_place_with_gemini(place: PlaceInfoDTO) -> AIAnalysis:
    with PerformanceTimer(f"Analyze Place '{place.name}'"):
        logger.info(f"Запуск анализа для места: '{place.name}'")

        if not place.reviews and not place.description:
            logger.warning("Нет данных для анализа (отзывов и описания нет).")
            return _get_empty_analysis()

        image_objects = []
        if place.photos:
            logger.info(f"Скачиваем фото ({len(place.photos)} шт found)...")
            image_objects = await download_images(place.photos, limit=3)
            logger.info(f"Скачано {len(image_objects)} изображений для анализа.")

        reviews_text_list = []
        for r in place.reviews[:50]:
            reviews_text_list.append(
                f"Date: {r.date} | Rating: {r.rating} | Author: {r.author}\nReview: {r.text}"
            )
        reviews_text = "\n---\n".join(reviews_text_list)

        description_context = ""
        if place.description:
            description_context = f"Official Description: {place.description}"

        prompt = f"""
        You are an expert restaurant critic. Analyze the place "{place.name}".
        
        CONTEXT:
        {description_context}
        
        INPUT DATA:
        - Text reviews are provided below.
        - Images of the place are attached to this request (if any). Use them to analyze interior, vibe, and cleanliness.
    
        REVIEWS:
        {reviews_text}
        
        Output MUST be a valid JSON object matching this schema:
        {{
            "summary": {{
                "verdict": "Short summary in Russian",
                "pros": ["List of pros in Russian"],
                "cons": ["List of cons in Russian"]
            }},
            "scores": {{ "food": int(1-100), "service": int, "atmosphere": int, "value": int }},
            "vibe_score": int(0-100),
            "tags": ["List from allowed tags"],
            "price_level": "$, $$, or $$$",
            "best_for": ["List from allowed scenarios"],
            "detailed_attributes": {{
                "has_wifi": bool, "has_parking": bool, "outdoor_seating": bool,
                "noise_level": "Low/Medium/High", "service_speed": "Fast/Average/Slow", "cleanliness": "Low/Medium/High"
            }}
        }}
    
        ALLOWED TAGS: {json.dumps(ALLOWED_TAGS)}
        ALLOWED SCENARIOS: {json.dumps(ALLOWED_SCENARIOS)}
        """

        content_parts = [prompt]
        content_parts.extend(image_objects)

        # Optimization: Use Flash-Lite
        model_name = "gemini-2.5-flash-lite"

        try:
            response = await client.aio.models.generate_content(
                model=model_name, contents=content_parts, config={"response_mime_type": "application/json"}
            )

            result_json = json.loads(response.text)
            logger.info(f"Анализ завершен! Vibe Score: {result_json.get('vibe_score')}")

            return AIAnalysis(
                summary=Summary(**result_json["summary"]),
                scores=Scores(**result_json["scores"]),
                vibe_score=result_json["vibe_score"],
                tags=result_json["tags"],
                price_level=result_json["price_level"],
                best_for=result_json["best_for"],
                detailed_attributes=DetailedAttributes(
                    **result_json["detailed_attributes"]
                ),
            )

        except Exception as e:
            logger.error(f"Ошибка Gemini: {e}")
            return _get_empty_analysis()


def _get_empty_analysis() -> AIAnalysis:

    return AIAnalysis(
        summary=Summary(verdict="Ошибка анализа", pros=[], cons=[]),
        scores=Scores(food=0, service=0, atmosphere=0, value=0),
        vibe_score=0,
        tags=[],
        price_level="$$",
        best_for=[],
        detailed_attributes=DetailedAttributes(),
    )


async def compare_places_with_gemini(
    analysis_a: AIAnalysis, analysis_b: AIAnalysis, name_a: str, name_b: str
) -> ComparisonData:
    with PerformanceTimer(f"Compare Places '{name_a}' vs '{name_b}'"):
        logger.info("Запуск AI сравнения...")

        data_a = analysis_a.model_dump()
        data_b = analysis_b.model_dump()

        prompt = f"""
        Compare two venues: "{name_a}" (Place A) and "{name_b}" (Place B).
        Based ONLY on the data below. Output strictly in Russian.
    
        DATA A: {json.dumps(data_a, ensure_ascii=False)}
        DATA B: {json.dumps(data_b, ensure_ascii=False)}
    
        Output JSON schema:
        {{
            "winner_category": {{ "food": "str", "service": "str", "atmosphere": "str", "value": "str" }},
            "key_differences": ["str", "str"],
            "place_a_unique_pros": ["str"],
            "place_b_unique_pros": ["str"],
            "verdict": "str"
        }}
        VERDICT SHOULD BE SHORT PARAGRAPH, THAT ONLY FOCUSED ON WINNER STRENGTH
        """

        try:
            # Optimization: Use Flash-Lite
            # Optimization: Use Flash-Lite
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash-lite", contents=prompt, config={"response_mime_type": "application/json"}
            )
            res = json.loads(response.text)

            return ComparisonData(
                winner_category=WinnerCategory(**res["winner_category"]),
                key_differences=res["key_differences"],
                place_a_unique_pros=res["place_a_unique_pros"],
                place_b_unique_pros=res["place_b_unique_pros"],
                verdict=res["verdict"],
                scores=ComparisonScores(
                    place_a=analysis_a.scores, place_b=analysis_b.scores
                ),
            )
        except Exception as e:
            logger.error(f"Ошибка сравнения: {e}")
            return ComparisonData(
                winner_category=WinnerCategory(
                    food="draw", service="draw", atmosphere="draw", value="draw"
                ),
                key_differences=["Ошибка"],
                place_a_unique_pros=[],
                place_b_unique_pros=[],
                verdict="Ошибка",
                scores=ComparisonScores(
                    place_a=Scores(food=0, service=0, atmosphere=0, value=0),
                    place_b=Scores(food=0, service=0, atmosphere=0, value=0),
                ),
            )
