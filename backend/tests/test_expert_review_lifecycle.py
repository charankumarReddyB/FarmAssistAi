import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.advisory import Advisory
from app.models.report import Report
from app.core.security import create_access_token, hash_password


class TestExpertReviewLifecycle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Farmer setup
        cls.farmer_email = "e2e_farmer@farmassist.ai"
        farmer = cls.db.query(User).filter(User.email == cls.farmer_email).first()
        if not farmer:
            farmer = User(
                email=cls.farmer_email,
                hashed_password=hash_password("Farmer@123"),
                full_name="Ramesh Reddy",
                role="farmer",
                district="Kakinada",
                state="Andhra Pradesh",
                is_active=True
            )
            cls.db.add(farmer)
            cls.db.commit()
            cls.db.refresh(farmer)
        cls.farmer_id = farmer.id
        cls.farmer_token = create_access_token({"sub": farmer.id, "email": farmer.email, "role": "farmer"})

        # Expert setup
        cls.expert_email = "e2e_expert@farmassist.ai"
        expert = cls.db.query(User).filter(User.email == cls.expert_email).first()
        if not expert:
            expert = User(
                email=cls.expert_email,
                hashed_password=hash_password("Expert@123"),
                full_name="Dr. Swaminathan",
                role="expert",
                is_active=True
            )
            cls.db.add(expert)
            cls.db.commit()
            cls.db.refresh(expert)
        cls.expert_id = expert.id
        cls.expert_token = create_access_token({"sub": expert.id, "email": expert.email, "role": "expert"})

    @classmethod
    def tearDownClass(cls):
        cls.db.query(Advisory).filter(Advisory.farmer_id == cls.farmer_id).delete()
        cls.db.query(Report).filter(Report.farmer_id == cls.farmer_id).delete()
        cls.db.query(User).filter(User.id.in_([cls.farmer_id, cls.expert_id])).delete()
        cls.db.commit()
        cls.db.close()

    def test_full_advisory_expert_review_lifecycle(self):
        # 1. Create a simulated report and AI advisory with status 'pending_review'
        report = Report(
            farmer_id=self.farmer_id,
            filename="soil_test_sample.pdf",
            file_type="pdf",
            file_path="/simulated/soil_test_sample.pdf",
            status="processed",
            raw_text="Soil pH: 6.2, Nitrogen: 95 kg/ha, Phosphorus: 18 kg/ha, Potassium: 130 kg/ha",
            extracted_data={"ph": 6.2, "nitrogen": 95, "phosphorus": 18, "potassium": 130}
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        ai_advisory = Advisory(
            report_id=report.id,
            farmer_id=self.farmer_id,
            farmer_name="Ramesh Reddy",
            farmer_location="Kakinada, Andhra Pradesh",
            source_type="soil_analysis",
            report_summary="Soil test indicates mildly acidic soil with moderate Nitrogen and Potassium.",
            original_ai_advisory="Apply 50 kg/acre Urea and 25 kg/acre DAP.",
            final_advisory="Apply 50 kg/acre Urea and 25 kg/acre DAP.",
            status="pending_review",
            extracted_data=report.extracted_data
        )
        self.db.add(ai_advisory)
        self.db.commit()
        self.db.refresh(ai_advisory)

        adv_id = ai_advisory.id

        # 2. Expert lists pending advisories
        resp = self.client.get(
            "/api/expert/advisories?status=pending_review",
            headers={"Authorization": f"Bearer {self.expert_token}"}
        )
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        matching = [x for x in items if x["advisory_id"] == adv_id]
        self.assertTrue(len(matching) >= 1)
        self.assertEqual(matching[0]["status"], "pending_review")

        # 3. Expert modifies advisory with specialized agricultural recommendations
        mod_payload = {
            "expert_name": "Dr. Swaminathan",
            "expert_id": self.expert_id,
            "modified_advisory": "Approved with modification: Apply 60 kg/acre Urea in 2 split doses, and add 200 kg/acre Farm Yard Manure (FYM) to improve organic matter.",
            "expert_notes": "High humidity observed in Kakinada; split nitrogen application prevents leaching."
        }
        mod_resp = self.client.post(
            f"/api/expert/advisories/{adv_id}/modify",
            json=mod_payload,
            headers={"Authorization": f"Bearer {self.expert_token}"}
        )
        self.assertEqual(mod_resp.status_code, 200)
        mod_data = mod_resp.json()
        self.assertEqual(mod_data["status"], "modified")
        self.assertEqual(mod_data["reviewed_by"], "Dr. Swaminathan")
        self.assertIn("Farm Yard Manure", mod_data["final_advisory"])
        self.assertIn("split nitrogen", mod_data["expert_notes"])

        # 4. Farmer retrieves their advisory and verifies expert's review
        farmer_get_resp = self.client.get(
            f"/api/advisory/{adv_id}",
            headers={"Authorization": f"Bearer {self.farmer_token}"}
        )
        self.assertEqual(farmer_get_resp.status_code, 200)
        f_adv = farmer_get_resp.json()
        self.assertEqual(f_adv["status"], "modified")
        self.assertEqual(f_adv["reviewed_by"], "Dr. Swaminathan")
        self.assertIn("Farm Yard Manure", f_adv["final_advisory"])
        self.assertEqual(f_adv["expert_notes"], "High humidity observed in Kakinada; split nitrogen application prevents leaching.")


if __name__ == "__main__":
    unittest.main()
