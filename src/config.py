"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # API
    api_key: str = "dev-api-key-123456"

    # DeepSeek API
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-v4-flash"

    # Database
    database_url: str = "sqlite:///./enosis.db"

    # Tesseract OCR
    tesseract_cmd: str = "/usr/bin/tesseract"

    # Mock eHealth+
    mock_ehealth_url: str = "http://localhost:8000/mock/ehealth"

    # App
    app_version: str = "v0-hackathon"
    app_name: str = "Enosis"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
