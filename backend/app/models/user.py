import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Boolean, Float
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True, default=None)
    display_name = Column(String(255), nullable=True, default=None)
    avatar_url = Column(String(512), nullable=True, default=None)
    phone = Column(String(50), nullable=True, default=None)
    role = Column(String(50), default="farmer")  # farmer, expert, admin
    onboarding_completed = Column(Boolean, default=False)
    auth_provider = Column(String(50), default="email")
    is_active = Column(Boolean, default=True)

    # Location Information
    country = Column(String(100), nullable=True, default=None)
    state = Column(String(100), nullable=True, default=None)
    district = Column(String(100), nullable=True, default=None)
    city_town = Column(String(100), nullable=True, default=None)
    village_or_city = Column(String(100), nullable=True, default=None)
    village = Column(String(100), nullable=True, default=None)
    latitude = Column(Float, nullable=True, default=None)
    longitude = Column(Float, nullable=True, default=None)

    # Farm Fields
    farm_name = Column(String(255), nullable=True, default=None)
    farm_size = Column(String(100), nullable=True, default=None)
    current_crop = Column(String(100), nullable=True, default=None)
    soil_type = Column(String(100), nullable=True, default=None)
    irrigation_method = Column(String(100), nullable=True, default=None)
    sowing_date = Column(String(100), nullable=True, default=None)
    crop_stage = Column(String(100), nullable=True, default=None)
    experience_years = Column(String(50), nullable=True, default=None)
    water_source = Column(String(100), nullable=True, default=None)
    survey_number = Column(String(100), nullable=True, default=None)

    # Preferences
    preferred_language = Column(String(10), default="en")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
