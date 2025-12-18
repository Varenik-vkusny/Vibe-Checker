import logging
import warnings
import uuid
import httpx
from qdrant_client import AsyncQdrantClient
from qdrant_client import models
from qdrant_client.models import PointStruct, Distance, VectorParams
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO
from .utils import PerformanceTimer

logging.basicConfig(level=logging.INFO)

settings = get_settings()

COLLECTION_NAME = settings.collection_name

qdrant = AsyncQdrantClient(url="http://qdrant:6333")
INFERENCE_API_URL = settings.inference_api_url


async def init_vector_db():
    with PerformanceTimer("Init Vector DB"):
        if not await qdrant.collection_exists(COLLECTION_NAME):
            await qdrant.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
            await qdrant.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="location",
                field_schema=models.PayloadSchemaType.GEO,
            )


async def get_embeddings_from_api(texts: list[str]) -> list[list[float]]:
    with PerformanceTimer(f"Get Embeddings from API (count={len(texts)})"):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{INFERENCE_API_URL}/embed",
                    json={"texts": texts},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data.get("vectors", [])
            except Exception as e:
                logging.error(f"Embedding API Error: {e}")
                return []


async def insert_data_to_qdrant(places: list[PlaceInfoDTO]):
    with PerformanceTimer(f"Insert Data to Qdrant (places={len(places)})"):
        if not places:
            return

        texts = []
        ids = []

        for p in places:
            base_info = f"{p.name}, {p.address}"

            if p.reviews:
                reviews_text = "\n".join([f"{r.text}" for r in p.reviews])
                summary = f"{base_info}. Reviews: {reviews_text}"
            else:
                summary = base_info

            texts.append(summary)

            stable_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, p.place_id))
            ids.append(stable_id)

        vectors = await get_embeddings_from_api(texts)
        if not vectors:
            logging.warning("No vectors returned from API. Skipping Qdrant upsert.")
            return

        points = [
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "place_id": p.place_id,
                    "name": p.name,
                    "address": p.address,
                    "reviews_summary": text_summary,
                    "lat_float": p.location.lat,
                    "lon_float": p.location.lon,
                    "location": {"lat": p.location.lat, "lon": p.location.lon},
                    "photos": p.photos,
                    "rating": p.rating,
                    "reviews_count": p.reviews_count,
                },
            )
            for p, vector, text_summary, point_id in zip(places, vectors, texts, ids)
        ]

        if not points:
            logging.warning("No points generated for Qdrant upsert.")
            return

        await qdrant.upsert(collection_name=COLLECTION_NAME, points=points)


async def search_places(
    user_query: str, lat: float, lon: float, radius_meters: int, limit: int = 100
) -> list:
    with PerformanceTimer(f"Search Places in Qdrant (limit={limit})"):
        user_vectors = await get_embeddings_from_api([user_query])
        if not user_vectors:
            logging.warning("No embedding for user query.")
            return []
            
        user_vector = user_vectors[0]

        geo_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="location",
                    geo_radius=models.GeoRadius(
                        center=models.GeoPoint(lat=lat, lon=lon),
                        radius=radius_meters,
                    ),
                )
            ]
        )

        hits = await qdrant.query_points(
            collection_name=COLLECTION_NAME,
            query=user_vector,
            query_filter=geo_filter,
            limit=limit,
            with_payload=True,
        )
        
        return [hit.payload for hit in hits.points]
