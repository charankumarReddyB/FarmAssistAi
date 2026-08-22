import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["Health & Status"])


@router.get("", summary="Check backend health and database connectivity")
def check_health(db: Session = Depends(get_db)):
    """
    Returns system health, timestamp, and tests active database connection.
    """
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "service": "FarmAssist AI Backend API",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": db_status,
        "features": {
            "pdf_text_extraction": "active",
            "ocr_service": "active",
            "nlp_preprocessing": "active",
            "entity_extraction": "active",
            "semantic_bert_embeddings": "active",
            "advisory_generation": "active",
            "expert_review": "active"
        }
    }
