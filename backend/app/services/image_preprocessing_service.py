import os
import logging
from PIL import Image, ImageFile
import numpy as np

# Allow truncated image loading safely
ImageFile.LOAD_TRUNCATED_IMAGES = True

logger = logging.getLogger(__name__)


class ImagePreprocessingService:
    def validate_and_load_image(self, file_path: str) -> Image.Image:
        """
        Validates file existence and image integrity using PIL.
        Supports local file paths, cached upload paths, and remote Supabase URLs.
        Converts all formats (RGBA, P, L) into 3-channel RGB.
        """
        import io
        from app.core.config import settings

        # Handle remote HTTP/HTTPS Supabase storage URLs
        if file_path.startswith("http://") or file_path.startswith("https://"):
            # Check if local copy exists in uploads directory first
            filename = file_path.split("/")[-1]
            local_candidates = [
                os.path.join(settings.UPLOAD_DIR, "crop_images", filename),
                os.path.join(settings.UPLOAD_DIR, filename)
            ]
            for candidate in local_candidates:
                if os.path.exists(candidate):
                    file_path = candidate
                    break
            else:
                # Fetch image from remote URL
                try:
                    import requests
                    resp = requests.get(file_path, timeout=15)
                    resp.raise_for_status()
                    img = Image.open(io.BytesIO(resp.content)).convert("RGB")
                    return img
                except Exception as e:
                    logger.error(f"Failed to fetch image from URL {file_path}: {e}")
                    raise FileNotFoundError(f"Crop image could not be loaded from URL: {e}")

        # If local file does not exist directly at given path, check candidate upload paths
        if not os.path.exists(file_path):
            filename = os.path.basename(file_path)
            local_candidates = [
                os.path.join(settings.UPLOAD_DIR, "crop_images", filename),
                os.path.join(settings.UPLOAD_DIR, filename)
            ]
            for candidate in local_candidates:
                if os.path.exists(candidate):
                    file_path = candidate
                    break
            else:
                raise FileNotFoundError(f"Crop image file not found at: {file_path}")

        try:
            with Image.open(file_path) as img:
                img.verify()
        except Exception as e:
            logger.error(f"Image integrity verification failed for {file_path}: {e}")
            raise ValueError(f"Corrupted or invalid crop image file: {str(e)}")

        # Reopen image after verify() call
        img = Image.open(file_path).convert("RGB")
        return img

    def preprocess_image_tensor(self, file_path: str, target_size=(224, 224)):
        """
        Preprocesses crop leaf image into a normalized PyTorch Tensor ([1, 3, 224, 224]).
        Applies ImageNet mean and std normalization.
        """
        img = self.validate_and_load_image(file_path)
        img_resized = img.resize(target_size, Image.Resampling.BILINEAR)

        # Convert to numpy array float32 in range [0, 1]
        img_np = np.array(img_resized, dtype=np.float32) / 255.0

        # Transpose from (H, W, C) -> (C, H, W)
        img_transposed = np.transpose(img_np, (2, 0, 1))

        # Normalize with ImageNet standard mean and std
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape((3, 1, 1))
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape((3, 1, 1))
        normalized = (img_transposed - mean) / std

        # Add batch dimension (1, 3, 224, 224)
        batch_array = np.expand_dims(normalized, axis=0)

        try:
            import torch
            tensor = torch.from_numpy(batch_array)
            return tensor
        except Exception as e:
            logger.warning(f"PyTorch tensor conversion fallback: {e}")
            return batch_array


image_preprocessing_service = ImagePreprocessingService()
