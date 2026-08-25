import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.report import Report
from app.models.crop_image import CropImageAnalysis
from app.models.user import User
from app.models.farm import FarmProfile
from app.schemas.farm import FarmProfileUpdate, FarmProfileResponse
from app.services.farm_analysis_service import farm_analysis_service

from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/farm", tags=["Location-Based Agricultural Analysis & Farm Management"])


@router.get("/profile", response_model=FarmProfileResponse, summary="Get current user farm profile")
def get_user_farm_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the farm profile associated with the authenticated farmer,
    including farm dimensions, crop stage, and location info.
    """
    farm = db.query(FarmProfile).filter(FarmProfile.user_id == current_user.id).first()
    if not farm:
        # Create initial farm profile if absent
        farm = FarmProfile(
            user_id=current_user.id,
            farm_name=current_user.farm_name,
            farm_size=current_user.farm_size,
            current_crop=current_user.current_crop,
            soil_type=current_user.soil_type,
            irrigation_method=current_user.irrigation_method,
            sowing_date=current_user.sowing_date,
            crop_stage=current_user.crop_stage,
            experience_years=current_user.experience_years,
            water_source=current_user.water_source,
            survey_number=current_user.survey_number
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

    loc_dict = {
        "state": current_user.state,
        "district": current_user.district,
        "village_or_city": current_user.village_or_city or current_user.village,
        "latitude": current_user.latitude,
        "longitude": current_user.longitude
    }

    return FarmProfileResponse(
        id=farm.id,
        user_id=farm.user_id,
        farmer_name=current_user.full_name or current_user.display_name or "Farmer",
        phone=current_user.phone,
        farm_name=farm.farm_name or current_user.farm_name,
        farm_size=farm.farm_size or current_user.farm_size,
        current_crop=farm.current_crop or current_user.current_crop,
        soil_type=farm.soil_type or current_user.soil_type,
        irrigation_method=farm.irrigation_method or current_user.irrigation_method,
        sowing_date=farm.sowing_date or current_user.sowing_date,
        crop_stage=farm.crop_stage or current_user.crop_stage,
        experience_years=farm.experience_years or current_user.experience_years,
        water_source=farm.water_source or current_user.water_source,
        survey_number=farm.survey_number or current_user.survey_number,
        location=loc_dict,
        created_at=farm.created_at,
        updated_at=farm.updated_at
    )


@router.put("/profile", response_model=FarmProfileResponse, summary="Update current user farm profile")
@router.post("/profile", response_model=FarmProfileResponse, summary="Update current user farm profile")
def update_user_farm_profile(
    payload: FarmProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates farm details and related user fields in database.
    """
    farm = db.query(FarmProfile).filter(FarmProfile.user_id == current_user.id).first()
    if not farm:
        farm = FarmProfile(user_id=current_user.id)
        db.add(farm)

    # Update farm model fields
    if payload.farm_name is not None:
        farm.farm_name = payload.farm_name
        current_user.farm_name = payload.farm_name
    if payload.farm_size is not None:
        farm.farm_size = payload.farm_size
        current_user.farm_size = payload.farm_size
    if payload.current_crop is not None:
        farm.current_crop = payload.current_crop
        current_user.current_crop = payload.current_crop
    if payload.soil_type is not None:
        farm.soil_type = payload.soil_type
        current_user.soil_type = payload.soil_type
    if payload.irrigation_method is not None:
        farm.irrigation_method = payload.irrigation_method
        current_user.irrigation_method = payload.irrigation_method
    if payload.sowing_date is not None:
        farm.sowing_date = payload.sowing_date
        current_user.sowing_date = payload.sowing_date
    if payload.crop_stage is not None:
        farm.crop_stage = payload.crop_stage
        current_user.crop_stage = payload.crop_stage
    if payload.experience_years is not None:
        farm.experience_years = payload.experience_years
        current_user.experience_years = payload.experience_years
    if payload.water_source is not None:
        farm.water_source = payload.water_source
        current_user.water_source = payload.water_source
    if payload.survey_number is not None:
        farm.survey_number = payload.survey_number
        current_user.survey_number = payload.survey_number

    # Update user profile fields if included
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.state is not None:
        current_user.state = payload.state
    if payload.district is not None:
        current_user.district = payload.district
    if payload.village_or_city is not None:
        current_user.village_or_city = payload.village_or_city
        current_user.village = payload.village_or_city
    if payload.latitude is not None:
        current_user.latitude = payload.latitude
    if payload.longitude is not None:
        current_user.longitude = payload.longitude

    db.commit()
    db.refresh(farm)
    db.refresh(current_user)

    loc_dict = {
        "state": current_user.state,
        "district": current_user.district,
        "village_or_city": current_user.village_or_city or current_user.village,
        "latitude": current_user.latitude,
        "longitude": current_user.longitude
    }

    return FarmProfileResponse(
        id=farm.id,
        user_id=farm.user_id,
        farmer_name=current_user.full_name or current_user.display_name or "Farmer",
        phone=current_user.phone,
        farm_name=farm.farm_name or current_user.farm_name,
        farm_size=farm.farm_size or current_user.farm_size,
        current_crop=farm.current_crop or current_user.current_crop,
        soil_type=farm.soil_type or current_user.soil_type,
        irrigation_method=farm.irrigation_method or current_user.irrigation_method,
        sowing_date=farm.sowing_date or current_user.sowing_date,
        crop_stage=farm.crop_stage or current_user.crop_stage,
        experience_years=farm.experience_years or current_user.experience_years,
        water_source=farm.water_source or current_user.water_source,
        survey_number=farm.survey_number or current_user.survey_number,
        location=loc_dict,
        created_at=farm.created_at,
        updated_at=farm.updated_at
    )


