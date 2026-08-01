import os

from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "SmartFM"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # JWT auth settings. In production DEPLOY, set JWT_SECRET_KEY via environment variable.
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "smartfm-dev-secret-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = int(os.getenv("JWT_EXPIRES_MINUTES", "480"))


settings = Settings()
