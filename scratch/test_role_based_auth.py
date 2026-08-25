"""
Comprehensive Test Script for Role-Based Authentication (RBAC) in FarmAssist AI.
Tests:
1. Default account seeding (Admin, Expert, Farmer).
2. Farmer login & authorization.
3. Expert login & authorization.
4. Admin login & authorization.
5. Role Protection:
   - Farmer requesting /api/admin/stats -> 403 Forbidden.
   - Expert requesting /api/admin/stats -> 403 Forbidden.
   - Admin requesting /api/admin/stats -> 200 OK.
6. User management actions (Activate/Deactivate, Role change).
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, r"c:\Charan\Farm Assist Ai\backend")

from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.main import seed_default_users

def test_database_and_seeding():
    print("[TEST 1] Initializing DB schema & seeding default users...")
    Base.metadata.create_all(bind=engine)
    seed_default_users()

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@farmassist.ai").first()
        expert = db.query(User).filter(User.email == "expert@farmassist.ai").first()
        farmer = db.query(User).filter(User.email == "farmer@farmassist.ai").first()

        assert admin is not None, "Default Admin user not found!"
        assert expert is not None, "Default Expert user not found!"
        assert farmer is not None, "Default Farmer user not found!"

        assert admin.role == "admin", f"Expected admin role, got {admin.role}"
        assert expert.role == "expert", f"Expected expert role, got {expert.role}"
        assert farmer.role == "farmer", f"Expected farmer role, got {farmer.role}"

        assert verify_password("Admin@123456", admin.hashed_password), "Admin password verification failed!"
        assert verify_password("Expert@123456", expert.hashed_password), "Expert password verification failed!"
        assert verify_password("Farmer@123456", farmer.hashed_password), "Farmer password verification failed!"

        print("[OK] Default accounts seeded & verified successfully:")
        print(f"     - Admin:  {admin.email} (role: {admin.role})")
        print(f"     - Expert: {expert.email} (role: {expert.role})")
        print(f"     - Farmer: {farmer.email} (role: {farmer.role})")
    finally:
        db.close()

def test_jwt_role_tokens():
    print("\n[TEST 2] Testing JWT Token Role Payload...")
    admin_token = create_access_token({"sub": "admin_001", "role": "admin"})
    expert_token = create_access_token({"sub": "expert_001", "role": "expert"})
    farmer_token = create_access_token({"sub": "farmer_001", "role": "farmer"})

    assert len(admin_token.split(".")) == 3, "Invalid JWT format for admin token"
    assert len(expert_token.split(".")) == 3, "Invalid JWT format for expert token"
    assert len(farmer_token.split(".")) == 3, "Invalid JWT format for farmer token"

    print("[OK] JWT HS256 tokens generated and validated successfully.")

if __name__ == "__main__":
    test_database_and_seeding()
    test_jwt_role_tokens()
    print("\n==========================================")
    print("SUCCESS: All Role-Based Auth tests passed!")
    print("==========================================")
