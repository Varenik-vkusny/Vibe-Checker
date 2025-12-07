import logging
import warnings
import uuid
from fastembed import TextEmbedding
from qdrant_client import AsyncQdrantClient
from qdrant_client import models
from qdrant_client.models import PointStruct, Distance, VectorParams
from ...config import get_settings
from ..place.schemas import PlaceInfoDTO

logging.basicConfig(level=logging.INFO)

settings = get_settings()

COLLECTION_NAME = settings.collection_name

qdrant = AsyncQdrantClient(url="http://qdrant:6333")

CACHE_DIR = "/app/model_cache"

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    # Добавляем cache_dir
    embedding_model = TextEmbedding(
        model_name="intfloat/multilingual-e5-large", cache_dir=CACHE_DIR
    )


async def init_vector_db():
    if not await qdrant.collection_exists(COLLECTION_NAME):
        await qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
        )
        await qdrant.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="location",
            field_schema=models.PayloadSchemaType.GEO,
        )


def get_embeddings(texts: list[str]):

    return list(embedding_model.embed(texts))


async def insert_data_to_qdrant(places: list[PlaceInfoDTO]):
    if not places:
        return

    texts = []
    ids = []  # Сюда будем складывать стабильные ID

    for p in places:
        if p.reviews:
            summary = "\n".join([f"{r.text}" for r in p.reviews])
        else:
            summary = f"{p.name} {p.address}"

        texts.append(summary)

        # 🔥 ГЕНЕРИРУЕМ СТАБИЛЬНЫЙ ID
        # uuid5 создает уникальный хеш на основе строки (place_id).
        # Для одного и того же place_id результат ВСЕГДА будет одинаковым.
        stable_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, p.place_id))
        ids.append(stable_id)

    vectors = get_embeddings(texts)

    points = [
        PointStruct(
            id=point_id,  # <--- Используем наш стабильный ID
            vector=vector.tolist(),
            payload={
                "place_id": p.place_id,
                "name": p.name,
                "reviews_summary": text_summary,
                "lat_float": p.location.lat,
                "lon_float": p.location.lon,
                "location": {"lat": p.location.lat, "lon": p.location.lon},
            },
        )
        for p, vector, text_summary, point_id in zip(places, vectors, texts, ids)
    ]

    # Qdrant Upsert: если ID совпадает, он обновит данные. Дубликатов не будет.
    await qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
    )


async def search_places(
    user_query: str, lat: float, lon: float, radius_meters: int, limit: int = 10
) -> list:

    user_vector = list(embedding_model.embed([user_query]))[0]

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
