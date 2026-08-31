import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from app.core.database import Base


class Advisory(Base):
    __tablename__ = "advisories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, ForeignKey("reports.id"), nullable=True)
    crop_analysis_id = Column(String, ForeignKey("crop_image_analyses.id"), nullable=True)
    
    farmer_id = Column(String(255), nullable=True)
    farmer_name = Column(String(255), nullable=True)
    farmer_location = Column(String(255), nullable=True)
    source_type = Column(String(50), default="soil_analysis")  # soil_analysis, crop_analysis, combined_analysis

    
    report_summary = Column(Text, nullable=True)
    soil_health_analysis = Column(Text, nullable=True)
    crop_disease_info = Column(Text, nullable=True)
    
    # Structured recommendations & observations stored as JSON
    extracted_data = Column(JSON, nullable=True)
    nutrient_deficiencies = Column(JSON, nullable=True)
    crop_recommendations = Column(JSON, nullable=True)
    fertilizer_recommendations = Column(JSON, nullable=True)
    irrigation_suggestions = Column(JSON, nullable=True)
    pest_disease_alerts = Column(JSON, nullable=True)
    risk_analysis = Column(JSON, nullable=True)
    risk_level = Column(String(50), default="MODERATE")
    weather_impact = Column(Text, nullable=True)
    
    original_ai_advisory = Column(Text, nullable=True)
    final_advisory = Column(Text, nullable=True)
    
    # Review workflow status: generated, pending_review, under_review, approved, modified, rejected
    status = Column(String(50), default="pending_review")
    reviewed_by = Column(String(255), nullable=True)
    expert_id = Column(String(255), nullable=True)
    expert_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
