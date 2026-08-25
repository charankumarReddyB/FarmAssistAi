import datetime
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from app.core.database import Base


class FarmProfile(Base):
    __tablename__ = "farm_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, unique=True, index=True, nullable=False)
    farm_name = Column(String(255), nullable=True, default=None)
    farm_size = Column(String(100), nullable=True, default=None)
    current_crop = Column(String(100), nullable=True, default=None)
    soil_type = Column(String(100), nullable=True, default=None)
    irrigation_method = Column(String(100), nullable=True, default=None)
    sowing_date = Column(String(100), nullable=True, default=None)
    crop_stage = Column(String(100), nullable=True, default=None)
    water_source = Column(String(100), nullable=True, default=None)
    survey_number = Column(String(100), nullable=True, default=None)
    experience_years = Column(String(50), nullable=True, default=None)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
