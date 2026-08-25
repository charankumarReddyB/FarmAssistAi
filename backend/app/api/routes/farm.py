import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.services.farm_analysis_service import farm_analysis_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/farm", tags=["Location-Based Agricultural Analysis"])


@router.get("/location-analysis", summary="Get comprehensive location-based agricultural analysis")
def get_farm_location_analysis(
    location: Optional[str] = Query(None, description="Location string e.g. Kakinada, Andhra Pradesh"),
    state: Optional[str] = Query(None, description="State name e.g. Andhra Pradesh or Tamil Nadu"),
    district: Optional[str] = Query(None, description="District name e.g. Kakinada or Chennai"),
    city_town: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    language: Optional[str] = Query("en", description="Language code: en, te, ta, hi"),
    db: Session = Depends(get_db)
):
    """
    Returns personalized location-based agricultural analysis combining live weather,
    regional climate, soil baseline datasets, crop suitability, disease risk, and farm risk assessment.
    """
    # Fetch default farmer profile if query parameters are missing
    user = db.query(User).filter(User.role == "farmer").first()

    target_state = state or (user.state if user else "Andhra Pradesh")
    target_district = district or (user.district if user else "Kakinada")
    target_city = city_town or (user.city_town if user else "Kakinada")
    target_village = village or (user.village if user else "Samalkota")
    target_lat = lat if lat is not None else (user.latitude if user else 16.98)
    target_lon = lon if lon is not None else (user.longitude if user else 82.24)
    target_lang = language or (user.preferred_language if user else "en")

    target_location = location or f"{target_district}, {target_state}"

    return farm_analysis_service.analyze_farm(
        location=target_location,
        state=target_state,
        district=target_district,
        city_town=target_city,
        village=target_village,
        latitude=target_lat,
        longitude=target_lon,
        language=target_lang
    )
