import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.report import Report
from app.models.advisory import Advisory
from app.schemas.advisory import StructuredAdvisoryResponse
from app.api.routes.expert import build_advisory_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/advisories", tags=["Farmer Advisories"])


@router.get("/{report_id}", response_model=StructuredAdvisoryResponse, summary="Get structured advisory by report ID or advisory ID")
def get_advisory_by_report(report_id: str, db: Session = Depends(get_db)):
    """
    Retrieves generated farmer advisory in structured JSON format for a specific report ID or advisory ID.
    If no advisory exists yet, triggers automated analysis on the fly.
    """
    advisory = db.query(Advisory).filter(Advisory.report_id == report_id).first()
    if not advisory:
        advisory = db.query(Advisory).filter(Advisory.id == report_id).first()

    report = db.query(Report).filter(Report.id == report_id).first()

    if not report and not advisory:
        raise HTTPException(status_code=404, detail=f"No report or advisory found for ID '{report_id}'.")

    # If report exists but advisory hasn't been generated yet
    if not advisory and report:
        from app.services.advisory_service import advisory_service
        raw_text = report.raw_text or f"Soil report filename: {report.filename}"
        return advisory_service.generate_advisory(raw_text=raw_text, report_id=report_id)

    return build_advisory_response(advisory, db)


@router.get("", response_model=List[StructuredAdvisoryResponse], summary="List all advisories")
def list_advisories(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Lists all advisories in the system."""
    advisories = db.query(Advisory).order_by(Advisory.created_at.desc()).offset(skip).limit(limit).all()
    return [build_advisory_response(adv, db) for adv in advisories]