@router.get("/location-analysis", summary="Get comprehensive location-based agricultural analysis")
def get_farm_location_analysis(
    location: Optional[str] = Query(None, description="Location string e.g. Kakinada, Andhra Pradesh"),
    state: Optional[str] = Query(None, description="State name e.g. Andhra Pradesh or Tamil Nadu"),
    district: Optional[str] = Query(None, description="District name e.g. Kakinada or Chennai"),
    city_town: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    language: Optional[str] = Query(None, description="Language code: en, te, ta, hi"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personalized location-based agricultural analysis combining live weather,
    regional climate, soil baseline datasets, crop suitability, disease risk, and farm risk assessment.
    """
    user = current_user

    target_state = state or user.state
    target_district = district or user.district
    target_city = city_town or user.village_or_city or user.city_town
    target_village = village or user.village
    target_lat = lat if lat is not None else user.latitude
    target_lon = lon if lon is not None else user.longitude
    target_lang = language or user.preferred_language or "en"

    if not target_state and not target_district and target_lat is None:
        return {
            "location_configured": False,
            "message": "Location not configured. Please enable location access or specify your region in Settings.",
            "location": {"district": "Not Configured", "state": "Not Configured"},
            "live_weather": {"location_configured": False, "temperature": None, "condition": "Unknown", "farm_impact": "Location not configured."},
            "regional_climate": {},
            "soil_baseline": {},
            "crop_suitability": [],
            "disease_risks": [],
            "farm_risk_assessment": {"overall_risk_score": 0, "risk_level": "UNKNOWN", "risk_factors": []}
        }

    target_state = target_state or "Andhra Pradesh"
    target_district = target_district or "Kakinada"
    target_city = target_city or "Kakinada"
    target_village = target_village or "Samalkota"
    target_lat = target_lat if target_lat is not None else 16.98
    target_lon = target_lon if target_lon is not None else 82.24

    target_location = location or f"{target_district}, {target_state}"

    # Fetch latest soil report if available
    latest_report = db.query(Report).order_by(Report.created_at.desc()).first()
    report_n, report_p, report_k, report_ph = None, None, None, None
    if latest_report and latest_report.extracted_data:
        ext = latest_report.extracted_data
        report_n = ext.get("nitrogen")
        report_p = ext.get("phosphorus")
        report_k = ext.get("potassium")
        report_ph = ext.get("ph")

    # Fetch latest crop image analysis if available
    latest_crop_analysis = db.query(CropImageAnalysis).order_by(CropImageAnalysis.created_at.desc()).first()
    detected_disease = latest_crop_analysis.disease_name if latest_crop_analysis else None

    return farm_analysis_service.analyze_farm(
        location=target_location,
        state=target_state,
        district=target_district,
        city_town=target_city,
        village=target_village,
        latitude=target_lat,
        longitude=target_lon,
        report_n=report_n,
        report_p=report_p,
        report_k=report_k,
        report_ph=report_ph,
        detected_disease=detected_disease,
        language=target_lang
    )
