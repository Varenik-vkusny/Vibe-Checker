import logging
import warnings
from uuid import uuid4
from fastembed import TextEmbedding
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams
from ...config import get_settings

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


def get_embeddings(texts: list[str]):

    return list(embedding_model.embed(texts))


async def insert_data_to_qdrant(places: list):

    if not places:
        return

    texts = [p["reviews_summary"] for p in places]

    vectors = get_embeddings(texts)

    points = [
        PointStruct(
            id=str(uuid4()),
            vector=vector.tolist(),
            payload={
                "place_id": p["place_id"],
                "name": p["name"],
                "reviews": p["reviews_summary"],
                "lat": p["location"]["lat"],
                "lon": p["location"]["lon"],
            },
        )
        for p, vector in zip(places, vectors)
    ]

    await qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
    )


async def search_places(user_query: str, limit: int = 10) -> list:

    user_vector = list(embedding_model.embed([user_query]))[0]

    hits = await qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=user_vector,
        limit=limit,
        with_payload=True,
    )

    return [hit.payload for hit in hits.points]
