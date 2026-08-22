from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CropImageUploadResponse(BaseModel):
    image_id: str
    filename: str
    upload_status: str = "success"
    file_path: Optional[str] = None
    created_at: Optional[datetime] = None


class CropDiseaseAnalysisResponse(BaseModel):
    analysis_id: str
    crop_type: str = "Paddy / Rice"
    disease_name: str
    confidence_score: float
    disease_status: str
    risk_level: str
    symptoms: List[str] = []
    management_recommendations: List[str] = []
    location: str = "Kakinada, Andhra Pradesh"
    weather_impact: str
    final_advisory: str
    status: str = "analyzed"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
