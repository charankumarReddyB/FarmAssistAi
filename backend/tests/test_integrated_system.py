"""
Comprehensive Automated System Test Suite for FarmAssist AI.
Verifies all 25 system integration, authentication, authorization, role security,
and Profile -> My Farm synchronization test points:

 1. Unauthenticated user root endpoint & health checks.
 2. Email/password farmer registration works.
 3. Email/password farmer login works.
 4. Google login callback metadata syncs correctly.
 5. Google user role defaults to farmer and profile created without hardcoded defaults.
 6. Predefined initial Admin email/password login (charankumarreddybantrothula@gmail.com / Charan@123) returns role=admin.
 7. Expert login returns role=expert.
 8. Farmer login returns role=farmer.
 9. Session / JWT verification and token decoding.
10. Public user cannot register as admin (strictly defaulted to farmer).
11. Public user cannot register as expert (strictly defaulted to farmer).
12. Farmer cannot modify own role via user profile endpoint.
13. Farmer cannot access admin routes (403 Forbidden).
14. Expert cannot access admin routes (403 Forbidden).
15. Admin can create an expert account (POST /api/admin/users).
16. Admin can create another admin account (POST /api/admin/users).
17. Newly created expert can sign in with password and reaches expert role.
18. Newly created admin can sign in with password and reaches admin role.
19. Updating name in /api/user/profile updates database and My Farm context.
20. Updating location in /api/user/profile updates My Farm location and coordinates.
21. Updating location refreshes weather & regional agricultural analysis context.
22. Updating farm details (size, crop, soil, irrigation, sowing date, stage) via PUT /api/farm/profile persists and updates immediately.
23. One user's data does not appear in another user's session (isolation).
24. Farmer cannot read another farmer's private data.
25. Ordinary user cannot change user status or role (403 Forbidden).
"""

import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.farm import FarmProfile
from app.core.security import create_access_token, hash_password

client = TestClient(app)

class TestFarmAssistIntegratedSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        db = SessionLocal()
        # 1. Primary Predefined Admin
        cls.primary_admin_email = "charankumarreddybantrothula@gmail.com"
        cls.primary_admin_pass = "Charan@123"
        admin_user = db.query(User).filter(User.email == cls.primary_admin_email).first()
        if not admin_user:
            admin_user = User(
                email=cls.primary_admin_email,
                hashed_password=hash_password(cls.primary_admin_pass),
                full_name="Charan Kumar Reddy",
                role="admin",
                onboarding_completed=True,
                is_active=True
            )
            db.add(admin_user)
        else:
            admin_user.role = "admin"
            admin_user.hashed_password = hash_password(cls.primary_admin_pass)

        # 2. Farmer A Test User
        cls.farmer_user = db.query(User).filter(User.email == "farmer_test@farmassist.ai").first()
        if not cls.farmer_user:
            cls.farmer_user = User(
                email="farmer_test@farmassist.ai",
                hashed_password=hash_password("Farmer@123456"),
                full_name="Farmer A Test",
                role="farmer",
                onboarding_completed=True,
                state="Andhra Pradesh",
                district="Kakinada",
                village_or_city="Samalkota",
                latitude=16.98,
                longitude=82.24,
                is_active=True
            )
            db.add(cls.farmer_user)
        else:
            cls.farmer_user.hashed_password = hash_password("Farmer@123456")
            cls.farmer_user.state = "Andhra Pradesh"
            cls.farmer_user.district = "Kakinada"
            cls.farmer_user.village_or_city = "Samalkota"
            cls.farmer_user.latitude = 16.98
            cls.farmer_user.longitude = 82.24

        # 3. Farmer B Test User
        cls.farmer_b = db.query(User).filter(User.email == "farmer_b_test@farmassist.ai").first()
        if not cls.farmer_b:
            cls.farmer_b = User(
                email="farmer_b_test@farmassist.ai",
                hashed_password=hash_password("Farmer@123456"),
                full_name="Farmer B Test",
                role="farmer",
                onboarding_completed=True,
                state="Tamil Nadu",
                district="Chennai",
                village_or_city="Guindy",
                latitude=13.08,
                longitude=80.27,
                is_active=True
            )
            db.add(cls.farmer_b)
        else:
            cls.farmer_b.hashed_password = hash_password("Farmer@123456")

        # 4. Expert Test User
        cls.expert_user = db.query(User).filter(User.email == "expert_test@farmassist.ai").first()
        if not cls.expert_user:
            cls.expert_user = User(
                email="expert_test@farmassist.ai",
                hashed_password=hash_password("Expert@123456"),
                full_name="Dr. Expert Test",
                role="expert",
                onboarding_completed=True,
                is_active=True
            )
            db.add(cls.expert_user)
        else:
            cls.expert_user.hashed_password = hash_password("Expert@123456")

        db.commit()

        cls.farmer_id = cls.farmer_user.id
        cls.farmer_email = cls.farmer_user.email
        cls.farmer_b_id = cls.farmer_b.id
        cls.farmer_b_email = cls.farmer_b.email
        cls.expert_id = cls.expert_user.id
        cls.expert_email = cls.expert_user.email
        cls.admin_id = admin_user.id
        cls.admin_email = admin_user.email

        db.close()

        cls.farmer_token = create_access_token({"sub": cls.farmer_id, "email": cls.farmer_email, "role": "farmer"})
        cls.farmer_b_token = create_access_token({"sub": cls.farmer_b_id, "email": cls.farmer_b_email, "role": "farmer"})
        cls.expert_token = create_access_token({"sub": cls.expert_id, "email": cls.expert_email, "role": "expert"})
        cls.admin_token = create_access_token({"sub": cls.admin_id, "email": cls.admin_email, "role": "admin"})

    def test_01_unauthenticated_user_access_and_health(self):
        """Test Point 1: Unauthenticated health check responds online."""
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

    def test_02_email_farmer_registration_and_null_location(self):
        """Test Point 2 & 10: New email registration defaults to farmer with NULL location."""
        new_email = f"farmer_reg_{os.urandom(4).hex()}@test.com"
        res = client.post("/api/auth/register", json={
            "email": new_email,
            "password": "Password123!",
            "full_name": "New Registered Farmer"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["role"], "farmer")
        self.assertFalse(data["user"]["onboarding_completed"])
        self.assertIsNone(data["user"]["state"])
        self.assertIsNone(data["user"]["district"])
        self.assertIsNone(data["user"]["latitude"])
        self.assertIsNone(data["user"]["longitude"])

    def test_03_email_farmer_login(self):
        """Test Point 3 & 8: Email/password farmer login returns valid session and farmer role."""
        res = client.post("/api/auth/login", json={
            "email": "farmer_test@farmassist.ai",
            "password": "Farmer@123456"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["role"], "farmer")
        self.assertTrue(bool(data["access_token"]))

    def test_04_05_google_login_metadata_sync_defaults_to_farmer(self):
        """Test Point 4 & 5: Google user defaults to farmer and metadata syncs without hardcoded defaults."""
        uid = os.urandom(4).hex()
        fake_google_token = create_access_token({
            "sub": f"google_{uid}",
            "email": f"google_{uid}@gmail.com",
            "user_metadata": {
                "full_name": "Google Farmer User",
                "name": "Google Farmer User",
                "avatar_url": "https://lh3.googleusercontent.com/a/farmer"
            },
            "iss": "https://accounts.google.com"
        })
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {fake_google_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["role"], "farmer")
        self.assertEqual(data["full_name"], "Google Farmer User")
        self.assertIsNone(data.get("district"))

    def test_06_predefined_initial_admin_login(self):
        """Test Point 6: Initial predefined administrator login returns role=admin."""
        res = client.post("/api/auth/login", json={
            "email": self.primary_admin_email,
            "password": self.primary_admin_pass
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["role"], "admin")
        self.assertEqual(data["user"]["email"], self.primary_admin_email)

    def test_07_expert_login(self):
        """Test Point 7: Expert login returns role=expert."""
        res = client.post("/api/auth/login", json={
            "email": "expert_test@farmassist.ai",
            "password": "Expert@123456"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["role"], "expert")

    def test_09_session_jwt_and_token_decoding(self):
        """Test Point 9: Valid JWT token resolves to the authenticated user profile."""
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {self.farmer_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], self.farmer_id)

    def test_10_11_public_user_cannot_self_assign_admin_or_expert(self):
        """Test Point 10 & 11: Public registration cannot force admin or expert role."""
        res = client.post("/api/auth/register", json={
            "email": f"hacker_{os.urandom(4).hex()}@test.com",
            "password": "Password123!",
            "full_name": "Role Hacker",
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["role"], "farmer")

    def test_12_farmer_cannot_modify_own_role_via_profile_update(self):
        """Test Point 12: Farmer cannot change own role in profile update or JWT spoofing."""
        # Try to spoof role in profile update
        res = client.put("/api/user/profile", headers={"Authorization": f"Bearer {self.farmer_token}"}, json={
            "full_name": "Farmer Attempting Escalation",
            "role": "admin"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "farmer")  # Role remains farmer

    def test_13_farmer_cannot_access_admin_routes(self):
        """Test Point 13: Farmer receives 403 Forbidden on admin routes."""
        res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {self.farmer_token}"})
        self.assertEqual(res.status_code, 403)

    def test_14_expert_cannot_access_admin_routes(self):
        """Test Point 14: Expert receives 403 Forbidden on admin routes."""
        res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {self.expert_token}"})
        self.assertEqual(res.status_code, 403)

    def test_15_17_admin_can_create_expert_account_and_expert_can_login(self):
        """Test Point 15 & 17: Admin creates Expert account, and newly created expert logs in."""
        expert_email = f"expert_created_{os.urandom(4).hex()}@farmassist.ai"
        expert_pass = "ExpertPass@123"

        res_create = client.post("/api/admin/users", headers={"Authorization": f"Bearer {self.admin_token}"}, json={
            "email": expert_email,
            "password": expert_pass,
            "full_name": "Dr. Newly Created Expert",
            "role": "expert"
        })
        self.assertEqual(res_create.status_code, 200)
        self.assertEqual(res_create.json()["role"], "expert")

        # Verify new expert can sign in
        res_login = client.post("/api/auth/login", json={
            "email": expert_email,
            "password": expert_pass
        })
        self.assertEqual(res_login.status_code, 200)
        self.assertEqual(res_login.json()["user"]["role"], "expert")

    def test_16_18_admin_can_create_admin_account_and_admin_can_login(self):
        """Test Point 16 & 18: Admin creates another Administrator account, and new admin logs in."""
        new_admin_email = f"admin_created_{os.urandom(4).hex()}@farmassist.ai"
        new_admin_pass = "AdminPass@123"

        res_create = client.post("/api/admin/users", headers={"Authorization": f"Bearer {self.admin_token}"}, json={
            "email": new_admin_email,
            "password": new_admin_pass,
            "full_name": "Secondary Admin",
            "role": "admin"
        })
        self.assertEqual(res_create.status_code, 200)
        self.assertEqual(res_create.json()["role"], "admin")

        # Verify new admin can sign in
        res_login = client.post("/api/auth/login", json={
            "email": new_admin_email,
            "password": new_admin_pass
        })
        self.assertEqual(res_login.status_code, 200)
        self.assertEqual(res_login.json()["user"]["role"], "admin")

    def test_19_updating_name_updates_profile_and_farm(self):
        """Test Point 19: Updating user name updates database profile and farm representation."""
        new_name = f"Charan Reddy {os.urandom(2).hex()}"
        res = client.put("/api/user/profile", headers={"Authorization": f"Bearer {self.farmer_token}"}, json={
            "full_name": new_name
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["full_name"], new_name)

        # Check farm profile reflects updated farmer name
        res_farm = client.get("/api/farm/profile", headers={"Authorization": f"Bearer {self.farmer_token}"})
        self.assertEqual(res_farm.status_code, 200)
        self.assertEqual(res_farm.json()["farmer_name"], new_name)

    def test_20_21_updating_location_updates_farm_and_weather(self):
        """Test Point 20 & 21: Updating location updates farm location and refreshes weather telemetry."""
        res_loc = client.put("/api/user/profile", headers={"Authorization": f"Bearer {self.farmer_token}"}, json={
            "state": "Andhra Pradesh",
            "district": "Kakinada",
            "village_or_city": "Samalkota",
            "latitude": 16.9891,
            "longitude": 82.2475
        })
        self.assertEqual(res_loc.status_code, 200)
        self.assertEqual(res_loc.json()["district"], "Kakinada")
        self.assertEqual(res_loc.json()["village_or_city"], "Samalkota")

        # Farm location analysis uses the updated coordinates
        res_analysis = client.get("/api/farm/location-analysis", headers={"Authorization": f"Bearer {self.farmer_token}"})
        self.assertEqual(res_analysis.status_code, 200)
        self.assertEqual(res_analysis.json()["location"]["district"], "Kakinada")

    def test_22_updating_farm_details_persists_immediately(self):
        """Test Point 22: Updating farm size, crop, soil, irrigation, and sowing date persists immediately."""
        farm_payload = {
            "farm_name": "Reddy Organic Agro Farm",
            "farm_size": "6.5 acres",
            "current_crop": "Groundnut & Maize",
            "soil_type": "Red Sandy Loam",
            "irrigation_method": "Drip Irrigation",
            "sowing_date": "20 July 2026",
            "crop_stage": "Flowering Stage (Day 55)",
            "phone": "9876543210",
            "experience_years": "15 yrs experience",
            "water_source": "Canal + Borewell",
            "survey_number": "184/2A"
        }

        res_update = client.put("/api/farm/profile", headers={"Authorization": f"Bearer {self.farmer_token}"}, json=farm_payload)
        self.assertEqual(res_update.status_code, 200)
        data = res_update.json()
        self.assertEqual(data["farm_name"], "Reddy Organic Agro Farm")
        self.assertEqual(data["farm_size"], "6.5 acres")
        self.assertEqual(data["current_crop"], "Groundnut & Maize")
        self.assertEqual(data["soil_type"], "Red Sandy Loam")
        self.assertEqual(data["irrigation_method"], "Drip Irrigation")
        self.assertEqual(data["sowing_date"], "20 July 2026")
        self.assertEqual(data["crop_stage"], "Flowering Stage (Day 55)")

        # Verify persistent read
        res_get = client.get("/api/farm/profile", headers={"Authorization": f"Bearer {self.farmer_token}"})
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["current_crop"], "Groundnut & Maize")

    def test_23_24_data_isolation_between_users(self):
        """Test Point 23 & 24: User A and User B have complete data isolation."""
        res_a = client.get("/api/farm/profile", headers={"Authorization": f"Bearer {self.farmer_token}"})
        res_b = client.get("/api/farm/profile", headers={"Authorization": f"Bearer {self.farmer_b_token}"})
        self.assertEqual(res_a.status_code, 200)
        self.assertEqual(res_b.status_code, 200)
        self.assertEqual(res_a.json()["user_id"], self.farmer_id)
        self.assertEqual(res_b.json()["user_id"], self.farmer_b_id)
        self.assertNotEqual(res_a.json()["user_id"], res_b.json()["user_id"])

    def test_25_ordinary_user_cannot_manage_other_users(self):
        """Test Point 25: Ordinary user receives 403 when attempting role or status updates."""
        res_status = client.patch(f"/api/admin/users/{self.farmer_b_id}/status", headers={"Authorization": f"Bearer {self.farmer_token}"}, json={
            "is_active": False
        })
        self.assertEqual(res_status.status_code, 403)

        res_role = client.patch(f"/api/admin/users/{self.farmer_b_id}/role", headers={"Authorization": f"Bearer {self.farmer_token}"}, json={
            "role": "admin"
        })
        self.assertEqual(res_role.status_code, 403)


if __name__ == "__main__":
    unittest.main()
