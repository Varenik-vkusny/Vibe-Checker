from app.model_service.model import analyze_reviews_with_gemini
from app.modules.parsing.parser import parse_google_reviews


async def get_ai_analysis(url: str, limit: int):

    place_data = await parse_google_reviews(url, limit)

    ai_analysis_result = await analyze_reviews_with_gemini(
        reviews_list=place_data["reviews"], place_name=place_data["place_name"]
    )

    print(ai_analysis_result)

    final_response = {
        "place_info": {
            "name": place_data["place_name"],
            "google_rating": place_data["rating"],
            "url": url,
            "latitude": place_data["location"]["lat"],
            "longitude": place_data["location"]["lon"],
        },
        "ai_analysis": ai_analysis_result,
    }

    return final_response
