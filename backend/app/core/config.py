import os

from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "SmartFM"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
