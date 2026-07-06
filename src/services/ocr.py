"""Tesseract OCR service for handwritten clinical notes."""

from __future__ import annotations

import io
import re
from typing import Any, Optional

from PIL import Image

from src.config import settings
from src.utils.logger import logger


class OCRService:
    """Extracts text from images using Tesseract OCR."""

    def __init__(self, tesseract_cmd: str | None = None):
        """Initialize OCR service.

        Args:
            tesseract_cmd: Path to tesseract binary.
        """
        import pytesseract

        self._tesseract_cmd = tesseract_cmd or settings.tesseract_cmd
        pytesseract.pytesseract.tesseract_cmd = self._tesseract_cmd
        self._pytesseract = pytesseract

    def extract_text(self, image_bytes: bytes, lang: str = "chi_sim+eng") -> str:
        """Extract raw text from an image.

        Args:
            image_bytes: Raw image bytes (PNG, JPEG, etc.).
            lang: Tesseract language codes (default: Chinese Simplified + English).

        Returns:
            Extracted text string.
        """
        image = Image.open(io.BytesIO(image_bytes))
        text: str = self._pytesseract.image_to_string(image, lang=lang)
        logger.info(f"OCR extracted {len(text)} characters")
        return text

    def extract_clinical_notes(self, image_bytes: bytes) -> dict[str, Any]:
        """Extract and structure clinical notes from an image.

        Args:
            image_bytes: Raw image bytes.

        Returns:
            Dict with raw_text and structured fields.
        """
        text = self.extract_text(image_bytes)

        result: dict[str, Any] = {
            "raw_text": text,
            "structured": {
                "symptoms": self._extract_symptoms(text),
                "diagnosis": self._extract_diagnosis(text),
                "treatment": self._extract_treatment(text),
                "medications": self._extract_medications(text),
            },
        }
        return result

    def _extract_symptoms(self, text: str) -> list[str]:
        """Extract symptoms via keyword matching."""
        keywords = [
            "pain", "fatigue", "cough", "fever", "nausea",
            "dizziness", "headache", "thirst", "shortness of breath",
        ]
        found: list[str] = []
        for kw in keywords:
            if kw.lower() in text.lower():
                found.append(kw)
        return found

    def _extract_diagnosis(self, text: str) -> Optional[str]:
        """Extract diagnosis using pattern matching."""
        patterns = [
            r"diagnosis:?\s*(.+?)[\n\.]",
            r"diagnosed with:?\s*(.+?)[\n\.]",
            r"impression:?\s*(.+?)[\n\.]",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_treatment(self, text: str) -> Optional[str]:
        """Extract treatment plan using pattern matching."""
        patterns = [
            r"treatment:?\s*(.+?)[\n\.]",
            r"plan:?\s*(.+?)[\n\.]",
            r"management:?\s*(.+?)[\n\.]",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_medications(self, text: str) -> list[dict[str, str]]:
        """Extract medication mentions using pattern matching."""
        patterns = [
            r"(\w+)\s+(\d+mg|\d+ml|\d+mcg)",
            r"(\w+)\s+(\d+)\s*(mg|ml|mcg)",
        ]
        found: list[dict[str, str]] = []
        seen: set[str] = set()
        for pattern in patterns:
            for match in re.findall(pattern, text, re.IGNORECASE):
                name = match[0]
                dosage = match[1] if len(match) > 1 else ""
                if name.lower() not in seen:
                    seen.add(name.lower())
                    found.append({"name": name, "dosage": dosage})
        return found
