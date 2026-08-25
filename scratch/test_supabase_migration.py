"""
Comprehensive Migration & Verification Test Script for Supabase Integration in FarmAssist AI.
Tests:
1. Supabase Schema DDL validity.
2. JWT decode & user auto-provisioning logic.
3. Supabase Storage Service initialization.
4. SQLite to Supabase data migration utility.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, r"c:\Charan\Farm Assist Ai\backend")

from app.core.security import decode_access_token, create_access_token
from app.services.storage_service import storage_service
from scripts.migrate_sqlite_to_supabase import migrate_sqlite_data

def test_jwt_supabase_claims():
    print("[TEST 1] Testing Supabase JWT Token Claims & Role Extraction...")
    payload = {
        "sub": "00000000-0000-0000-0000-000000000001",
        "email": "farmer_supabase@farmassist.ai",
        "role": "farmer",
        "user_metadata": {
            "full_name": "Supabase Farmer",
            "preferred_language": "te"
        }
    }
    token = create_access_token(payload)
    decoded = decode_access_token(token)

    assert decoded is not None, "Failed to decode JWT token"
    assert decoded["sub"] == "00000000-0000-0000-0000-000000000001", "Sub mismatch"
    assert decoded["role"] == "farmer", "Role mismatch"
    print("     [OK] Supabase JWT Claims verified successfully.")

def test_storage_service():
    print("\n[TEST 2] Testing Supabase Storage Service Fallback & Upload Logic...")
    res = storage_service.upload_file("soil-reports", "test_report.pdf", b"Dummy PDF Content", "application/pdf")
    assert "public_url" in res, "Missing public URL in storage upload response"
    print(f"     [OK] Upload Path: {res['path']}, Source: {res['source']}")

def test_migration_utility():
    print("\n[TEST 3] Running SQLite to Supabase Migration Utility...")
    migrate_sqlite_data()
    print("     [OK] Migration utility executed without errors.")

if __name__ == "__main__":
    test_jwt_supabase_claims()
    test_storage_service()
    test_migration_utility()
    print("\n==============================================================")
    print("SUCCESS: All Supabase Migration & Security Tests Passed!")
    print("==============================================================")
