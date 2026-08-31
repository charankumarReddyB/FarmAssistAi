import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.supabase_client import sync_profile_to_supabase

def sync_all():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Syncing {len(users)} users from local database to Supabase Cloud...")
        success_count = 0
        for u in users:
            ok = sync_profile_to_supabase({
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name or u.display_name or "Farmer User",
                "role": u.role or "farmer",
                "preferred_language": u.preferred_language or "en",
                "onboarding_completed": u.onboarding_completed,
                "state": u.state,
                "district": u.district,
                "village_or_city": u.village_or_city or u.village,
                "is_active": u.is_active
            })
            if ok:
                success_count += 1
                print(f"  ✓ Synced {u.email} ({u.role})")
            else:
                print(f"  × Notice: {u.email} sync result handled")
        print(f"Finished. Successfully synced {success_count}/{len(users)} profiles to Supabase Cloud.")
    finally:
        db.close()

if __name__ == "__main__":
    sync_all()
