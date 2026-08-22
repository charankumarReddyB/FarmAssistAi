import os
import re
import logging
from app.services.ocr_service import ocr_service

logger = logging.getLogger(__name__)


class PDFService:
    @staticmethod
    def extract_text(file_path: str) -> str:
        """
        Extracts clean text from a PDF file using PyMuPDF (fitz), pypdf, or OCR fallback for scanned PDFs.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at path: {file_path}")

        extracted_pages = []

        # 1. Try PyMuPDF (fitz)
        try:
            import fitz  # PyMuPDF
            with fitz.open(file_path) as doc:
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    text = page.get_text("text")
                    if text.strip():
                        extracted_pages.append(text)
            full_text = "\n".join(extracted_pages).strip()
            if len(full_text) >= 15:
                logger.info(f"PyMuPDF extracted {len(full_text)} characters")
                return full_text
            else:
                logger.info("Digital PDF text insufficient (< 15 chars). Falling back to OCR extraction...")
        except Exception as e:
            logger.warning(f"PyMuPDF extraction failed: {e}. Trying pypdf...")

        # 2. Try pypdf fallback
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    extracted_pages.append(t)
            full_text = "\n".join(extracted_pages).strip()
            if len(full_text) >= 15:
                logger.info(f"pypdf extracted {len(full_text)} characters")
                return full_text
        except Exception as e:
            logger.warning(f"pypdf extraction failed: {e}")

        # 3. Fallback to OCR service for scanned PDFs / images
        try:
            logger.info("Triggering OCR engine for PDF content...")
            ocr_text = ocr_service.extract_text_from_image(file_path)
            if len(ocr_text.strip()) > 5:
                return ocr_text.strip()
        except Exception as e:
            logger.warning(f"OCR fallback failed for PDF: {e}")

        # 4. Raw text reading fallback
        try:
            with open(file_path, "rb") as f:
                content = f.read()
                text = content.decode("utf-8", errors="ignore")
                clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', ' ', text)
                clean = re.sub(r'\s+', ' ', clean).strip()
                if len(clean) > 10:
                    logger.info("Raw text fallback extracted content successfully.")
                    return clean
        except Exception as e:
            logger.error(f"Raw text fallback failed: {e}")

        return "[PDF Notice: Report text could not be extracted automatically. Please verify file clarity.]"


pdf_service = PDFService()
