import os
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.report import Report
from app.schemas.report import ReportResponse
from app.services.pdf_service import pdf_service
from app.services.ocr_service import ocr_service
from app.services.extraction_service import extraction_service

from app.models.user import User
from app.core.security import get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Agricultural Reports"])

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB limit
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}


@router.post("/upload", response_model=ReportResponse, status_code=status.HTTP_201_CREATED, summary="Upload an agricultural report (PDF or Image)")
async def upload_report(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Uploads a soil test, lab, or agricultural report (PDF or Image format).
    Validates file format and size, extracts text using PyMuPDF or Tesseract/EasyOCR,
    runs NLP parameter extraction, and stores metadata associated with the farmer.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file filename provided.")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read contents and validate file size & non-empty requirement
    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes). Please upload a valid report.")
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File size exceeds maximum allowed limit of 20MB.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read uploaded file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    # Generate unique filename to prevent collisions
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save uploaded file safely
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.error(f"Failed to write file to disk {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Upload to Supabase Storage bucket 'soil-reports'
    from app.core.supabase_client import upload_file_to_supabase_storage
    storage_path = upload_file_to_supabase_storage("soil-reports", file_path, unique_filename)

    file_type = file.content_type or file_ext[1:]
    raw_text = ""

    # Extract text based on file extension with automatic fallback
    try:
        if file_ext == ".pdf":
            raw_text = pdf_service.extract_text(file_path)
        else:
            raw_text = ocr_service.extract_text_from_image(file_path)
    except Exception as e:
        logger.warning(f"Text extraction warning for {file.filename}: {e}")
        raw_text = f"[Text extraction attempted. Raw file saved at {file_path}]"

    # Run parameter extraction
    extracted_data = extraction_service.extract_all(raw_text)

    # Associate with authenticated farmer
    farmer_id = current_user.id if current_user else None

    # Save report to database
    new_report = Report(
        farmer_id=farmer_id,
        filename=file.filename,
        file_type=file_type,
        file_path=storage_path or file_path,
        status="processed" if raw_text.strip() else "uploaded",
        raw_text=raw_text,
        extracted_data=extracted_data
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Sync to Supabase Cloud PostgreSQL
    try:
        from app.core.supabase_client import sync_soil_report_to_supabase
        sync_soil_report_to_supabase({
            "id": new_report.id,
            "farmer_id": new_report.farmer_id,
            "filename": new_report.filename,
            "file_type": new_report.file_type,
            "file_path": new_report.file_path,
            "status": new_report.status,
            "raw_text": new_report.raw_text,
            "extracted_data": new_report.extracted_data,
            "created_at": new_report.created_at,
            "updated_at": new_report.updated_at
        })
    except Exception as e:
        logger.warning(f"Failed to sync soil report to Supabase: {e}")

    # Attach response metadata
    response_data = ReportResponse.model_validate(new_report)
    response_data.upload_status = "success"
    return response_data


@router.get("/{report_id}", response_model=ReportResponse, summary="Get report details by ID")
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Retrieves uploaded report metadata, extracted parameters, and raw text."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report with ID '{report_id}' not found.")
    res = ReportResponse.model_validate(report)
    res.upload_status = "success"
    return res


@router.get("", response_model=List[ReportResponse], summary="List all uploaded reports")
def list_reports(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Lists all uploaded reports sorted by creation date."""
    reports = db.query(Report).order_by(Report.created_at.desc()).offset(skip).limit(limit).all()
    results = []
    for r in reports:
        item = ReportResponse.model_validate(r)
        item.upload_status = "success"
        results.append(item)
    return results
