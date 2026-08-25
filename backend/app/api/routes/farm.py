import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.report import Report
from app.models.crop_image import CropImageAnalysis
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
    latest_crop = db.query(CropImageAnalysis).filter(CropImageAnalysis.status == "analyzed").order_by(CropImageAnalysis.created_at.desc()).first()
    detected_disease = latest_crop.disease_name if latest_crop else None

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
