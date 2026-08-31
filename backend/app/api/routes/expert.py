import datetime
import logging
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.advisory import Advisory
from app.models.report import Report
from app.models.crop_image import CropImageAnalysis
from app.schemas.advisory import (
    StructuredAdvisoryResponse,
    ExtractedSoilData,
    ExpertApproveRequest,
    ExpertModifyRequest,
    ExpertRejectRequest,
    ExpertReviewRequest,
)
from app.core.security import require_roles, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/expert", tags=["Expert Review Workflow"])


def _extract_float(val: Any) -> Optional[float]:
    """Helper to extract float value from raw numeric or dictionary representations."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, dict):
        v = val.get("value")
        if v is not None and isinstance(v, (int, float)):
            return float(v)
    return None


def build_advisory_response(adv: Advisory, db: Session) -> StructuredAdvisoryResponse:
    """Helper to convert Advisory ORM model into StructuredAdvisoryResponse schema."""
    soil_ext = None
    ed = None
    
    if adv.report_id:
        report = db.query(Report).filter(Report.id == adv.report_id).first()
        if report and report.extracted_data:
            ed = report.extracted_data
    elif adv.extracted_data:
        ed = adv.extracted_data

    if ed and isinstance(ed, dict):
        soil_ext = ExtractedSoilData(
            ph=_extract_float(ed.get("ph")),
            nitrogen=_extract_float(ed.get("nitrogen")),
            phosphorus=_extract_float(ed.get("phosphorus")),
            potassium=_extract_float(ed.get("potassium")),
            organic_carbon=_extract_float(ed.get("organic_carbon")),
            electrical_conductivity=_extract_float(ed.get("electrical_conductivity"))
        )

    farmer_name_val = adv.farmer_name
    farmer_loc_val = adv.farmer_location

    if (not farmer_name_val or not farmer_loc_val) and adv.farmer_id:
        f_user = db.query(User).filter(User.id == adv.farmer_id).first()
        if f_user:
            farmer_name_val = farmer_name_val or f_user.full_name or f_user.display_name or f_user.email.split("@")[0]
            if not farmer_loc_val:
                farmer_loc_val = f"{f_user.district}, {f_user.state}" if f_user.district and f_user.state else f_user.district or f_user.state or "Location Not Set"

    return StructuredAdvisoryResponse(
        advisory_id=adv.id,
        report_id=adv.report_id,
        crop_analysis_id=adv.crop_analysis_id,
        farmer_id=adv.farmer_id or "farmer_user",
        farmer_name=farmer_name_val or "Farmer",
        farmer_location=farmer_loc_val or "Location Not Set",
        source_type=adv.source_type or "soil_analysis",
        report_summary=adv.report_summary or "",
        soil_health_analysis=adv.soil_health_analysis or "",
        crop_disease_info=adv.crop_disease_info,
        extracted_data=soil_ext,
        crop_recommendations=adv.crop_recommendations or [],
        fertilizer_recommendations=adv.fertilizer_recommendations or [],
        irrigation_suggestions=adv.irrigation_suggestions or [],
        pest_disease_alerts=adv.pest_disease_alerts or [],
        nutrient_deficiencies=adv.nutrient_deficiencies or [],
        risk_analysis=adv.risk_analysis or [],
        risk_level=adv.risk_level or "MODERATE",
        weather_impact=adv.weather_impact,
        original_ai_advisory=adv.original_ai_advisory or adv.final_advisory or "",
        final_advisory=adv.final_advisory or "",
        status=adv.status or "pending_review",
        reviewed_by=adv.reviewed_by,
        expert_id=adv.expert_id,
        expert_notes=adv.expert_notes,
        created_at=adv.created_at,
        reviewed_at=adv.reviewed_at
    )


@router.get("/advisories", response_model=List[StructuredAdvisoryResponse], summary="List advisories waiting for expert review")
def list_expert_advisories(
    status_filter: Optional[str] = Query(None, alias="status"),
    source_type: Optional[str] = Query(None),
    current_user: Any = Depends(require_roles(["expert", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Returns advisories for the Expert Review Dashboard.
    Supports filtering by status (e.g. pending_review, approved, modified, rejected) and source_type.
    """
    query = db.query(Advisory)
    
    if status_filter:
        query = query.filter(Advisory.status == status_filter)
    else:
        query = query.filter(Advisory.status.in_(["pending_review", "generated", "under_review", "approved", "modified", "rejected"]))

    if source_type:
        query = query.filter(Advisory.source_type == source_type)

    advisories = query.order_by(Advisory.created_at.desc()).all()
    return [build_advisory_response(adv, db) for adv in advisories]


