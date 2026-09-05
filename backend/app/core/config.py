import os
from typing import List, Union, Any
from pydantic import field_validator

# Load env files early — support both 'env' and '.env' filenames
try:
    from dotenv import load_dotenv
    _base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for _fname in [".env", "env"]:
        _fpath = os.path.join(_base, _fname)
        if os.path.exists(_fpath):
            load_dotenv(_fpath, override=False)
            break
except Exception:
    pass

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:
    from pydantic import BaseModel as BaseSettings
    SettingsConfigDict = None


# Base Directory (backend/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    PROJECT_NAME: str = "FarmAssist AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "farmassist_secret_key_change_in_production"

    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "farmassist_db"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Union[str, None] = (
        os.getenv("DATABASE_URL")
        or (f"sqlite:////tmp/farmassist.db" if os.getenv("VERCEL") else f"sqlite:///{os.path.join(BASE_DIR, 'farmassist.db')}")
    )

    # Uploads
    UPLOAD_DIR: str = (
        os.getenv("UPLOAD_DIR")
        or ("/tmp/uploads" if os.getenv("VERCEL") else os.path.join(BASE_DIR, "uploads"))
    )
    MAX_UPLOAD_SIZE_MB: int = 10

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:8443",
        "http://127.0.0.1:8443",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: Union[str, None], info) -> str:
        if isinstance(v, str) and v.strip():
            return v
        values = info.data if hasattr(info, 'data') else {}
        user = values.get("POSTGRES_USER", "postgres")
        password = values.get("POSTGRES_PASSWORD", "postgres")
        server = values.get("POSTGRES_SERVER", "localhost")
        port = values.get("POSTGRES_PORT", "5432")
        db = values.get("POSTGRES_DB", "farmassist_db")
        return f"postgresql://{user}:{password}@{server}:{port}/{db}"

    if SettingsConfigDict is not None:
        model_config = SettingsConfigDict(
            env_file=(".env", "env"),
            env_file_encoding="utf-8",
            extra="ignore",
            case_sensitive=True
        )


settings = Settings()

# Ensure uploads directory exists
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception:
    pass
