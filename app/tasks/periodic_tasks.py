import os
import subprocess
import logging
from datetime import datetime, timedelta
from sqlalchemy import select
from ..celery_app import celery
from ..database import AsyncLocalSession
from ..modules.place.models import Place
from ..modules.parsing.models import ParsingRequest
from ..modules.analysis_result.models import AnalysisResult
from .analysis_tasks import analyze_place_task
from ..config import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)


@celery.task(name="backup_database_task")
def backup_database_task():

    logger.info("Starting Database Backup...")

    db_user = settings.db_user
    db_password = settings.db_password
    db_host = settings.db_host
    db_name = settings.db_name

    backup_dir = "/app/backups"
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{backup_dir}/backup_{timestamp}.sql"

    command = f"PGPASSWORD='{db_password}' pg_dump -h {db_host} -U {db_user} -d {db_name} -F c -f {filename}"

    try:
        subprocess.run(command, shell=True, check=True)
        logger.info(f"Backup created successfully: {filename}")
        return f"Backup created: {filename}"
    except subprocess.CalledProcessError as e:
        logger.error(f"Backup failed: {e}")
        raise e


@celery.task(name="refresh_outdated_analysis_task")
def refresh_outdated_analysis_task():
    """
    Находит места, которые анализировались более 30 дней назад,
    и запускает их переанализ.
    """
    import asyncio

    return asyncio.run(_find_and_refresh_places())


async def _find_and_refresh_places():
    logger.info("Checking for outdated analyses...")

    threshold_date = datetime.utcnow() - timedelta(days=30)

    async with AsyncLocalSession() as db:
        query = (
            select(Place)
            .join(Place.analysis)
            .where(AnalysisResult.created_at < threshold_date)
            .limit(5)
        )

        result = await db.execute(query)
        places = result.scalars().all()

        count = 0
        for place in places:
            logger.info(f"Re-queueing analysis for: {place.name}")
            analyze_place_task.delay(place.source_url, limit=5)
            count += 1

    logger.info(f"Queued {count} places for refresh.")
