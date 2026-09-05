import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_current_user_optional
from app.services.assistant_service import assistant_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["Multilingual Voice & Chat Assistant"])


class AssistantQueryRequest(BaseModel):
    query: str
    language: Optional[str] = "en"


class AssistantQueryResponse(BaseModel):
    response: str
    action: str = "none"
    action_payload: Optional[Dict[str, Any]] = None
    intent: str
    weather_data: Optional[Dict[str, Any]] = None


@router.post("/chat", response_model=AssistantQueryResponse, summary="Process conversational natural language assistant query")
def query_assistant(
    payload: AssistantQueryRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Processes spoken/typed agricultural assistant questions in English, Telugu, Tamil, or Hindi.
    Returns real user-specific farm, weather, crop, soil insights, or executes actions (navigation, profile updates).
    """
    if not current_user:
        current_user = db.query(User).filter(User.role == "farmer").first()
        if not current_user:
            current_user = User(
                id="guest_farmer",
                email="guest@farmassist.ai",
                full_name="Farmer User",
                role="farmer",
                district="Kakinada",
                state="Andhra Pradesh",
                current_crop="Paddy (Rice)",
                crop_stage="Vegetative Stage",
                soil_type="Loamy Soil",
                irrigation_method="Canal & Drip"
            )

    result = assistant_service.process_query(
        query=payload.query,
        language=payload.language or (getattr(current_user, "preferred_language", "en") or "en"),
        user=current_user,
        db=db
    )
    return AssistantQueryResponse(**result)
