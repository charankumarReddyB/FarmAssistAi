import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserProfileUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User Profile & Location"])


@router.get("/profile", response_model=UserResponse, summary="Get current farmer profile and location")
def get_user_profile(db: Session = Depends(get_db)):
    """Retrieves current farmer profile including location and language settings."""
    user = db.query(User).first()
    if not user:
        # Create default user profile
        user = User(
            email="farmer@farmassist.ai",
            hashed_password="default_hash",
            full_name="Raju Reddy",
            role="farmer",
            country="India",
            state="Andhra Pradesh",
            district="Kakinada",
            city_town="Kakinada",
            village="Samalkota",
            latitude=16.98,
            longitude=82.24,
            preferred_language="en"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


@router.post("/profile", response_model=UserResponse, summary="Update farmer location and preferred language")
def update_user_profile(payload: UserProfileUpdate, db: Session = Depends(get_db)):
    """Updates farmer profile details including location (State, District, Village) and preferred language."""
    user = db.query(User).first()
    if not user:
        user = User(
            email="farmer@farmassist.ai",
            hashed_password="default_hash",
            full_name="Raju Reddy"
        )
        db.add(user)

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.country is not None:
        user.country = payload.country
    if payload.state is not None:
        user.state = payload.state
    if payload.district is not None:
        user.district = payload.district
    if payload.city_town is not None:
        user.city_town = payload.city_town
    if payload.village is not None:
        user.village = payload.village
    if payload.latitude is not None:
        user.latitude = payload.latitude
    if payload.longitude is not None:
        user.longitude = payload.longitude
    if payload.preferred_language is not None:
        user.preferred_language = payload.preferred_language

    db.commit()
    db.refresh(user)
    return user
