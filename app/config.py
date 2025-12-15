from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field
from functools import lru_cache


class Settings(BaseSettings):
    db_driver: str = "postgresql+asyncpg"
    db_host: str
    db_port: int = 5432
    db_user: str
    db_password: str
    db_name: str
    hf_home: str

    algorithm: str
    secret_key: str
    access_token_expire_minutes: int

    gemini_api_key: str
    google_api_key_parse: str
    serpapi_key: str
    outscraper_api_key: str
    apify_api_token: str
    serper_api_key: str

    collection_name: str

    redis_url: str

    @computed_field
    @property
    def db_url(self) -> str:
        return f"{self.db_driver}://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings():
    return Settings()
