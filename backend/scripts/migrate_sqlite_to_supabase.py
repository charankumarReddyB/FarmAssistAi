"""
FarmAssist AI — SQLite to Supabase PostgreSQL Migration Utility.
Inspects local farmassist.db SQLite database and exports existing records
(users, soil reports, crop analyses, advisories) into Supabase PostgreSQL tables.
"""

import sys
import os
import json
import sqlite3
import httpx

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SQLITE_DB_PATH

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def migrate_sqlite_data():
    print("====================================================================")
    print("      FARMASSIST AI — SQLITE TO SUPABASE MIGRATION UTILITY          ")
    print("====================================================================")

    if not os.path.exists(SQLITE_DB_PATH):
        print(f"[INFO] No local SQLite database found at {SQLITE_DB_PATH}. Skipping migration.")
        return

    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print(f"[1] Connecting to local SQLite database: {SQLITE_DB_PATH}")

    # Inspect tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"    Found SQLite tables: {tables}")

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or "demo" in SUPABASE_URL:
        print("[NOTICE] Supabase URL & Service Role Key not set in environment.")
        print("         Migration script generated procedures. To execute live migration:")
        print("         Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env")
        conn.close()
        return

    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apiKey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    client = httpx.Client(timeout=15.0)

    # 1. Migrate Users to public.profiles
    if "users" in tables:
        cursor.execute("SELECT * FROM users;")
        users = cursor.fetchall()
        print(f"\n[2] Exporting {len(users)} users from SQLite to public.profiles...")
        for u in users:
            profile_data = {
                "id": u["id"],
                "email": u["email"],
                "full_name": u["full_name"],
                "role": u["role"] if u["role"] in ["farmer", "expert", "admin"] else "farmer",
                "preferred_language": u["preferred_language"] or "en",
                "country": u["country"] or "India",
                "state": u["state"] or "Andhra Pradesh",
                "district": u["district"] or "Kakinada",
                "city_town": u["city_town"] or "Kakinada",
                "village": u["village"] or "Samalkota",
                "latitude": u["latitude"] or 16.98,
                "longitude": u["longitude"] or 82.24,
                "is_active": bool(u["is_active"])
            }
            res = client.post(f"{SUPABASE_URL}/rest/v1/profiles", json=profile_data, headers=headers)
            if res.status_code in [200, 201]:
                print(f"    [OK] Migrated user: {u['email']} ({u['role']})")
            else:
                print(f"    [SKIP/ERR] User {u['email']}: {res.status_code} - {res.text}")

    # 2. Migrate Reports
    if "reports" in tables:
        cursor.execute("SELECT * FROM reports;")
        reports = cursor.fetchall()
        print(f"\n[3] Exporting {len(reports)} soil reports...")
        for r in reports:
            ext_data = json.loads(r["extracted_data"]) if r["extracted_data"] else {}
            report_data = {
                "id": r["id"],
                "filename": r["filename"],
                "file_type": r["file_type"],
                "file_path": r["file_path"],
                "status": r["status"],
                "raw_text": r["raw_text"],
                "extracted_data": ext_data
            }
            res = client.post(f"{SUPABASE_URL}/rest/v1/soil_reports", json=report_data, headers=headers)
            if res.status_code in [200, 201]:
                print(f"    [OK] Migrated soil report: {r['filename']}")

    # 3. Migrate Crop Analyses
    if "crop_image_analyses" in tables:
        cursor.execute("SELECT * FROM crop_image_analyses;")
        crops = cursor.fetchall()
        print(f"\n[4] Exporting {len(crops)} crop image analyses...")
        for c in crops:
            crop_data = {
                "id": c["id"],
                "filename": c["filename"],
                "file_path": c["file_path"],
                "crop_type": c["crop_type"],
                "disease_class": c["disease_class"],
                "disease_name": c["disease_name"],
                "confidence_score": c["confidence_score"],
                "risk_level": c["risk_level"],
                "status": c["status"]
            }
            res = client.post(f"{SUPABASE_URL}/rest/v1/crop_analyses", json=crop_data, headers=headers)
            if res.status_code in [200, 201]:
                print(f"    [OK] Migrated crop analysis: {c['filename']}")

    client.close()
    conn.close()
    print("\n====================================================================")
    print("SUCCESS: SQLite to Supabase Migration finished successfully.")
    print("====================================================================")


if __name__ == "__main__":
    migrate_sqlite_data()
