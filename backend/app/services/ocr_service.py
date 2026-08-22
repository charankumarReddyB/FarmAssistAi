import os
import re
import logging
from PIL import Image

logger = logging.getLogger(__name__)


class OCRService:
    def clean_ocr_text(self, text: str) -> str:
        """
        Cleans raw OCR output to handle extra spaces, broken lines, special character artifacts,
        and formatting inconsistencies while preserving agricultural units and values.
        """
        if not text:
            return ""

        # Normalize line endings and broken lines
        cleaned = re.sub(r'[\r\n]+', ' \n ', text)
        
        # Replace OCR noise symbols while keeping basic punctuation, %, /, -, :, ., and digits
        cleaned = re.sub(r'[^\w\s\.\:\-\%\/\(\)]', ' ', cleaned)

        # Fix OCR space breaks in parameters e.g., "p H" -> "pH", "N P K" -> "NPK"
        cleaned = re.sub(r'\bp\s+H\b', 'pH', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\bN\s+P\s+K\b', 'NPK', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\bkg\s*/\s*ha\b', 'kg/ha', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\bmg\s*/\s*kg\b', 'mg/kg', cleaned, flags=re.IGNORECASE)

        # Normalize whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    def extract_text_from_image(self, file_path: str) -> str:
        """
        Extracts text from scanned/image agricultural report files using Tesseract OCR or EasyOCR,
        followed by OCR text cleaning.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Image file not found at: {file_path}")

        raw_text = ""

        # 1. Try Tesseract OCR
        try:
            import pytesseract
            img = Image.open(file_path)
            raw_text = pytesseract.image_to_string(img)
            if raw_text.strip():
                logger.info(f"Tesseract OCR extracted {len(raw_text)} characters")
                return self.clean_ocr_text(raw_text)
        except Exception as e:
            logger.warning(f"Tesseract OCR unavailable or failed: {e}. Trying EasyOCR fallback...")

        # 2. Try EasyOCR fallback
        try:
            import easyocr
            reader = easyocr.Reader(['en'], gpu=False)
            results = reader.readtext(file_path, detail=0)
            raw_text = " ".join(results)
            if raw_text.strip():
                logger.info(f"EasyOCR extracted {len(raw_text)} characters")
                return self.clean_ocr_text(raw_text)
        except Exception as e:
            logger.warning(f"EasyOCR failed or unavailable: {e}")

        if not raw_text.strip():
            logger.warning("OCR engines returned empty output.")
            return "[OCR Notice: Image processed, but text quality was low. Ensure clear lighting and high resolution.]"

        return self.clean_ocr_text(raw_text)


ocr_service = OCRService()
