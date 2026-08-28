import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

SQLITE_DB_PATH = "farmassist.db"

db_url = settings.DATABASE_URL or f"sqlite:///./{SQLITE_DB_PATH}"

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
    db_url = f"sqlite:///./{SQLITE_DB_PATH}"
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
