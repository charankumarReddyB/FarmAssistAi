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
    UserAdminEditRequest,
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

    primary_admin_email = "charankumarreddybantrothula@gmail.com"
    valid_roles = ["farmer", "expert", "admin"]
    role = payload.role.lower().strip()
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role}'. Allowed roles: {valid_roles}"
        )

    if role == "admin" and payload.email.lower() != primary_admin_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Administrator access is strictly restricted to {primary_admin_email}."
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        display_name=payload.full_name,
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

    # Sync to Supabase profiles
    try:
        from app.core.supabase_client import sync_profile_to_supabase
        sync_profile_to_supabase({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "display_name": user.display_name,
            "role": user.role,
            "preferred_language": user.preferred_language,
            "state": user.state,
            "district": user.district,
            "is_active": user.is_active
        })
    except Exception as e:
        logger.warning(f"Failed to sync admin-created user to Supabase: {e}")

    return user


@router.patch("/users/{user_id}/status", response_model=UserResponse, dependencies=[admin_guard], summary="Activate or deactivate user account")
def update_user_status(user_id: str, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    """Toggles user active state."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    primary_admin_email = "charankumarreddybantrothula@gmail.com"
    if user.email.lower() == primary_admin_email and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The primary administrator account cannot be deactivated."
        )

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    try:
        from app.core.supabase_client import sync_profile_to_supabase
        sync_profile_to_supabase({
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active
        })
    except Exception:
        pass

    return user


@router.patch("/users/{user_id}/role", response_model=UserResponse, dependencies=[admin_guard], summary="Update user role")
def update_user_role(user_id: str, payload: UserRoleUpdate, db: Session = Depends(get_db)):
    """Updates user role (farmer, expert, admin)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    primary_admin_email = "charankumarreddybantrothula@gmail.com"
    valid_roles = ["farmer", "expert", "admin"]
    role = payload.role.lower().strip()
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role}'. Allowed roles: {valid_roles}"
        )

    if role == "admin" and user.email.lower() != primary_admin_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Administrator access is strictly restricted to {primary_admin_email}."
        )

    if user.email.lower() == primary_admin_email and role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The primary administrator role cannot be altered."
        )

    user.role = role
    db.commit()
    db.refresh(user)

    try:
        from app.core.supabase_client import sync_profile_to_supabase
        sync_profile_to_supabase({
            "id": user.id,
            "email": user.email,
            "role": user.role
        })
    except Exception:
        pass

    return user


@router.put("/users/{user_id}", response_model=UserResponse, dependencies=[admin_guard], summary="Edit all user details")
def edit_user_by_admin(user_id: str, payload: UserAdminEditRequest, db: Session = Depends(get_db)):
    """Admin edits user details: name, email, role, location, status, or resets password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    primary_admin_email = "charankumarreddybantrothula@gmail.com"

    # If updating email, check for duplicate
    if payload.email and payload.email.strip().lower() != user.email.lower():
        clean_new_email = payload.email.strip().lower()
        if user.email.lower() == primary_admin_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The primary administrator email cannot be modified."
            )
        existing = db.query(User).filter(User.email.ilike(clean_new_email), User.id != user_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{clean_new_email}' already exists."
            )
        user.email = clean_new_email

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
        user.display_name = payload.full_name.strip()

    if payload.role is not None:
        role = payload.role.strip().lower()
        valid_roles = ["farmer", "expert", "admin"]
        if role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role '{role}'. Allowed: {valid_roles}")
        if role == "admin" and user.email.lower() != primary_admin_email:
            raise HTTPException(status_code=400, detail=f"Administrator access is strictly restricted to {primary_admin_email}.")
        if user.email.lower() == primary_admin_email and role != "admin":
            raise HTTPException(status_code=400, detail="Primary administrator role cannot be altered.")
        user.role = role

    if payload.is_active is not None:
        if user.email.lower() == primary_admin_email and not payload.is_active:
            raise HTTPException(status_code=400, detail="Primary administrator account cannot be deactivated.")
        user.is_active = payload.is_active

    if payload.state is not None:
        user.state = payload.state.strip() or None
    if payload.district is not None:
        user.district = payload.district.strip() or None
    if payload.village_or_city is not None:
        user.village_or_city = payload.village_or_city.strip() or None
        user.village = payload.village_or_city.strip() or None
    if payload.preferred_language is not None:
        user.preferred_language = payload.preferred_language.strip() or "en"

    if payload.password and len(payload.password.strip()) >= 6:
        user.hashed_password = hash_password(payload.password.strip())

    db.commit()
    db.refresh(user)

    # Sync to Supabase profiles
    try:
        from app.core.supabase_client import sync_profile_to_supabase
        sync_profile_to_supabase({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "display_name": user.display_name,
            "role": user.role,
            "preferred_language": user.preferred_language,
            "state": user.state,
            "district": user.district,
            "is_active": user.is_active
        })
    except Exception as e:
        logger.warning(f"Supabase sync warning on admin edit: {e}")

    return user


@router.delete("/users/{user_id}", dependencies=[admin_guard], summary="Delete a user from the database")
def delete_user_by_admin(user_id: str, db: Session = Depends(get_db)):
    """Admin permanently deletes a user and cleans up their data from the database."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    primary_admin_email = "charankumarreddybantrothula@gmail.com"
    if user.email.lower() == primary_admin_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The primary administrator account cannot be deleted."
        )

    # Clean up associated reports, advisories, crop analyses
    db.query(Report).filter(Report.farmer_id == user_id).delete(synchronize_session=False)
    db.query(CropImageAnalysis).filter(CropImageAnalysis.farmer_id == user_id).delete(synchronize_session=False)
    db.query(Advisory).filter(Advisory.farmer_id == user_id).delete(synchronize_session=False)

    deleted_email = user.email
    db.delete(user)
    db.commit()

    return {"message": f"User '{deleted_email}' and all associated records deleted successfully."}


