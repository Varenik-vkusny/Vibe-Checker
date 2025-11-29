import logging
from fastapi import FastAPI, status
from .endpoints.users import router as user_router
from .endpoints.place import router as place_router


logging.basicConfig(level=logging.INFO)


async def lifespan(app: FastAPI):

    logging.info("Запускаю приложение...")

    yield

    logging.info("Останавливаю приложение...")


app = FastAPI(lifespan=lifespan)
app.include_router(user_router, prefix="/users")
app.include_router(place_router, prefix="/place")


@app.get("/", status_code=status.HTTP_200_OK)
async def hello():
    return {"message": "Hello Timurka!"}
