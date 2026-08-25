import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.advisory import Advisory
from app.models.report import Report
from app.models.crop_image import CropImageAnalysis
from app.schemas.user import (
    UserResponse,
    UserStatusUpdate,
    UserRoleUpdate,
    UserCreate,
)
from app.core.security import require_roles, hash_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin Portal & System Governance"])

# Enforce ADMIN role on all admin routes
admin_guard = Depends(require_roles(["admin"]))


@router.get("/stats", dependencies=[admin_guard], summary="System-wide metrics and counts")
def get_admin_stats(db: Session = Depends(get_db)):
    """
    Returns total count of Farmers, Experts, Advisories, Soil Reports,
    Crop Analyses, and breakdown of advisory statuses.
    """
    total_farmers = db.query(User).filter(User.role == "farmer").count()
    total_experts = db.query(User).filter(User.role == "expert").count()
    total_admins = db.query(User).filter(User.role == "admin").count()
    total_users = db.query(User).count()

    total_advisories = db.query(Advisory).count()
    pending_advisories = db.query(Advisory).filter(Advisory.status == "pending_review").count()
    approved_advisories = db.query(Advisory).filter(Advisory.status == "approved").count()
    modified_advisories = db.query(Advisory).filter(Advisory.status == "modified").count()
    rejected_advisories = db.query(Advisory).filter(Advisory.status == "rejected").count()

    total_soil_reports = db.query(Report).count()
    total_crop_analyses = db.query(CropImageAnalysis).count()

    return {
        "users": {
            "total": total_users,
            "farmers": total_farmers,
            "experts": total_experts,
            "admins": total_admins,
        },
        "advisories": {
            "total": total_advisories,
            "pending": pending_advisories,
            "approved": approved_advisories,
            "modified": modified_advisories,
            "rejected": rejected_advisories,
        },
        "analyses": {
            "soil_reports": total_soil_reports,
            "crop_analyses": total_crop_analyses,
        }
    }


@router.get("/users", response_model=List[UserResponse], dependencies=[admin_guard], summary="List all system users")
def list_users(
    role: Optional[str] = Query(None, description="Filter by role: farmer, expert, admin"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db)
):
    """Lists system users with optional role filtering and text search."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.lower().strip())
    if search:
        search_pattern = f"%{search}%"
        query = query.filter((User.full_name.ilike(search_pattern)) | (User.email.ilike(search_pattern)))

    return query.order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserResponse, dependencies=[admin_guard], summary="Create new user")
def create_user_by_admin(payload: UserCreate, db: Session = Depends(get_db)):
    """Admin creates a new user with specified role."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    valid_roles = ["farmer", "expert", "admin"]
    role = payload.role.lower().strip()
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role}'. Allowed roles: {valid_roles}"
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=role,
        country=payload.country or None,
        state=payload.state or None,
        district=payload.district or None,
        city_town=payload.city_town or None,
        village=payload.village or None,
        preferred_language=payload.preferred_language or "en",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/status", response_model=UserResponse, dependencies=[admin_guard], summary="Activate or deactivate user account")
def update_user_status(user_id: str, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    """Toggles user active state."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/role", response_model=UserResponse, dependencies=[admin_guard], summary="Update user role")
def update_user_role(user_id: str, payload: UserRoleUpdate, db: Session = Depends(get_db)):
    """Updates user role (farmer, expert, admin)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    valid_roles = ["farmer", "expert", "admin"]
    role = payload.role.lower().strip()
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role}'. Allowed roles: {valid_roles}"
        )

    user.role = role
    db.commit()
    db.refresh(user)
    return user
