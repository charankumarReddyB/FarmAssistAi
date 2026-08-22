from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class ParameterValue(BaseModel):
    value: Optional[float] = None
    unit: Optional[str] = None
    confidence: float = 0.90


class ExtractedDataDetails(BaseModel):
    ph: Optional[ParameterValue] = None
    nitrogen: Optional[ParameterValue] = None
    phosphorus: Optional[ParameterValue] = None
    potassium: Optional[ParameterValue] = None
    organic_carbon: Optional[ParameterValue] = None
    electrical_conductivity: Optional[ParameterValue] = None
    soil_type: Optional[str] = "Loamy Soil"
    crops_detected: List[str] = []
    diseases_detected: List[str] = []
    nutrient_deficiencies: List[str] = []
    summary: Optional[str] = None


class ReportBase(BaseModel):
    filename: str
    file_type: str


class ReportCreate(ReportBase):
    pass


class ReportResponse(ReportBase):
    id: str
    file_path: str
    status: str
    raw_text: Optional[str] = None
    extracted_data: Optional[Dict[str, Any]] = None
    upload_status: str = "success"
    created_at: datetime

    class Config:
        from_attributes = True
