import json
import logging
import math
import google.generativeai as genai
import httpx
from .schemas import SearchParams, FinalResponse
from ...config import get_settings
from .utils import PerformanceTimer

settings = get_settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_API_KEY = settings.gemini_api_key
genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel(
    "gemini-2.5-flash-lite",
    generation_config={"response_mime_type": "application/json"},
)

INFERENCE_API_URL = settings.inference_api_url


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
    with PerformanceTimer(f"Gemini Inference (prompt len={len(prompt)})"):
        try:
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            return "{}"


async def generate_search_params(user_text: str) -> SearchParams:
    with PerformanceTimer("Generate Search Params"):
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


def fuzzy_match(restriction: str, text: str, threshold=0.75) -> bool:
    """Check if restriction approximately matches any word in text

    Args:
        restriction: The keyword to search for (e.g. 'club')
        text: The text to search in (e.g. place name + summary)
        threshold: Similarity threshold (0.0-1.0), default 0.75 for typo tolerance

    Returns:
        True if restriction matches any word in text
    """
    from difflib import SequenceMatcher

    restriction_lower = restriction.lower()
    words = text.lower().split()

    for word in words:
        if restriction_lower in word or word in restriction_lower:
            logger.info(
                f"Fuzzy match: '{restriction}' found in '{word}' (exact substring)"
            )
            return True

        ratio = SequenceMatcher(None, restriction_lower, word).ratio()
        if ratio >= threshold:
            logger.info(
                f"Fuzzy match: '{restriction}' ~= '{word}' (similarity: {ratio:.2f})"
            )
            return True

    return False


