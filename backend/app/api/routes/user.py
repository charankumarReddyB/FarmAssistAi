import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.farm import FarmProfile
from app.schemas.user import UserResponse, UserProfileUpdate

from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User Profile & Location"])


@router.get("/profile", response_model=UserResponse, summary="Get current farmer profile and location")
def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Retrieves current farmer profile including location, farm details, and language settings."""
    loc_dict = {
        "state": current_user.state,
        "district": current_user.district,
        "village_or_city": current_user.village_or_city or current_user.village,
        "latitude": current_user.latitude,
        "longitude": current_user.longitude
    }
    user_resp = UserResponse.model_validate(current_user)
    user_resp.location = loc_dict
    return user_resp


@router.post("/complete-onboarding", response_model=UserResponse, summary="Mark onboarding as completed for current user")
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks onboarding_completed = True for the current authenticated user."""
    current_user.onboarding_completed = True
    db.commit()
    db.refresh(current_user)
    loc_dict = {
        "state": current_user.state,
        "district": current_user.district,
        "village_or_city": current_user.village_or_city or current_user.village,
        "latitude": current_user.latitude,
        "longitude": current_user.longitude
    }
    user_resp = UserResponse.model_validate(current_user)
    user_resp.location = loc_dict
    return user_resp


@router.post("/profile", response_model=UserResponse, summary="Update farmer profile, location and farm details")
@router.put("/profile", response_model=UserResponse, summary="Update farmer profile, location and farm details")
def update_user_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates farmer profile details including location, phone, and farm configuration."""
    user = current_user

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.country is not None:
        user.country = payload.country
    if payload.state is not None:
        user.state = payload.state
    if payload.district is not None:
        user.district = payload.district
    if payload.city_town is not None:
        user.city_town = payload.city_town
    if payload.village_or_city is not None:
        user.village_or_city = payload.village_or_city
        user.village = payload.village_or_city
    if payload.village is not None:
        user.village = payload.village
        if payload.village_or_city is None:
            user.village_or_city = payload.village
    if payload.latitude is not None:
        user.latitude = payload.latitude
    if payload.longitude is not None:
        user.longitude = payload.longitude
    if payload.preferred_language is not None:
        user.preferred_language = payload.preferred_language
    if payload.onboarding_completed is not None:
        user.onboarding_completed = payload.onboarding_completed

    # Farm fields update
    if payload.farm_name is not None:
        user.farm_name = payload.farm_name
    if payload.farm_size is not None:
        user.farm_size = payload.farm_size
    if payload.current_crop is not None:
        user.current_crop = payload.current_crop
    if payload.soil_type is not None:
        user.soil_type = payload.soil_type
    if payload.irrigation_method is not None:
        user.irrigation_method = payload.irrigation_method
    if payload.sowing_date is not None:
        user.sowing_date = payload.sowing_date
    if payload.crop_stage is not None:
        user.crop_stage = payload.crop_stage
    if payload.experience_years is not None:
        user.experience_years = payload.experience_years
    if payload.water_source is not None:
        user.water_source = payload.water_source
    if payload.survey_number is not None:
        user.survey_number = payload.survey_number

    # Sync with farm_profiles table
    farm = db.query(FarmProfile).filter(FarmProfile.user_id == user.id).first()
    if not farm:
        farm = FarmProfile(user_id=user.id)
        db.add(farm)
    
    farm.farm_name = user.farm_name
    farm.farm_size = user.farm_size
    farm.current_crop = user.current_crop
    farm.soil_type = user.soil_type
    farm.irrigation_method = user.irrigation_method
    farm.sowing_date = user.sowing_date
    farm.crop_stage = user.crop_stage
    farm.experience_years = user.experience_years
    farm.water_source = user.water_source
    farm.survey_number = user.survey_number

    db.commit()
    db.refresh(user)

    loc_dict = {
        "state": user.state,
        "district": user.district,
        "village_or_city": user.village_or_city or user.village,
        "latitude": user.latitude,
        "longitude": user.longitude
    }
    user_resp = UserResponse.model_validate(user)
    user_resp.location = loc_dict
    return user_resp
