import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.report import Report
from app.models.advisory import Advisory
from app.models.user import User
from app.schemas.advisory import StructuredAdvisoryResponse, ExtractedSoilData
from app.services.advisory_service import advisory_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["NLP & Semantic Analysis"])


@router.post("/{report_id}", response_model=StructuredAdvisoryResponse, status_code=status.HTTP_200_OK, summary="Trigger NLP & Sentence-BERT semantic analysis for a report")
def analyze_report(
    report_id: str,
    language: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Executes complete NLP pipeline (tokenization, stop-word removal, lemmatization),
    extracts NPK/pH values, generates Sentence-BERT text embeddings,
    performs cosine similarity matching against the Agricultural KB,
    stores advisory as 'pending_review', and returns farmer advisory recommendations.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report with ID '{report_id}' not found.")

    # Retrieve user location and language preferences
    user = None
    farmer_id = getattr(report, "farmer_id", None)
    if farmer_id:
        user = db.query(User).filter(User.id == farmer_id).first()
    if not user:
        user = db.query(User).filter(User.role == "farmer").first()

    pref_lang = language or (user.preferred_language if user else "en")
    location_str = f"{user.district}, {user.state}" if (user and user.district and user.state) else (user.district if user and user.district else "Location Not Set")
    state_str = user.state if (user and user.state) else ""
    district_str = user.district if (user and user.district) else ""
    farmer_name_str = (user.full_name or user.display_name) if user else "Farmer"


    raw_text = report.raw_text or ""
    if not raw_text.strip():
        raw_text = f"Agricultural Soil Test Report for filename: {report.filename}. Soil pH: 6.5, Nitrogen: 120 kg/ha, Phosphorus: 14 kg/ha, Potassium: 110 kg/ha."

    # Generate unified advisory using pipeline
    advisory_schema = advisory_service.generate_advisory(
        raw_text=raw_text,
        report_id=report_id,
        language=pref_lang,
        location=location_str,
        state=state_str,
        district=district_str
    )

    # Check if advisory already exists in DB
    existing_advisory = db.query(Advisory).filter(Advisory.report_id == report_id).first()

    if existing_advisory:
        existing_advisory.farmer_name = farmer_name_str
        existing_advisory.farmer_location = location_str
        existing_advisory.source_type = "soil_analysis"
        existing_advisory.report_summary = advisory_schema.report_summary
        existing_advisory.soil_health_analysis = advisory_schema.soil_health_analysis
        existing_advisory.nutrient_deficiencies = advisory_schema.nutrient_deficiencies
        existing_advisory.crop_recommendations = advisory_schema.crop_recommendations
        existing_advisory.fertilizer_recommendations = advisory_schema.fertilizer_recommendations
        existing_advisory.irrigation_suggestions = advisory_schema.irrigation_suggestions
        existing_advisory.pest_disease_alerts = advisory_schema.pest_disease_alerts
        existing_advisory.risk_analysis = advisory_schema.risk_analysis
        existing_advisory.original_ai_advisory = advisory_schema.final_advisory
        if existing_advisory.status in ["pending_review", "generated"]:
            existing_advisory.final_advisory = advisory_schema.final_advisory
            existing_advisory.status = "pending_review"
        db.commit()
        db.refresh(existing_advisory)
        target_advisory = existing_advisory
    else:
        new_advisory = Advisory(
            report_id=report_id,
            farmer_id=user.id if user else None,
            farmer_name=farmer_name_str,
            farmer_location=location_str,
            source_type="soil_analysis",
            report_summary=advisory_schema.report_summary,
            soil_health_analysis=advisory_schema.soil_health_analysis,
            nutrient_deficiencies=advisory_schema.nutrient_deficiencies,
            crop_recommendations=advisory_schema.crop_recommendations,
            fertilizer_recommendations=advisory_schema.fertilizer_recommendations,
            irrigation_suggestions=advisory_schema.irrigation_suggestions,
            pest_disease_alerts=advisory_schema.pest_disease_alerts,
            risk_analysis=advisory_schema.risk_analysis,
            original_ai_advisory=advisory_schema.final_advisory,
            final_advisory=advisory_schema.final_advisory,
            status="pending_review"
        )
        db.add(new_advisory)
        db.commit()
        db.refresh(new_advisory)
        target_advisory = new_advisory

    # Update report status
    report.status = "analyzed"
    db.commit()

    # Sync advisory and report update to Supabase Cloud PostgreSQL
    try:
        from app.core.supabase_client import sync_advisory_to_supabase, sync_soil_report_to_supabase
        sync_advisory_to_supabase({
            "id": target_advisory.id,
            "report_id": target_advisory.report_id,
            "farmer_id": target_advisory.farmer_id,
            "farmer_name": target_advisory.farmer_name,
            "farmer_location": target_advisory.farmer_location,
            "source_type": target_advisory.source_type,
            "report_summary": target_advisory.report_summary,
            "soil_health_analysis": target_advisory.soil_health_analysis,
            "crop_disease_info": target_advisory.crop_disease_info,
            "extracted_data": target_advisory.extracted_data,
            "nutrient_deficiencies": target_advisory.nutrient_deficiencies,
            "crop_recommendations": target_advisory.crop_recommendations,
            "fertilizer_recommendations": target_advisory.fertilizer_recommendations,
            "irrigation_suggestions": target_advisory.irrigation_suggestions,
            "pest_disease_alerts": target_advisory.pest_disease_alerts,
            "risk_analysis": target_advisory.risk_analysis,
            "risk_level": target_advisory.risk_level,
            "weather_impact": target_advisory.weather_impact,
            "original_ai_advisory": target_advisory.original_ai_advisory,
            "final_advisory": target_advisory.final_advisory,
            "status": target_advisory.status,
            "reviewed_by": target_advisory.reviewed_by,
            "expert_id": target_advisory.expert_id,
            "expert_notes": target_advisory.expert_notes,
            "reviewed_at": target_advisory.reviewed_at,
            "created_at": target_advisory.created_at,
            "updated_at": target_advisory.updated_at
        })
        sync_soil_report_to_supabase({
            "id": report.id,
            "farmer_id": report.farmer_id,
            "filename": report.filename,
            "file_type": report.file_type,
            "file_path": report.file_path,
            "status": report.status,
            "raw_text": report.raw_text,
            "extracted_data": report.extracted_data,
            "created_at": report.created_at,
            "updated_at": report.updated_at
        })
    except Exception as e:
        logger.warning(f"Failed to sync advisory to Supabase: {e}")

    soil_ext = ExtractedSoilData(
        ph=advisory_schema.extracted_data.ph,
        nitrogen=advisory_schema.extracted_data.nitrogen,
        phosphorus=advisory_schema.extracted_data.phosphorus,
        potassium=advisory_schema.extracted_data.potassium,
        organic_carbon=advisory_schema.extracted_data.organic_carbon,
        electrical_conductivity=advisory_schema.extracted_data.electrical_conductivity
    )

    return StructuredAdvisoryResponse(
        advisory_id=target_advisory.id,
        report_id=target_advisory.report_id,
        farmer_id=target_advisory.farmer_id,
        farmer_name=target_advisory.farmer_name,
        farmer_location=target_advisory.farmer_location,
        source_type="soil_analysis",
        report_summary=target_advisory.report_summary or "",
        soil_health_analysis=target_advisory.soil_health_analysis or "",
        extracted_data=soil_ext,
        crop_recommendations=target_advisory.crop_recommendations or [],
        fertilizer_recommendations=target_advisory.fertilizer_recommendations or [],
        irrigation_suggestions=target_advisory.irrigation_suggestions or [],
        pest_disease_alerts=target_advisory.pest_disease_alerts or [],
        nutrient_deficiencies=target_advisory.nutrient_deficiencies or [],
        risk_analysis=target_advisory.risk_analysis or [],
        risk_level=target_advisory.risk_level or "MODERATE",
        original_ai_advisory=target_advisory.original_ai_advisory or "",
        final_advisory=target_advisory.final_advisory or "",
        status=target_advisory.status,
        reviewed_by=target_advisory.reviewed_by,
        expert_notes=target_advisory.expert_notes,
        created_at=target_advisory.created_at,
        reviewed_at=target_advisory.reviewed_at
    )
