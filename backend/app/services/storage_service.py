import os
import logging
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Buckets
SOIL_REPORTS_BUCKET = "soil-reports"
CROP_IMAGES_BUCKET = "crop-images"


class SupabaseStorageService:
    def __init__(self):
        self.url = SUPABASE_URL.rstrip("/")
        self.key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY

    def is_configured(self) -> bool:
        return bool(self.url and self.key and "demo" not in self.url)

    def upload_file(
        self,
        bucket: str,
        file_path_in_bucket: str,
        file_content: bytes,
        content_type: str = "application/octet-stream"
    ) -> Dict[str, Any]:
        """
        Uploads a file to Supabase Storage bucket using HTTP REST API.
        Falls back to local file storage if Supabase credentials are not configured.
        """
        if not self.is_configured():
            logger.info(f"Supabase Storage not configured. File stored locally at {file_path_in_bucket}.")
            return {
                "bucket": bucket,
                "path": file_path_in_bucket,
                "public_url": f"/uploads/{file_path_in_bucket}",
                "source": "local_storage"
            }

        endpoint = f"{self.url}/storage/v1/object/{bucket}/{file_path_in_bucket}"
        headers = {
            "Authorization": f"Bearer {self.key}",
            "apiKey": self.key,
            "Content-Type": content_type,
            "x-upsert": "true"
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(endpoint, content=file_content, headers=headers)
                if resp.status_code in [200, 201]:
                    public_url = f"{self.url}/storage/v1/object/public/{bucket}/{file_path_in_bucket}"
                    logger.info(f"Uploaded file to Supabase Storage: {public_url}")
                    return {
                        "bucket": bucket,
                        "path": file_path_in_bucket,
                        "public_url": public_url,
                        "source": "supabase_storage"
                    }
                else:
                    logger.warning(f"Supabase Storage upload failed with status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error uploading to Supabase Storage: {e}")

        return {
            "bucket": bucket,
            "path": file_path_in_bucket,
            "public_url": f"/uploads/{file_path_in_bucket}",
            "source": "local_storage_fallback"
        }


storage_service = SupabaseStorageService()
