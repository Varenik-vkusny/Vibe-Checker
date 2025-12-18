import time
import logging
from contextlib import ContextDecorator

logger = logging.getLogger(__name__)


class PerformanceTimer(ContextDecorator):
    def __init__(self, name: str, level: int = logging.INFO):
        self.name = name
        self.level = level
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        logger.log(self.level, f"[START] {self.name}")
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        elapsed = time.time() - self.start_time
        status = "FAILED" if exc_type else "DONE"
        logger.log(self.level, f"[PERF] {self.name} - {status} in {elapsed:.4f}s")
        return False
