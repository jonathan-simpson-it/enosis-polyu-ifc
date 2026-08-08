"""Application configuration with environment variable support."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Enosis UDIE"
    app_version: str = "v0-production-mvp"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://enosis:enosis@localhost:5432/enosis"
    database_url_sync: str = "postgresql://enosis:enosis@localhost:5432/enosis"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    api_key_header: str = "X-API-Key"

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-v4-flash"

    tesseract_cmd: str = "/usr/bin/tesseract"

    mock_tsw_url: str = "http://localhost:8000/mock/tsw"

    upload_max_size_mb: int = 20
    default_subscription_limit: int = 100

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
