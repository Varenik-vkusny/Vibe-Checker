import logging
from fastapi import FastAPI, status
from .endpoints.users import router as user_router
from .endpoints.place import router as place_router
from app.modules.analysis_result import models
from app.modules.favorites import models
from app.modules.parsing import models
from app.modules.place import models
from app.modules.place_tag import models
from app.modules.tag import models
from app.modules.user import models


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
