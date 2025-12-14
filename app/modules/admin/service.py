import os
import aiofiles
from fastapi.responses import FileResponse


LOG_FILE_PATH = "logs/system.log"


class AdminService:

    @staticmethod
    async def get_system_logs(lines_count: int = 100):

        if not os.path.exists(LOG_FILE_PATH):
            return ["Log file not found."]

        async with aiofiles.open(LOG_FILE_PATH, mode="r", encoding="utf-8") as f:
            lines = await f.readlines()

        return [line.strip() for line in lines[-lines_count:]]

    @staticmethod
    def get_log_file_download():

        if not os.path.exists(LOG_FILE_PATH):
            return None

        return FileResponse(
            path=LOG_FILE_PATH, filename="system_full_log.txt", media_type="text/plain"
        )

    @staticmethod
    async def clear_logs_cache():
        """
        Очистка файла логов (опционально, кнопка Clear Cache).
        """
        async with aiofiles.open(LOG_FILE_PATH, mode="w", encoding="utf-8") as f:
            await f.write("")
        return {"status": "Logs cleared"}
