import logging
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from .endpoints.users import router as user_router
from .endpoints.place import router as place_router
from app.modules.place import models as place_models
from app.modules.user import models as user_models
from app.modules.favorites import models as favorites_models
from app.modules.parsing import models as parsing_models


logging.basicConfig(level=logging.INFO)


async def lifespan(app: FastAPI):

    logging.info("Запускаю приложение...")

    yield

    logging.info("Останавливаю приложение...")


app = FastAPI(lifespan=lifespan)

origins = [
    "*",  # Звездочка (*) разрешает все источники
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Установите True, если вам нужны куки/заголовки авторизации
    # Но если True, то origins=["*"] работать не будет,
    # и нужно перечислить все разрешенные источники явно.
    allow_methods=["*"],  # Разрешить все HTTP методы (GET, POST, PUT, DELETE и т.д.)
    allow_headers=["*"],  # Разрешить все заголовки
)

app.include_router(user_router, prefix="/users")
app.include_router(place_router, prefix="/place")


@app.get("/", status_code=status.HTTP_200_OK)
async def hello():
    return {"message": "Hello Timurka!"}
