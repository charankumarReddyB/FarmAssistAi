import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

# Resolve absolute path to farmassist.db in backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "farmassist.db").replace("\\", "/")

db_url = settings.DATABASE_URL
if not db_url:
    fallback_path = "/tmp/farmassist.db" if os.getenv("VERCEL") else SQLITE_DB_PATH
    db_url = f"sqlite:///{fallback_path}"

# Test connection and fallback to SQLite if remote connection fails
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except Exception as e:
    logger.warning(f"[DATABASE] Connection to {db_url} failed ({e}). Falling back to SQLite local database.")
    fallback_path = "/tmp/farmassist.db" if os.getenv("VERCEL") else SQLITE_DB_PATH
    db_url = f"sqlite:///{fallback_path}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for obtaining database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