@router.get("/advisories/{advisory_id}", response_model=StructuredAdvisoryResponse, summary="Get complete advisory details for expert review")
def get_expert_advisory_by_id(
    advisory_id: str, 
    current_user: Any = Depends(require_roles(["expert", "admin"])),
    db: Session = Depends(get_db)
):
    """Retrieves full details of a specific advisory by ID for expert inspection."""
    adv = db.query(Advisory).filter(Advisory.id == advisory_id).first()
    if not adv:
        adv = db.query(Advisory).filter(Advisory.report_id == advisory_id).first()
    if not adv:
        raise HTTPException(status_code=404, detail=f"Advisory with ID '{advisory_id}' not found.")

    if adv.status in ["pending_review", "generated"]:
        adv.status = "under_review"
        db.commit()
        db.refresh(adv)

    return build_advisory_response(adv, db)


@router.post("/advisories/{advisory_id}/approve", response_model=StructuredAdvisoryResponse, summary="Approve AI-generated advisory")
def approve_advisory(
    advisory_id: str,
    payload: ExpertApproveRequest = ExpertApproveRequest(),
    current_user: Any = Depends(require_roles(["expert", "admin"])),
    db: Session = Depends(get_db)
):
    """Approves the AI-generated advisory and marks status as 'approved'."""
    adv = db.query(Advisory).filter(Advisory.id == advisory_id).first()
    if not adv:
        adv = db.query(Advisory).filter(Advisory.report_id == advisory_id).first()
    if not adv:
        raise HTTPException(status_code=404, detail=f"Advisory with ID '{advisory_id}' not found.")

    adv.status = "approved"
    adv.reviewed_by = payload.expert_name or current_user.full_name
    adv.expert_id = payload.expert_id or current_user.id
    adv.expert_notes = payload.notes
    adv.reviewed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(adv)
    return build_advisory_response(adv, db)


@router.post("/advisories/{advisory_id}/modify", response_model=StructuredAdvisoryResponse, summary="Modify AI advisory with expert updates")
def modify_advisory(
    advisory_id: str,
    payload: ExpertModifyRequest,
    current_user: Any = Depends(require_roles(["expert", "admin"])),
    db: Session = Depends(get_db)
):
    """Allows expert to submit a modified final advisory and expert notes, setting status to 'modified'."""
    adv = db.query(Advisory).filter(Advisory.id == advisory_id).first()
    if not adv:
        adv = db.query(Advisory).filter(Advisory.report_id == advisory_id).first()
    if not adv:
        raise HTTPException(status_code=404, detail=f"Advisory with ID '{advisory_id}' not found.")

    adv.status = "modified"
    adv.final_advisory = payload.modified_advisory
    adv.reviewed_by = payload.expert_name or current_user.full_name
    adv.expert_id = payload.expert_id or current_user.id
    adv.expert_notes = payload.expert_notes
    adv.reviewed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(adv)
    return build_advisory_response(adv, db)


@router.post("/advisories/{advisory_id}/reject", response_model=StructuredAdvisoryResponse, summary="Reject invalid advisory")
def reject_advisory(
    advisory_id: str,
    payload: ExpertRejectRequest,
    current_user: Any = Depends(require_roles(["expert", "admin"])),
    db: Session = Depends(get_db)
):
    """Rejects an invalid or inaccurate advisory with a specified reason, setting status to 'rejected'."""
    adv = db.query(Advisory).filter(Advisory.id == advisory_id).first()
    if not adv:
        adv = db.query(Advisory).filter(Advisory.report_id == advisory_id).first()
    if not adv:
        raise HTTPException(status_code=404, detail=f"Advisory with ID '{advisory_id}' not found.")

    adv.status = "rejected"
    adv.reviewed_by = payload.expert_name
    adv.expert_id = payload.expert_id
    adv.expert_notes = payload.rejection_reason
    adv.reviewed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(adv)
    return build_advisory_response(adv, db)


@router.get("/pending", response_model=List[StructuredAdvisoryResponse], summary="List all advisories pending expert review")
def list_pending_reviews(db: Session = Depends(get_db)):
    """Lists advisories waiting for expert validation."""
    pending_advisories = db.query(Advisory).filter(Advisory.status.in_(["pending_review", "generated", "under_review"])).all()
    return [build_advisory_response(adv, db) for adv in pending_advisories]


@router.post("/review", response_model=StructuredAdvisoryResponse, summary="Legacy review endpoint")
def legacy_review_advisory(payload: ExpertReviewRequest, db: Session = Depends(get_db)):
    """Legacy review endpoint forwarding to approve/modify/reject handlers."""
    adv_id = payload.advisory_id or payload.report_id
    if not adv_id:
        raise HTTPException(status_code=400, detail="Must provide advisory_id or report_id.")

    action = payload.action.lower().strip()
    if action == "approve":
        return approve_advisory(adv_id, ExpertApproveRequest(expert_name=payload.expert_name, notes=payload.expert_notes), db)
    elif action == "modify":
        return modify_advisory(adv_id, ExpertModifyRequest(expert_name=payload.expert_name, modified_advisory=payload.modified_final_advisory or "", expert_notes=payload.expert_notes), db)
    elif action == "reject":
        return reject_advisory(adv_id, ExpertRejectRequest(expert_name=payload.expert_name, rejection_reason=payload.expert_notes), db)
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action '{action}'. Must be approve, modify, or reject.")
