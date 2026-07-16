"""Tesseract OCR service for trade manifest documents."""

from __future__ import annotations

import io
import re
from typing import Any, Optional

from PIL import Image

from src.config import settings
from src.utils.logger import logger


class OCRService:
    """Extracts text from images of trade/commercial documents using Tesseract OCR."""

    def __init__(self, tesseract_cmd: str | None = None):
        import pytesseract

        self._tesseract_cmd = tesseract_cmd or settings.tesseract_cmd
        pytesseract.pytesseract.tesseract_cmd = self._tesseract_cmd
        self._pytesseract = pytesseract

    def extract_text(self, image_bytes: bytes, lang: str = "chi_sim+eng") -> str:
        image = Image.open(io.BytesIO(image_bytes))
        text: str = self._pytesseract.image_to_string(image, lang=lang)
        logger.info(f"OCR extracted {len(text)} characters")
        return text

    def extract_manifest_data(self, image_bytes: bytes) -> dict[str, Any]:
        text = self.extract_text(image_bytes)

        result: dict[str, Any] = {
            "raw_text": text,
            "structured": {
                "invoice_number": self._extract_invoice_number(text),
                "commodities": self._extract_commodities(text),
                "container_number": self._extract_container(text),
                "gross_weight": self._extract_weight(text),
                "country_of_origin": self._extract_country(text),
            },
        }
        return result

    def _extract_invoice_number(self, text: str) -> Optional[str]:
        patterns = [
            r"invoice\s*(?:no|number|#)[:\s]*([A-Z0-9\-]+)",
            r"inv\s*#\s*([A-Z0-9\-]+)",
            r"bill\s*(?:of\s*lading|no)[:\s]*([A-Z0-9\-]+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_commodities(self, text: str) -> list[dict[str, str]]:
        found: list[dict[str, str]] = []
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if re.search(r"hs\s*(?:code|#)[:\s]*\d{4}", line, re.IGNORECASE):
                found.append({"text": line, "confidence": "medium"})
            elif re.search(r"\d{4}\.\d{2}", line):
                found.append({"text": line, "confidence": "medium"})
        return found

    def _extract_container(self, text: str) -> Optional[str]:
        patterns = [
            r"container\s*(?:no|number|#|id)[:\s]*([A-Z]{4}\d{7})",
            r"cntr\s*#\s*([A-Z]{4}\d{7})",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip().upper()
        return None

    def _extract_weight(self, text: str) -> Optional[str]:
        patterns = [
            r"(?:gross|net)\s*weight[:\s]*([\d,.]+)\s*(?:kg|kgs|kilo)",
            r"weight[:\s]*([\d,.]+)\s*(?:kg|kgs|kilo)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_country(self, text: str) -> Optional[str]:
        patterns = [
            r"country\s*(?:of\s*)?origin[:\s]*([A-Z]{2})",
            r"made\s*in\s*([A-Za-z]+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip().upper()
        return None
