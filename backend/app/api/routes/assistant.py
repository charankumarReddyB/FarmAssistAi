import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_current_user
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Processes spoken/typed agricultural assistant questions in English, Telugu, Tamil, or Hindi.
    Returns real user-specific farm, weather, crop, soil insights, or executes actions (navigation, profile updates).
    """
    result = assistant_service.process_query(
        query=payload.query,
        language=payload.language or current_user.preferred_language or "en",
        user=current_user,
        db=db
    )
    return AssistantQueryResponse(**result)
