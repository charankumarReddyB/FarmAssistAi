import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Float, JSON
from app.core.database import Base


class CropImageAnalysis(Base):
    __tablename__ = "crop_image_analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    upload_status = Column(String(50), default="success")
    
    crop_type = Column(String(100), default="Paddy / Rice")
    disease_class = Column(String(100), nullable=True)
    disease_name = Column(String(255), nullable=True)
    confidence_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="MODERATE")
    
    symptoms = Column(JSON, default=list)
    management_recommendations = Column(JSON, default=list)
    weather_impact = Column(String(500), nullable=True)
    final_advisory = Column(String(1000), nullable=True)
    
    status = Column(String(50), default="processed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
