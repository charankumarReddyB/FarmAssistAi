import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.core.database import Base, engine
from app.api.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("farmassist")


def migrate_sqlite_columns():
    """Applies ALTER TABLE migrations for newly added SQLite columns."""
    columns_to_add = [
        ("advisories", "crop_analysis_id", "VARCHAR"),
        ("advisories", "farmer_id", "VARCHAR(255)"),
        ("advisories", "farmer_name", "VARCHAR(255)"),
        ("advisories", "farmer_location", "VARCHAR(255)"),
        ("advisories", "source_type", "VARCHAR(50) DEFAULT 'soil_analysis'"),
        ("advisories", "crop_disease_info", "TEXT"),
        ("advisories", "extracted_data", "JSON"),
        ("advisories", "risk_level", "VARCHAR(50) DEFAULT 'MODERATE'"),
        ("advisories", "weather_impact", "TEXT"),
        ("advisories", "original_ai_advisory", "TEXT"),
        ("advisories", "expert_id", "VARCHAR(255)"),
    ]

    with engine.connect() as conn:
        for table, col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                logger.info(f"Added column {col_name} to table {table}.")
            except Exception:
                # Column already exists
                pass


def seed_default_users():
    """Seeds initial Admin, Expert, and Farmer accounts if not present."""
    import os
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.core.security import hash_password, verify_password

    admin_email = os.getenv("ADMIN_EMAIL", "admin@farmassist.ai")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123456")

    db = SessionLocal()
    try:
        # 1. Admin Account
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                full_name="System Administrator",
                role="admin",
                preferred_language="en",
                is_active=True
            )
            db.add(admin)
            logger.info(f"Seeded default admin account: {admin_email}")

        # 2. Expert Account
        expert = db.query(User).filter(User.email == "expert@farmassist.ai").first()
        if not expert:
            expert = User(
                email="expert@farmassist.ai",
                hashed_password=hash_password("Expert@123456"),
                full_name="Dr. Anand Sharma",
                role="expert",
                preferred_language="en",
                is_active=True
            )
            db.add(expert)
            logger.info("Seeded default expert account: expert@farmassist.ai")

        # 3. Farmer Account
        farmer = db.query(User).filter(User.email == "farmer@farmassist.ai").first()
        if not farmer:
            farmer = User(
                email="farmer@farmassist.ai",
                hashed_password=hash_password("Farmer@123456"),
                full_name="Raju Reddy",
                role="farmer",
                preferred_language="en",
                is_active=True
            )
            db.add(farmer)
            logger.info("Seeded default farmer account: farmer@farmassist.ai")
        elif farmer.hashed_password == "default_hash" or not verify_password("Farmer@123456", farmer.hashed_password):
            farmer.hashed_password = hash_password("Farmer@123456")
            db.add(farmer)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed default accounts: {e}")
    finally:
        db.close()


# Create database tables automatically on startup
try:
    Base.metadata.create_all(bind=engine)
    migrate_sqlite_columns()
    seed_default_users()
    logger.info("Database schema initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database tables: {e}")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    description="""
    ## FarmAssist AI – Backend API
    **NLP-Based Agricultural Report Interpretation and Farmer Advisory System**
    """,
    version="1.0.0"
)

# Configure CORS Middleware for Frontend Integration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to FarmAssist AI Backend API",
        "documentation": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
