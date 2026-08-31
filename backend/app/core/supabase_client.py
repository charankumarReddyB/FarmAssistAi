import os
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


def upload_file_to_supabase_storage(bucket_name: str, file_path: str, destination_path: str) -> Optional[str]:
    """
    Uploads a local file to Supabase Storage bucket.
    Returns public/storage URL if Supabase client is configured, otherwise fallback to local path.
    """
    supabase_url = settings.SUPABASE_URL
    service_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if not supabase_url or not service_key:
        logger.info(f"Supabase credentials not configured. Using local file storage path: {file_path}")
        return file_path

    try:
        import httpx
        with open(file_path, "rb") as f:
            file_data = f.read()

        endpoint = f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket_name}/{destination_path}"
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apiKey": service_key,
            "x-upsert": "true"
        }

        response = httpx.post(endpoint, headers=headers, content=file_data, timeout=15.0)
        if response.status_code in (200, 201):
            public_url = f"{supabase_url.rstrip('/')}/storage/v1/object/public/{bucket_name}/{destination_path}"
            logger.info(f"Uploaded to Supabase Storage: {public_url}")
            return public_url
        else:
            logger.warning(f"Supabase storage upload returned status {response.status_code}: {response.text}")
            return file_path
    except Exception as e:
        logger.error(f"Failed to upload file to Supabase storage: {e}")
        return file_path


def sync_profile_to_supabase(user_data: Dict[str, Any]) -> bool:
    """
    Pushes user profile data directly to Supabase Cloud PostgreSQL REST API (public.profiles).
    """
    supabase_url = settings.SUPABASE_URL
    service_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if not supabase_url or not service_key or "demo-project" in supabase_url:
        return False

    try:
        import httpx
        endpoint = f"{supabase_url.rstrip('/')}/rest/v1/profiles"
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apiKey": service_key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        user_id = user_data.get("id")
        user_email = user_data.get("email")

        payload = {
            "email": user_email,
            "full_name": user_data.get("full_name") or user_data.get("display_name"),
            "role": user_data.get("role"),
            "preferred_language": user_data.get("preferred_language"),
            "onboarding_completed": user_data.get("onboarding_completed"),
            "country": user_data.get("country"),
            "state": user_data.get("state"),
            "district": user_data.get("district"),
            "city_town": user_data.get("city_town"),
            "village": user_data.get("village") or user_data.get("village_or_city"),
            "latitude": user_data.get("latitude"),
            "longitude": user_data.get("longitude"),
            "phone": user_data.get("phone"),
            "auth_provider": user_data.get("auth_provider"),
            "is_active": user_data.get("is_active")
        }


        if user_id and str(user_id) != "None":
            payload["id"] = str(user_id)

        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}

        if "id" in payload:
            response = httpx.post(endpoint, headers=headers, json=payload, timeout=10.0)
        elif user_email:
            # Query by email to update or insert
            get_resp = httpx.get(f"{endpoint}?email=eq.{user_email}&select=id", headers=headers, timeout=10.0)
            if get_resp.status_code == 200 and len(get_resp.json()) > 0:
                # Update existing profile
                patch_headers = {k: v for k, v in headers.items() if k != "Prefer"}
                response = httpx.patch(f"{endpoint}?email=eq.{user_email}", headers=patch_headers, json=payload, timeout=10.0)
            else:
                # Insert new
                response = httpx.post(endpoint, headers=headers, json=payload, timeout=10.0)
        else:
            return False

        if response.status_code in (200, 201, 204):
            logger.info(f"[SUPABASE SYNC] Profile synced to Supabase Cloud for {user_email}")
            return True
        else:
            logger.warning(f"[SUPABASE SYNC] Profile sync warning {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.warning(f"[SUPABASE SYNC] Profile sync exception: {e}")
        return False


def sync_farm_profile_to_supabase(user_id: str, farm_data: Dict[str, Any]) -> bool:
    """
    Pushes farm profile data directly to Supabase Cloud PostgreSQL REST API (public.farm_profiles).
    """
    supabase_url = settings.SUPABASE_URL
    service_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if not supabase_url or not service_key or "demo-project" in supabase_url:
        return False

    try:
        import httpx
        endpoint = f"{supabase_url.rstrip('/')}/rest/v1/farm_profiles"
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apiKey": service_key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        payload = {
            "user_id": str(user_id),
            "farm_name": farm_data.get("farm_name"),
            "farm_size": farm_data.get("farm_size"),
            "current_crop": farm_data.get("current_crop"),
            "soil_type": farm_data.get("soil_type"),
            "irrigation_method": farm_data.get("irrigation_method"),
            "sowing_date": farm_data.get("sowing_date"),
            "crop_stage": farm_data.get("crop_stage"),
            "experience_years": farm_data.get("experience_years"),
            "water_source": farm_data.get("water_source"),
            "survey_number": farm_data.get("survey_number"),
        }

        payload = {k: v for k, v in payload.items() if v is not None}

        # Check if farm_profile exists in Supabase
        get_resp = httpx.get(f"{endpoint}?user_id=eq.{user_id}&select=id", headers=headers, timeout=10.0)
        if get_resp.status_code == 200 and len(get_resp.json()) > 0:
            patch_headers = {k: v for k, v in headers.items() if k != "Prefer"}
            response = httpx.patch(f"{endpoint}?user_id=eq.{user_id}", headers=patch_headers, json=payload, timeout=10.0)
        else:
            response = httpx.post(endpoint, headers=headers, json=payload, timeout=10.0)

        if response.status_code in (200, 201, 204):
            logger.info(f"[SUPABASE FARM SYNC] Farm profile synced to Supabase for user {user_id}")
            return True
        else:
            logger.warning(f"[SUPABASE FARM SYNC] Warning {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.warning(f"[SUPABASE FARM SYNC] Exception: {e}")
        return False


