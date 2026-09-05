from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    role: str = "farmer"  # farmer, expert, admin
    onboarding_completed: bool = False
    auth_provider: str = "email"
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city_town: Optional[str] = None
    village_or_city: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_language: str = "en"

    # Farm Information
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


class UserCreate(UserBase):
    password: str


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    preferred_language: str = "en"
    state: Optional[str] = None
    district: Optional[str] = None
    city_town: Optional[str] = None
    village_or_city: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserLoginRequest(BaseModel):
    email: str
    password: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city_town: Optional[str] = None
    village_or_city: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_language: Optional[str] = None
    onboarding_completed: Optional[bool] = None

    # Farm Fields
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


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str


class UserAdminEditRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village_or_city: Optional[str] = None
    preferred_language: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    location: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