async def smart_rerank(
    user_query: str,
    candidates: list[dict],
    top_k=5,
    acoustics=50,
    lighting=50,
    crowdedness=50,
    budget=50,
    restrictions=None,
    user_lat=None,
    user_lon=None,
):
    with PerformanceTimer(f"Smart Rerank (candidates={len(candidates)})"):
        if restrictions is None:
            restrictions = []

        logger.info(
            f"smart_rerank: acoustics={acoustics}, lighting={lighting}, crowdedness={crowdedness}, budget={budget}"
        )
        logger.info(f"smart_rerank: restrictions={restrictions}")

        if not candidates:
            return []

        pref_parts = []
        if acoustics < 30:
            pref_parts.append("Quiet, intimate, no loud music")
        elif acoustics > 70:
            pref_parts.append("Lively, loud music, buzz")

        if lighting < 30:
            pref_parts.append("Dim lighting, cozy, dark")
        elif lighting > 70:
            pref_parts.append("Bright, well-lit, sunny")

        if crowdedness < 30:
            pref_parts.append("Empty, private, secluded")
        elif crowdedness > 70:
            pref_parts.append("Crowded, popular, busy")

        if budget < 30:
            pref_parts.append("Cheap, budget-friendly, affordable")
        elif budget > 70:
            pref_parts.append("Expensive, premium, upscale, fine dining")

        pref_str = ". ".join(pref_parts)
        if pref_str:
            user_query = f"{user_query}. Preferences: {pref_str}"

        if restrictions:
            user_query = f"{user_query}. EXCLUDE: {', '.join(restrictions)}"

        # Add location context to query if available
        if user_lat is not None and user_lon is not None:
             user_query = f"{user_query}. User Location: {user_lat}, {user_lon} (Prioritize closer places if relevant)"

        documents = []
        doc_indices = []

        from math import radians, sin, cos, sqrt, atan2

        def haversine_distance(lat1, lon1, lat2, lon2):
            try:
                R = 6371  # Earth radius in km
                dlat = radians(lat2 - lat1)
                dlon = radians(lon2 - lon1)
                a = sin(dlat / 2) * sin(dlat / 2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) * sin(dlon / 2)
                c = 2 * atan2(sqrt(a), sqrt(1 - a))
                return R * c
            except Exception:
                return 9999.0


        for i, c in enumerate(candidates):
            name = c.get("name", "")
            summary = c.get("reviews_summary") or ""
            text_to_check = f"{name} {summary}"

            blocked = False
            for r in restrictions:
                if fuzzy_match(r, text_to_check, threshold=0.75):
                    logger.info(
                        f"Blocked '{name}' due to fuzzy match with restriction '{r}'"
                    )
                    blocked = True
                    break

            if blocked:
                continue

            address = c.get("address") or "Адрес не указан"
            
            # Calculate distance
            dist_str = ""
            try:
                # Try to get lat/lon from candidate
                c_lat = None
                c_lon = None
                if c.get("lat_float") and c.get("lon_float"):
                    c_lat = float(c["lat_float"])
                    c_lon = float(c["lon_float"])
                elif c.get("location"):
                    c_lat = float(c["location"].get("lat"))
                    c_lon = float(c["location"].get("lon"))
                
                if user_lat and user_lon and c_lat and c_lon:
                    dist_km = haversine_distance(user_lat, user_lon, c_lat, c_lon)
                    dist_str = f"Distance from user: {dist_km:.2f} km."
                    c["distance_km"] = dist_km # store for later use if needed
            except Exception:
                pass

            logging.info(f"Rerank address processing: {address}")

            if not summary and c.get("types"):
                summary = " ".join(c["types"])

            desc = summary if summary else "Нет описания"

            # Include distance in the document text for the reranker
            doc_text = f"Title: {name}. Address: {address}. {dist_str} Description: {desc}"

            documents.append({"id": str(c.get("place_id")), "text": doc_text})
            doc_indices.append(i)

        if not documents:
            return candidates[:top_k]

        with PerformanceTimer(f"Rerank API Call (documents={len(documents)})"):
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"{INFERENCE_API_URL}/rerank",
                        json={"query": user_query, "documents": documents},
                        timeout=30.0,
                    )
                    resp.raise_for_status()
                    rerank_results = resp.json()
            except Exception as e:
                logger.error(f"Rerank API Error: {e}")
                return candidates[:top_k]

        if not rerank_results:
            return candidates[:top_k]

        # Create map of id -> score
        score_map = {}
        raw_scores = []

        # Handle both list of dicts and list of floats (fallback)
        if isinstance(rerank_results, list) and len(rerank_results) > 0:
            if isinstance(rerank_results[0], dict):
                for res in rerank_results:
                    s = res.get("score", 0.0)
                    score_map[str(res.get("id"))] = s
                    raw_scores.append(s)
            else:
                # Assume floats in order
                for idx, val in enumerate(rerank_results):
                    # We can't easily map back if we don't know the order for sure,
                    # but assuming input order is standard for simple lists.
                    # Using doc_indices to map back?
                    # Better to rely on valid API response which is list of dicts.
                    raw_scores.append(val)
                    if idx < len(documents):
                        score_map[documents[idx]["id"]] = val

        if not raw_scores:
            return candidates[:top_k]

        min_score = min(raw_scores)
        max_score = max(raw_scores)

        scored_results = []

        for c in candidates:
            # Check if this candidate was sent to reranker (might be filtered by restriction)
            # However, logic above iterates candidates and adds to documents.
            # But some candidates might be skipped before adding to documents?
            # NO, logic was: iterate candidates -> filter -> add to documents.
            # So only candidates in documents list have scores.
            # But we need to return list search candidates, maybe preserving others?
            # Actually logic is: return top_k reranked.

            c_id = str(c.get("place_id"))
            if c_id in score_map:
                raw_score = score_map[c_id]
                if max_score > min_score:
                    norm_score = (raw_score - min_score) / (max_score - min_score)
                else:
                    norm_score = 0.9

                final_score = 0.5 + (0.49 * norm_score)

                c["ai_score"] = float(final_score)
                c["debug_raw_score"] = float(raw_score)
                scored_results.append(c)
            else:
                # Candidate was filtered out or not scored?
                # If filtered by restriction (lines 170~), it wasn't added to documents.
                # So it's not in score_map.
                # We skip it or include with low score?
                # Original logic skipped blocked candidates entirely.
                pass

        sorted_candidates = sorted(
            scored_results, key=lambda x: x["ai_score"], reverse=True
        )

        return sorted_candidates[:top_k]


async def explain_selection(user_query: str, top_places: list[dict]) -> FinalResponse:
    with PerformanceTimer(f"Explain Selection (places={len(top_places)})"):

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
