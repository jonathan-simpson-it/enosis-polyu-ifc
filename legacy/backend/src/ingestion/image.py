"""OCR document parsing using Tesseract."""

from __future__ import annotations

import io
from typing import Any

from PIL import Image

from backend.src.core.config import settings
from backend.src.utils.logger import logger


def extract_text_from_bytes(image_bytes: bytes, lang: str = "chi_sim+eng") -> str:
    import pytesseract

    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

    try:
        image = Image.open(io.BytesIO(image_bytes))
        text: str = pytesseract.image_to_string(image, lang=lang)
        logger.info(f"OCR extracted {len(text)} chars")
        return text
    except Exception as exc:
        logger.warning(f"OCR failed: {exc}")
        return ""


def extract_structured_data(image_bytes: bytes) -> dict[str, Any]:
    text = extract_text_from_bytes(image_bytes)

    result: dict[str, Any] = {
        "raw_text": text,
        "structured": {
            "invoice_number": None,
            "commodities": [],
            "container_number": None,
            "gross_weight": None,
            "country_of_origin": None,
        },
    }

    import re

    inv_match = re.search(r"invoice\s*(?:no|number|#)[:\s]*([A-Z0-9\-]+)", text, re.IGNORECASE)
    if inv_match:
        result["structured"]["invoice_number"] = inv_match.group(1).strip()

    container_match = re.search(r"container\s*(?:no|number|#|id)[:\s]*([A-Z]{4}\d{7})", text, re.IGNORECASE)
    if container_match:
        result["structured"]["container_number"] = container_match.group(1).strip().upper()

    weight_match = re.search(r"(?:gross|net)\s*weight[:\s]*([\d,.]+)\s*(?:kg|kgs|kilo)", text, re.IGNORECASE)
    if weight_match:
        result["structured"]["gross_weight"] = weight_match.group(1).strip()

    country_match = re.search(r"country\s*(?:of\s*)?origin[:\s]*([A-Z]{2})", text, re.IGNORECASE)
    if country_match:
        result["structured"]["country_of_origin"] = country_match.group(1).strip().upper()

    commodity_lines = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        if re.search(r"hs\s*(?:code|#)[:\s]*\d{4}", line, re.IGNORECASE):
            commodity_lines.append({"text": line, "confidence": "medium"})
        elif re.search(r"\d{4}\.\d{2}", line):
            commodity_lines.append({"text": line, "confidence": "medium"})

    if commodity_lines:
        result["structured"]["commodities"] = commodity_lines

    return result
