import os
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Supabase Storage helper functions
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
