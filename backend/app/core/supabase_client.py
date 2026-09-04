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


def _get_supabase_config():
    supabase_url = settings.SUPABASE_URL
    service_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not supabase_url or not service_key or "demo-project" in supabase_url:
        return None, None
    return supabase_url.rstrip("/"), service_key


def _is_valid_uuid(val: Any) -> bool:
    if not val:
        return False
    try:
        import uuid
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False


def _resolve_valid_profile_id(user_identifier: Optional[str]) -> Optional[str]:
    """
    Given a user ID or email, verifies against Supabase profiles table
    and returns a valid profile UUID, or None if not found/invalid.
    This prevents foreign key constraint violations in Supabase.
    """
    if not user_identifier:
        return None

    base_url, service_key = _get_supabase_config()
    if not base_url or not service_key:
        return None

    try:
        import httpx
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apiKey": service_key,
        }

        # Check if identifier is already a valid UUID in profiles
        if _is_valid_uuid(user_identifier):
            resp = httpx.get(
                f"{base_url}/rest/v1/profiles?id=eq.{user_identifier}&select=id",
                headers=headers,
                timeout=5.0
            )
            if resp.status_code == 200 and len(resp.json()) > 0:
                return str(user_identifier)

        # Check if identifier is an email
        if "@" in str(user_identifier):
            resp = httpx.get(
                f"{base_url}/rest/v1/profiles?email=eq.{user_identifier}&select=id",
                headers=headers,
                timeout=5.0
            )
            if resp.status_code == 200:
                data = resp.json()
                if len(data) > 0:
                    return str(data[0]["id"])
    except Exception as e:
        logger.debug(f"Failed to resolve profile id: {e}")

    return None


