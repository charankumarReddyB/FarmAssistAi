from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class FarmProfileBase(BaseModel):
    farm_name: Optional[str] = None
    farm_size: Optional[str] = None
    current_crop: Optional[str] = None
    soil_type: Optional[str] = None
    irrigation_method: Optional[str] = None
    sowing_date: Optional[str] = None
    crop_stage: Optional[str] = None
    experience_years: Optional[str] = None
    water_source: Optional[str] = None
    survey_number: Optional[str] = None


class FarmProfileUpdate(FarmProfileBase):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village_or_city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FarmProfileResponse(FarmProfileBase):
    id: str
    user_id: str
    farmer_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
