import logging
import os
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, status, Depends
from .modules.admin.dependencies import get_current_admin_user
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import all models here to prevent circular import errors with SQLAlchemy
from app.modules.analysis_result import models as analysis_result_models
from app.modules.favorites import models as favorites_models
from app.modules.parsing import models as parsing_models
from app.modules.place import models as place_models
from app.modules.place_tag import models as place_tag_models
from app.modules.tag import models as tag_models
from app.modules.user import models as user_models
from app.modules.interactions import models as inter_models


from .endpoints.users import router as user_router
from .endpoints.place import router as place_router
from .endpoints.admin import router as admin_router
from .endpoints.recommendation import router as recommendation_router
from .endpoints.interaction import router as interaction_router
from .endpoints.favorites import router as favorites_router

logging.basicConfig(level=logging.INFO)

LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "system.log")


def setup_logging():
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = RotatingFileHandler(
        LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)

    logging.getLogger().addHandler(file_handler)
    logging.getLogger("uvicorn").addHandler(file_handler)
    logging.getLogger("uvicorn.access").addHandler(file_handler)

    logging.getLogger().setLevel(logging.INFO)


setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):

    logging.info("Запускаю приложение...")

    yield

    logging.info("Останавливаю приложение...")


app = FastAPI(lifespan=lifespan)

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user_router, prefix="/users")
app.include_router(place_router, prefix="/place")
app.include_router(
    recommendation_router,
    prefix="/rec",
    tags=["Recommendations"],
)
app.include_router(
    admin_router,
    prefix="/admin",
    tags=["Admin Panel"],
    dependencies=[Depends(get_current_admin_user)],
)
app.include_router(interaction_router, prefix="/interactions", tags=["Interactions"])
app.include_router(favorites_router, prefix="/favorites", tags=["Favorites"])


@app.get("/", status_code=status.HTTP_200_OK)
async def hello():
    return {"message": "Hello Timurka!"}


# Force reload
