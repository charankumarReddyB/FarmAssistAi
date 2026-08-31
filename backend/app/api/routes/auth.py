import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication & Role Session"])


@router.post("/register", response_model=TokenResponse, summary="Register a new user (Default Role: Farmer)")
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user (always defaults to farmer role for security) and returns access token + profile."""
    # Check if email exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        display_name=payload.full_name,
        avatar_url=None,
        role="farmer",  # SECURITY RULE: ALWAYS DEFAULT TO FARMER
        auth_provider="email",
        onboarding_completed=False,
        preferred_language=payload.preferred_language or "en",
        state=payload.state or None,
        district=payload.district or None,
        city_town=payload.city_town or None,
        village_or_city=payload.village_or_city or payload.village or None,
        village=payload.village or None,
        latitude=payload.latitude if payload.latitude is not None else None,
        longitude=payload.longitude if payload.longitude is not None else None,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Sync user profile to Supabase Cloud PostgreSQL
    try:
        from app.core.supabase_client import sync_profile_to_supabase
        sync_profile_to_supabase({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "preferred_language": user.preferred_language,
            "state": user.state,
            "district": user.district,
            "village_or_city": user.village_or_city,
            "is_active": user.is_active
        })
    except Exception as e:
        logger.warning(f"Supabase sync notice on registration: {e}")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )


@router.post("/login", response_model=TokenResponse, summary="User Sign In with Email & Password")
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates user email and password using database profile."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an Administrator."
        )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns authenticated user profile information with location object."""
    loc_dict = {
        "state": current_user.state,
        "district": current_user.district,
        "village_or_city": current_user.village_or_city or current_user.village,
        "latitude": current_user.latitude,
        "longitude": current_user.longitude
    }
    user_resp = UserResponse.model_validate(current_user)
    user_resp.location = loc_dict
    return user_resp
