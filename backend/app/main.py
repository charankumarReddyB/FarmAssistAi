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
        ("users", "phone", "VARCHAR(50)"),
        ("users", "farm_name", "VARCHAR(255)"),
        ("users", "farm_size", "VARCHAR(100)"),
        ("users", "current_crop", "VARCHAR(100)"),
        ("users", "soil_type", "VARCHAR(100)"),
        ("users", "irrigation_method", "VARCHAR(100)"),
        ("users", "sowing_date", "VARCHAR(100)"),
        ("users", "crop_stage", "VARCHAR(100)"),
        ("users", "experience_years", "VARCHAR(50)"),
        ("users", "water_source", "VARCHAR(100)"),
        ("users", "survey_number", "VARCHAR(100)"),
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
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.core.security import hash_password, verify_password

    # Predefined Primary Administrator Account
    primary_admin_email = "charankumarreddybantrothula@gmail.com"
    primary_admin_pass = "Charan@123"

    db = SessionLocal()
    try:
        # 1. Primary Admin Account
        admin = db.query(User).filter(User.email == primary_admin_email).first()
        if not admin:
            admin = User(
                email=primary_admin_email,
                hashed_password=hash_password(primary_admin_pass),
                full_name="Charan Kumar Reddy",
                display_name="Charan Kumar Reddy",
                role="admin",
                preferred_language="en",
                is_active=True
            )
            db.add(admin)
            logger.info(f"Seeded primary admin account: {primary_admin_email}")
        else:
            # Ensure role and password are up to date
            admin.role = "admin"
            if not verify_password(primary_admin_pass, admin.hashed_password):
                admin.hashed_password = hash_password(primary_admin_pass)
            db.add(admin)

        # 2. General Admin Account (fallback)
        fallback_admin = db.query(User).filter(User.email == "admin@farmassist.ai").first()
        if not fallback_admin:
            fallback_admin = User(
                email="admin@farmassist.ai",
                hashed_password=hash_password("Admin@123456"),
                full_name="System Administrator",
                role="admin",
                preferred_language="en",
                is_active=True
            )
            db.add(fallback_admin)

        # 3. Expert Account
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
        else:
            expert.role = "expert"
            expert.hashed_password = hash_password("Expert@123456")
            db.add(expert)

        # 4. Farmer Account
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
        else:
            farmer.role = "farmer"
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
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
