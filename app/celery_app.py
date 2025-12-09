from celery import Celery
from celery.schedules import crontab
from .config import get_settings

settings = get_settings()

REDIS_URL = settings.redis_url

celery = Celery("vibe_checker", broker=REDIS_URL, backend=REDIS_URL)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Almaty",
    enable_utc=True,
)

celery.conf.beat_schedule = {
    "daily-db-backup": {
        "task": "backup_database_task",
        "schedule": crontab(hour=3, minute=0),
    },
    "refresh-old-analyses": {
        "task": "refresh_outdated_analysis_task",
        "schedule": crontab(minute=0, hour="*/12"),
    },
}


from .tasks import analysis_tasks
from .tasks import periodic_tasks
