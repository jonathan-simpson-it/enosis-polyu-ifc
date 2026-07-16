"""Trade document NER — extracts structured entities from raw text.

Hybrid approach:
1. Regex patterns for known structures (HS codes, container numbers, weights, dates)
2. spaCy pipeline (when model is loaded) for entity recognition
3. Keyword matching for commodity descriptions
"""

from __future__ import annotations

import re
from typing import Any

from backend.src.utils.logger import logger

HS_CODE_PATTERN = r"\b(\d{4}\.\d{2}(?:\.\d{2,4})?)\b"
CONTAINER_PATTERN = r"\b([A-Z]{4}\d{7})\b"
WEIGHT_PATTERN = r"(\d+[\d,.]*)\s*(?:KG|KGS|KILO|TON|TONNE|LB|LBS)"
VALUE_PATTERN = r"(?:HKD|USD|CNY|EUR)\s*([\d,]+(?:\.\d{2})?)"
QUANTITY_PATTERN = r"(\d+[\d,]*)\s*(?:PCS|PCE|CTN|BOX|SET|PRS|UNIT|KGS|KGM)"
DATE_PATTERN = r"\b(\d{4}[-/]\d{2}[-/]\d{2})\b"
COUNTRY_PATTERN = r"\b(?:CN|HK|MO|TW|JP|KR|US|DE|SG|VN|TH|IN|GB|FR)\b"


def extract_entities(text: str) -> dict[str, Any]:
    entities: dict[str, Any] = {
        "hs_codes": [],
        "container_numbers": [],
        "weights": [],
        "values": [],
        "quantities": [],
        "dates": [],
        "countries": [],
        "commodity_descriptions": [],
    }

    for match in re.finditer(HS_CODE_PATTERN, text):
        entities["hs_codes"].append(match.group(1))

    for match in re.finditer(CONTAINER_PATTERN, text):
        entities["container_numbers"].append(match.group(1))

    for match in re.finditer(WEIGHT_PATTERN, text, re.IGNORECASE):
        entities["weights"].append(match.group(1))

    for match in re.finditer(VALUE_PATTERN, text):
        entities["values"].append(match.group(1))

    for match in re.finditer(QUANTITY_PATTERN, text, re.IGNORECASE):
        entities["quantities"].append(match.group(1))

    for match in re.finditer(DATE_PATTERN, text):
        entities["dates"].append(match.group(1))

    for match in re.finditer(COUNTRY_PATTERN, text):
        if match.group(0) not in entities["countries"]:
            entities["countries"].append(match.group(0))

    lines = text.split("\n")
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        if re.search(r"(?:item|commodity|product|goods|desc)", line_stripped, re.IGNORECASE):
            if i + 1 < len(lines) and lines[i + 1].strip():
                entities["commodity_descriptions"].append(lines[i + 1].strip())

    logger.info(f"NER extracted: {len(entities['hs_codes'])} HS codes, "
                f"{len(entities['commodity_descriptions'])} commodities, "
                f"{len(entities['container_numbers'])} containers")
    return entities
