import os
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.crop_image import CropImageAnalysis
from app.models.advisory import Advisory
from app.models.user import User
from app.schemas.crop_image import CropImageUploadResponse, CropDiseaseAnalysisResponse
from app.services.dataset_crop_disease_service import dataset_disease_service
from app.services.image_preprocessing_service import image_preprocessing_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crop-analysis", tags=["Crop Image Disease Analysis"])

MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB limit
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

CROP_UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "crop_images")
os.makedirs(CROP_UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=CropImageUploadResponse, status_code=status.HTTP_201_CREATED, summary="Upload a crop leaf image for disease diagnosis")
async def upload_crop_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a crop leaf image (JPG, JPEG, PNG, WEBP).
    Validates file format, file size, non-empty condition, and image integrity via PIL.
    Stores image safely and returns image_id.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format '{file_ext}'. Allowed formats: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )

    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty (0 bytes).")
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="Image file size exceeds maximum allowed 20MB limit.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read crop image {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to read image file: {str(e)}")

    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(CROP_UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.error(f"Failed to save crop image to disk: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    try:
        image_preprocessing_service.validate_and_load_image(file_path)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Corrupted or unreadable crop image: {str(e)}")

    # Upload to Supabase Storage bucket 'crop-images'
    from app.core.supabase_client import upload_file_to_supabase_storage
    storage_path = upload_file_to_supabase_storage("crop-images", file_path, unique_filename)

    new_record = CropImageAnalysis(
        filename=file.filename,
        file_path=storage_path or file_path,
        upload_status="success",
        status="uploaded"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return CropImageUploadResponse(
        image_id=new_record.id,
        filename=new_record.filename,
        upload_status="success",
        file_path=new_record.file_path,
        created_at=new_record.created_at
    )


@router.post("/analyze/{image_id}", response_model=CropDiseaseAnalysisResponse, status_code=status.HTTP_200_OK, summary="Analyze crop leaf image using MobileNetV2 Deep Learning classifier")
def analyze_crop_image(
    image_id: str,
    language: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Runs PyTorch MobileNetV2 Deep Learning model on uploaded crop leaf image,
    retrieves disease symptoms & treatments from Disease KB, evaluates live weather risk,
    stores advisory as 'pending_review', and returns synthesized advisory.
    """
    record = db.query(CropImageAnalysis).filter(CropImageAnalysis.id == image_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Crop image with ID '{image_id}' not found.")

    user = None
    farmer_id = getattr(record, "farmer_id", None)
    if farmer_id:
        user = db.query(User).filter(User.id == farmer_id).first()
    if not user:
        user = db.query(User).filter(User.role == "farmer").first()

    pref_lang = language or (user.preferred_language if user else "en")
    location_str = f"{user.district}, {user.state}" if (user and user.district and user.state) else (user.district if user and user.district else "Location Not Set")
    farmer_name_str = (user.full_name or user.display_name) if user else "Farmer"

    analysis = dataset_disease_service.analyze_crop_image(
        image_path=record.file_path,
        filename=record.filename,
        language=pref_lang,
        location=location_str
    )

    record.crop_type = analysis["crop_type"]
    record.disease_name = analysis["disease_name"]
    record.confidence_score = analysis["confidence_score"]
    record.risk_level = analysis["risk_level"]
    record.symptoms = analysis["symptoms"]
    record.management_recommendations = analysis["management_recommendations"]
    record.weather_impact = analysis["weather_impact"]
    record.final_advisory = analysis["final_advisory"]
    record.status = "analyzed"

    db.commit()
    db.refresh(record)

    # Persist corresponding Advisory for Expert Review
    existing_adv = db.query(Advisory).filter(Advisory.crop_analysis_id == image_id).first()
    if existing_adv:
        existing_adv.farmer_name = farmer_name_str
        existing_adv.farmer_location = location_str
        existing_adv.source_type = "crop_analysis"
        existing_adv.crop_disease_info = f"{analysis['crop_type']} — {analysis['disease_name']} ({int(analysis['confidence_score']*100)}% confidence)"
        existing_adv.risk_level = analysis["risk_level"]
        existing_adv.weather_impact = analysis["weather_impact"]
        existing_adv.crop_recommendations = analysis["management_recommendations"]
        existing_adv.pest_disease_alerts = analysis["symptoms"]
        existing_adv.original_ai_advisory = analysis["final_advisory"]
        if existing_adv.status in ["pending_review", "generated"]:
            existing_adv.final_advisory = analysis["final_advisory"]
            existing_adv.status = "pending_review"
        db.commit()
    else:
        new_adv = Advisory(
            crop_analysis_id=image_id,
            farmer_id=user.id if user else None,
            farmer_name=farmer_name_str,
            farmer_location=location_str,
            source_type="crop_analysis",
            crop_disease_info=f"{analysis['crop_type']} — {analysis['disease_name']} ({int(analysis['confidence_score']*100)}% confidence)",
            risk_level=analysis["risk_level"],
            weather_impact=analysis["weather_impact"],
            crop_recommendations=analysis["management_recommendations"],
            pest_disease_alerts=analysis["symptoms"],
            original_ai_advisory=analysis["final_advisory"],
            final_advisory=analysis["final_advisory"],
            status="pending_review"
        )
        db.add(new_adv)
        db.commit()

    return CropDiseaseAnalysisResponse(
        analysis_id=record.id,
        crop_type=record.crop_type,
        disease_name=record.disease_name,
        confidence_score=record.confidence_score,
        disease_status=analysis["disease_status"],
        risk_level=record.risk_level,
        symptoms=record.symptoms,
        management_recommendations=record.management_recommendations,
        location=location_str,
        weather_impact=record.weather_impact,
        final_advisory=record.final_advisory,
        status="analyzed",
        created_at=record.created_at
    )


@router.get("/{analysis_id}", response_model=CropDiseaseAnalysisResponse, summary="Get crop image disease analysis by ID")
def get_crop_analysis(analysis_id: str, db: Session = Depends(get_db)):
    """Retrieves crop image disease analysis results by ID."""
    record = db.query(CropImageAnalysis).filter(CropImageAnalysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Crop analysis record '{analysis_id}' not found.")

    return CropDiseaseAnalysisResponse(
        analysis_id=record.id,
        crop_type=record.crop_type or "Paddy / Rice",
        disease_name=record.disease_name or "Healthy Crop",
        confidence_score=record.confidence_score or 0.95,
        disease_status="Disease Detected" if record.risk_level != "NONE" else "Healthy",
        risk_level=record.risk_level or "NONE",
        symptoms=record.symptoms or [],
        management_recommendations=record.management_recommendations or [],
        location="Kakinada, Andhra Pradesh",
        weather_impact=record.weather_impact or "Weather is favorable.",
        final_advisory=record.final_advisory or "",
        status=record.status,
        created_at=record.created_at
    )
