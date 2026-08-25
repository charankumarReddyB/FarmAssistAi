from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = "Raju Reddy"
    role: str = "farmer"  # farmer, expert, admin
    country: Optional[str] = "India"
    state: Optional[str] = "Andhra Pradesh"
    district: Optional[str] = "Kakinada"
    city_town: Optional[str] = "Kakinada"
    village: Optional[str] = "Samalkota"
    latitude: Optional[float] = 16.98
    longitude: Optional[float] = 82.24
    preferred_language: str = "en"


class UserCreate(UserBase):
    password: str


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "farmer"  # farmer, expert, admin
    preferred_language: str = "en"
    state: Optional[str] = "Andhra Pradesh"
    district: Optional[str] = "Kakinada"
    city_town: Optional[str] = "Kakinada"
    village: Optional[str] = "Samalkota"


class UserLoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  # optional validation for portal matching


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city_town: Optional[str] = None
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_language: Optional[str] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