def sync_profile_to_supabase(user_data: Dict[str, Any]) -> bool:
    """
    Pushes user profile data directly to Supabase Cloud PostgreSQL REST API (public.profiles).
    Handles email conflict by patching existing profiles if email is found.
    """
    base_url, service_key = _get_supabase_config()
    if not base_url or not service_key:
        return False

    try:
        import httpx
        endpoint = f"{base_url}/rest/v1/profiles"
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

        if _is_valid_uuid(user_id):
            payload["id"] = str(user_id)

        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}

        # Check if profile already exists by email first to avoid unique key conflicts
        existing_profile = None
        if user_email:
            get_resp = httpx.get(f"{endpoint}?email=eq.{user_email}&select=id", headers=headers, timeout=5.0)
            if get_resp.status_code == 200 and len(get_resp.json()) > 0:
                existing_profile = get_resp.json()[0]

        if existing_profile:
            # Profile exists: update it
            patch_headers = {k: v for k, v in headers.items() if k != "Prefer"}
            # Don't try to change primary key id if different
            update_payload = {k: v for k, v in payload.items() if k != "id"}
            response = httpx.patch(f"{endpoint}?email=eq.{user_email}", headers=patch_headers, json=update_payload, timeout=5.0)
        else:
            # Insert new
            response = httpx.post(endpoint, headers=headers, json=payload, timeout=5.0)

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
    base_url, service_key = _get_supabase_config()
    if not base_url or not service_key:
        return False

    try:
        import httpx
        endpoint = f"{base_url}/rest/v1/farm_profiles"
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apiKey": service_key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        resolved_user_id = _resolve_valid_profile_id(user_id) or (str(user_id) if _is_valid_uuid(user_id) else None)
        if not resolved_user_id:
            logger.debug(f"[SUPABASE FARM SYNC] Skipping farm sync, no matching profile UUID for {user_id}")
            return False

        payload = {
            "user_id": resolved_user_id,
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
        get_resp = httpx.get(f"{endpoint}?user_id=eq.{resolved_user_id}&select=id", headers=headers, timeout=5.0)
        if get_resp.status_code == 200 and len(get_resp.json()) > 0:
            patch_headers = {k: v for k, v in headers.items() if k != "Prefer"}
            response = httpx.patch(f"{endpoint}?user_id=eq.{resolved_user_id}", headers=patch_headers, json=payload, timeout=5.0)
        else:
            response = httpx.post(endpoint, headers=headers, json=payload, timeout=5.0)

        if response.status_code in (200, 201, 204):
            logger.info(f"[SUPABASE FARM SYNC] Farm profile synced to Supabase for user {user_id}")
            return True
        else:
            logger.warning(f"[SUPABASE FARM SYNC] Warning {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.warning(f"[SUPABASE FARM SYNC] Exception: {e}")
        return False


def sync_soil_report_to_supabase(report_data: Dict[str, Any]) -> bool:
    """
    Pushes soil report data to Supabase Cloud PostgreSQL REST API (public.soil_reports).
    """
    base_url, service_key = _get_supabase_config()
    if not base_url or not service_key:
        return False

    try:
        import httpx
        endpoint = f"{base_url}/rest/v1/soil_reports"
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apiKey": service_key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        report_id = str(report_data.get("id"))
        farmer_id = _resolve_valid_profile_id(report_data.get("farmer_id"))

        created_at = report_data.get("created_at")
        if hasattr(created_at, "isoformat"):
            created_at = created_at.isoformat()

        updated_at = report_data.get("updated_at")
        if hasattr(updated_at, "isoformat"):
            updated_at = updated_at.isoformat()

        payload = {
            "id": report_id,
            "farmer_id": farmer_id,
            "filename": report_data.get("filename") or "soil_report.pdf",
            "file_type": report_data.get("file_type") or "application/pdf",
            "file_path": str(report_data.get("file_path") or ""),
            "status": report_data.get("status") or "uploaded",
            "raw_text": report_data.get("raw_text"),
            "extracted_data": report_data.get("extracted_data") or {},
            "created_at": created_at,
            "updated_at": updated_at
        }

        payload = {k: v for k, v in payload.items() if v is not None}

        # Check if already exists in Supabase
        get_resp = httpx.get(f"{endpoint}?id=eq.{report_id}&select=id", headers=headers, timeout=5.0)
        if get_resp.status_code == 200 and len(get_resp.json()) > 0:
            patch_headers = {k: v for k, v in headers.items() if k != "Prefer"}
            response = httpx.patch(f"{endpoint}?id=eq.{report_id}", headers=patch_headers, json=payload, timeout=5.0)
        else:
            response = httpx.post(endpoint, headers=headers, json=payload, timeout=5.0)

        if response.status_code in (200, 201, 204):
            logger.info(f"[SUPABASE SOIL SYNC] Soil report {report_id} synced to Supabase successfully")
            return True
        else:
            logger.warning(f"[SUPABASE SOIL SYNC] Warning {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.warning(f"[SUPABASE SOIL SYNC] Exception: {e}")
        return False


def sync_crop_analysis_to_supabase(analysis_data: Dict[str, Any]) -> bool:
    """
    Pushes crop image analysis data to Supabase Cloud PostgreSQL REST API (public.crop_analyses).
    """
    base_url, service_key = _get_supabase_config()
    if not base_url or not service_key:
        return False

    try:
        import httpx
        endpoint = f"{base_url}/rest/v1/crop_analyses"
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apiKey": service_key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        analysis_id = str(analysis_data.get("id"))
        farmer_id = _resolve_valid_profile_id(analysis_data.get("farmer_id"))

        created_at = analysis_data.get("created_at")
        if hasattr(created_at, "isoformat"):
            created_at = created_at.isoformat()

        payload = {
            "id": analysis_id,
            "farmer_id": farmer_id,
            "filename": analysis_data.get("filename") or "crop_image.jpg",
            "file_path": str(analysis_data.get("file_path") or ""),
            "crop_type": analysis_data.get("crop_type") or "Paddy / Rice",
            "disease_class": analysis_data.get("disease_class"),
            "disease_name": analysis_data.get("disease_name"),
            "confidence_score": float(analysis_data.get("confidence_score") or 0.0),
            "risk_level": analysis_data.get("risk_level") or "MODERATE",
            "symptoms": analysis_data.get("symptoms") or [],
            "management_recommendations": analysis_data.get("management_recommendations") or [],
            "weather_impact": analysis_data.get("weather_impact"),
            "final_advisory": analysis_data.get("final_advisory"),
            "status": analysis_data.get("status") or "processed",
            "created_at": created_at
        }

        payload = {k: v for k, v in payload.items() if v is not None}

        get_resp = httpx.get(f"{endpoint}?id=eq.{analysis_id}&select=id", headers=headers, timeout=5.0)
        if get_resp.status_code == 200 and len(get_resp.json()) > 0:
            patch_headers = {k: v for k, v in headers.items() if k != "Prefer"}
            response = httpx.patch(f"{endpoint}?id=eq.{analysis_id}", headers=patch_headers, json=payload, timeout=5.0)
        else:
            response = httpx.post(endpoint, headers=headers, json=payload, timeout=5.0)

        if response.status_code in (200, 201, 204):
            logger.info(f"[SUPABASE CROP SYNC] Crop analysis {analysis_id} synced to Supabase successfully")
            return True
        else:
            logger.warning(f"[SUPABASE CROP SYNC] Warning {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.warning(f"[SUPABASE CROP SYNC] Exception: {e}")
        return False


def sync_advisory_to_supabase(advisory_data: Dict[str, Any]) -> bool:
    """
    Pushes advisory data to Supabase Cloud PostgreSQL REST API (public.advisories).
    """
    base_url, service_key = _get_supabase_config()
    if not base_url or not service_key:
        return False

    try:
        import httpx
        endpoint = f"{base_url}/rest/v1/advisories"
        headers = {
            "Authorization": f"Bearer {service_key}",
            "apiKey": service_key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        advisory_id = str(advisory_data.get("id"))
        farmer_id = _resolve_valid_profile_id(advisory_data.get("farmer_id"))

        # Verify foreign keys if present
        report_id = advisory_data.get("report_id")
        if report_id and not _is_valid_uuid(report_id):
            report_id = None

        crop_analysis_id = advisory_data.get("crop_analysis_id")
        if crop_analysis_id and not _is_valid_uuid(crop_analysis_id):
            crop_analysis_id = None

        created_at = advisory_data.get("created_at")
        if hasattr(created_at, "isoformat"):
            created_at = created_at.isoformat()

        updated_at = advisory_data.get("updated_at")
        if hasattr(updated_at, "isoformat"):
            updated_at = updated_at.isoformat()

        reviewed_at = advisory_data.get("reviewed_at")
        if hasattr(reviewed_at, "isoformat"):
            reviewed_at = reviewed_at.isoformat()

        payload = {
            "id": advisory_id,
            "report_id": str(report_id) if report_id else None,
            "crop_analysis_id": str(crop_analysis_id) if crop_analysis_id else None,
            "farmer_id": farmer_id,
            "farmer_name": advisory_data.get("farmer_name"),
            "farmer_location": advisory_data.get("farmer_location"),
            "source_type": advisory_data.get("source_type") or "soil_analysis",
            "report_summary": advisory_data.get("report_summary"),
            "soil_health_analysis": advisory_data.get("soil_health_analysis"),
            "crop_disease_info": advisory_data.get("crop_disease_info"),
            "extracted_data": advisory_data.get("extracted_data"),
            "nutrient_deficiencies": advisory_data.get("nutrient_deficiencies"),
            "crop_recommendations": advisory_data.get("crop_recommendations"),
            "fertilizer_recommendations": advisory_data.get("fertilizer_recommendations"),
            "irrigation_suggestions": advisory_data.get("irrigation_suggestions"),
            "pest_disease_alerts": advisory_data.get("pest_disease_alerts"),
            "risk_analysis": advisory_data.get("risk_analysis"),
            "risk_level": advisory_data.get("risk_level") or "MODERATE",
            "weather_impact": advisory_data.get("weather_impact"),
            "original_ai_advisory": advisory_data.get("original_ai_advisory"),
            "final_advisory": advisory_data.get("final_advisory"),
            "status": advisory_data.get("status") or "pending_review",
            "reviewed_by": advisory_data.get("reviewed_by"),
            "expert_id": advisory_data.get("expert_id"),
            "expert_notes": advisory_data.get("expert_notes"),
            "reviewed_at": reviewed_at,
            "created_at": created_at,
            "updated_at": updated_at
        }

        payload = {k: v for k, v in payload.items() if v is not None}

        get_resp = httpx.get(f"{endpoint}?id=eq.{advisory_id}&select=id", headers=headers, timeout=5.0)
        if get_resp.status_code == 200 and len(get_resp.json()) > 0:
            patch_headers = {k: v for k, v in headers.items() if k != "Prefer"}
            response = httpx.patch(f"{endpoint}?id=eq.{advisory_id}", headers=patch_headers, json=payload, timeout=5.0)
        else:
            response = httpx.post(endpoint, headers=headers, json=payload, timeout=5.0)

        if response.status_code in (200, 201, 204):
            logger.info(f"[SUPABASE ADVISORY SYNC] Advisory {advisory_id} synced to Supabase successfully")
            return True
        else:
            logger.warning(f"[SUPABASE ADVISORY SYNC] Warning {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.warning(f"[SUPABASE ADVISORY SYNC] Exception: {e}")
        return False
