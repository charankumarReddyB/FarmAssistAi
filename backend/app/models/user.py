import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Boolean, Float
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True, default="Raju Reddy")
    role = Column(String(50), default="farmer")  # farmer, expert, admin
    is_active = Column(Boolean, default=True)

    # Location Information
    country = Column(String(100), default="India")
    state = Column(String(100), default="Andhra Pradesh")
    district = Column(String(100), default="Kakinada")
    city_town = Column(String(100), default="Kakinada")
    village = Column(String(100), default="Samalkota")
    latitude = Column(Float, nullable=True, default=16.98)
    longitude = Column(Float, nullable=True, default=82.24)

    # Preferences
    preferred_language = Column(String(10), default="en")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
