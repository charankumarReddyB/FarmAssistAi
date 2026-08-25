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


@router.post("/register", response_model=TokenResponse, summary="Register a new user (Farmer, Expert, Admin)")
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user and returns access token + profile."""
    # Check if role is valid
    valid_roles = ["farmer", "expert", "admin"]
    role = payload.role.lower().strip()
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role}'. Allowed roles: {valid_roles}"
        )

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
        role=role,
        preferred_language=payload.preferred_language or "en",
        state=payload.state or "Andhra Pradesh",
        district=payload.district or "Kakinada",
        city_town=payload.city_town or "Kakinada",
        village=payload.village or "Samalkota",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )


@router.post("/login", response_model=TokenResponse, summary="User Sign In with Email & Password")
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates user email and password. Optional role validation for portal matching."""
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

    # If payload specified role, check matching
    if payload.role and payload.role.lower().strip() != user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role mismatch. Account is configured as '{user.role}', but login was attempted for '{payload.role}'."
        )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user profile")
def get_me(current_user: User = Depends(get_current_user)):
    """Returns authenticated user profile information."""
    return current_user
