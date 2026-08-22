from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ExtractedSoilData(BaseModel):
    ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_carbon: Optional[float] = None
    electrical_conductivity: Optional[float] = None


class SemanticMatch(BaseModel):
    category: str
    similarity_score: float
    matched_knowledge: str


class SemanticAnalysisResult(BaseModel):
    matched_topics: List[SemanticMatch] = []
    top_similarity_score: float = 0.0


class StructuredAdvisoryResponse(BaseModel):
    advisory_id: str
    report_id: Optional[str] = None
    crop_analysis_id: Optional[str] = None
    farmer_id: Optional[str] = "farmer_001"
    farmer_name: Optional[str] = "Raju Reddy"
    farmer_location: Optional[str] = "Kakinada, Andhra Pradesh"
    source_type: str = "soil_analysis"
    
    report_summary: str = ""
    soil_health_analysis: str = ""
    crop_disease_info: Optional[str] = None
    
    extracted_data: Optional[ExtractedSoilData] = None
    crop_recommendations: List[str] = []
    fertilizer_recommendations: List[str] = []
    irrigation_suggestions: List[str] = []
    pest_disease_alerts: List[str] = []
    nutrient_deficiencies: List[str] = []
    risk_analysis: List[str] = []
    risk_level: str = "MODERATE"
    weather_impact: Optional[str] = None
    
    original_ai_advisory: str = ""
    final_advisory: str = ""
    
    status: str = "pending_review"  # generated, pending_review, under_review, approved, modified, rejected
    reviewed_by: Optional[str] = None
    expert_id: Optional[str] = None
    expert_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpertApproveRequest(BaseModel):
    expert_id: Optional[str] = "exp_101"
    expert_name: Optional[str] = "Dr. M. S. Swaminathan (Agri Specialist)"
    notes: Optional[str] = "Verified for field application."


class ExpertModifyRequest(BaseModel):
    expert_id: Optional[str] = "exp_101"
    expert_name: Optional[str] = "Dr. M. S. Swaminathan (Agri Specialist)"
    modified_advisory: str
    expert_notes: str


class ExpertRejectRequest(BaseModel):
    expert_id: Optional[str] = "exp_101"
    expert_name: Optional[str] = "Dr. M. S. Swaminathan (Agri Specialist)"
    rejection_reason: str


class ExpertReviewRequest(BaseModel):
    report_id: Optional[str] = None
    advisory_id: Optional[str] = None
    expert_name: str = "Dr. M. S. Swaminathan (Agri Specialist)"
    expert_notes: str = ""
    action: str = "approve"  # approve, modify, reject
    modified_final_advisory: Optional[str] = None
