import os
import aiofiles
from fastapi.responses import FileResponse


LOG_FILE_PATH = "logs/system.log"


class AdminService:

    @staticmethod
    async def get_system_logs(lines_count: int = 100):
        """
        Асинхронно читает последние N строк лога.
        """
        if not os.path.exists(LOG_FILE_PATH):
            return ["Log file not found."]

        # Читаем файл. Для огромных файлов лучше использовать seek,
        # но для ротируемых логов (10мб) readlines() приемлемо.
        async with aiofiles.open(LOG_FILE_PATH, mode="r", encoding="utf-8") as f:
            lines = await f.readlines()

        # Возвращаем последние N строк, очищая от лишних пробелов
        return [line.strip() for line in lines[-lines_count:]]

    @staticmethod
    def get_log_file_download():
        """
        Возвращает FileResponse для скачивания.
        """
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
