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
        Converts all formats (RGBA, P, L) into 3-channel RGB.
        """
        if not os.path.exists(file_path):
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
