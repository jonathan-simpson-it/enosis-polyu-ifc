"""Trade document NER — extracts structured entities from raw text.

Hybrid approach:
1. Regex patterns for known structures (HS codes, container numbers, weights, dates)
2. Labeled-field parsing (CONSIGNOR/CONSIGNEE/ports/incoterms)
3. Numbered commodity-block parsing
4. CSV structured-data mapping
"""

from __future__ import annotations

import re
from typing import Any

COUNTRY_MAP: dict[str, str] = {
    "CHINA": "CN", "HONG KONG": "HK", "MACAU": "MO", "TAIWAN": "TW",
    "JAPAN": "JP", "KOREA": "KR", "SOUTH KOREA": "KR", "UNITED STATES": "US",
    "USA": "US", "GERMANY": "DE", "SINGAPORE": "SG", "VIETNAM": "VN",
    "THAILAND": "TH", "INDIA": "IN", "UNITED KINGDOM": "UK", "FRANCE": "FR",
}

COUNTRY_REVERSE = re.compile(r"\b(" + "|".join(COUNTRY_MAP) + r")\b", re.IGNORECASE)

HS_CODE_PATTERN = re.compile(r"\b(\d{4}\.\d{2}(?:\.\d{2,4})?)\b")
CONTAINER_PATTERN = re.compile(r"\b([A-Z]{4}\d{7})\b")
WEIGHT_PATTERN = re.compile(r"(\d+[\d,.]*(?:\.\d+)?)\s*(?:KG|KGS|KILO|TON|TONNE|LB|LBS)", re.IGNORECASE)
VALUE_PATTERN = re.compile(r"(?:HKD|USD|CNY|EUR)\s*([\d,]+(?:\.\d{2})?)")
QUANTITY_PATTERN = re.compile(r"(\d+[\d,]*)\s*(?:PCS|PCE|CTN|BOX|SET|PRS|UNITS?|KGS|KGM)", re.IGNORECASE)
DATE_PATTERN = re.compile(r"\b(\d{4}[-/]\d{2}[-/]\d{2})\b")
DATE_ALT_PATTERN = re.compile(r"\b(\d{2}-[A-Z]{3}-\d{4})\b", re.IGNORECASE)
COUNTRY_CODE_PATTERN = re.compile(r"\b(CN|HK|MO|TW|JP|KR|US|DE|SG|VN|TH|IN|GB|FR)\b")

LABEL_PATTERNS: dict[str, re.Pattern] = {
    "consignor_name": re.compile(r"CONSIGNOR:\s*(.+)$", re.IGNORECASE | re.MULTILINE),
    "consignee_name": re.compile(r"CONSIGNEE:\s*(.+)$", re.IGNORECASE | re.MULTILINE),
    "port_of_loading": re.compile(r"Port of Loading:\s*(.+)$", re.IGNORECASE | re.MULTILINE),
    "port_of_discharge": re.compile(r"Port of Discharge:\s*(.+)$", re.IGNORECASE | re.MULTILINE),
    "incoterms": re.compile(r"Incoterms:\s*(\S+)", re.IGNORECASE | re.MULTILINE),
    "vessel": re.compile(r"Vessel:\s*(.+)$", re.IGNORECASE | re.MULTILINE),
    "container_number": re.compile(r"(?:Container|CTNR?):\s*(\S+)", re.IGNORECASE | re.MULTILINE),
    "invoice_number": re.compile(r"INVOICE\s*#:\s*(\S+)", re.IGNORECASE | re.MULTILINE),
    "declaration_date": re.compile(r"DATE:\s*(.+)$", re.IGNORECASE | re.MULTILINE),
    "total_value": re.compile(r"TOTAL\s+(?:DECLARED\s+)?VALUE:\s*(?:USD|HKD|CNY|EUR)\s*([\d,]+(?:\.\d{2})?)", re.IGNORECASE | re.MULTILINE),
    "gross_weight": re.compile(r"TOTAL\s+(?:GROSS\s+)?WEIGHT:\s*(\d+[\d,.]*(?:\.\d+)?)\s*(?:KG|KGS)", re.IGNORECASE | re.MULTILINE),
    "net_weight": re.compile(r"TOTAL\s+NET\s+WEIGHT:\s*(\d+[\d,.]*(?:\.\d+)?)\s*(?:KG|KGS)", re.IGNORECASE | re.MULTILINE),
    "number_of_packages": re.compile(r"NUMBER\s+OF\s+PACKAGES?:\s*(\d+)", re.IGNORECASE | re.MULTILINE),
}

COMMODITY_BLOCK_PATTERN = re.compile(
    r'(\d+)\.\s*"?([^"]+)"?\s*'
    r'(?:\n|$).*?'
    r'HS\s*Code:\s*(\d{4}\.\d{2}(?:\.\d{2,4})?)', re.IGNORECASE | re.DOTALL
)

COMMODITY_LINE_ITEM = re.compile(
    r'(\d+)\.\s*"?([^"]+)"?\s*\n'
    r'.*?HS\s*Code:\s*(\d{4}\.\d{2}(?:\.\d{2,4})?)\s*\n'
    r'.*?Quantity:\s*(\d+[\d,]*)\s*(UNITS?|PCS|PCE|BOX|SET|KG|KGS)?\s*\n'
    r'.*?Unit\s+Price:\s*(?:USD|HKD|CNY|EUR)\s*([\d,]+(?:\.\d{2})?)\s*\n'
    r'.*?Total\s+Value:\s*(?:USD|HKD|CNY|EUR)\s*([\d,]+(?:\.\d{2})?)\s*\n'
    r'.*?Gross\s+Weight:\s*(\d+[\d,.]*(?:\.\d+)?)\s*(?:KG|KGS)?\s*\n'
    r'.*?Net\s+Weight:\s*(\d+[\d,.]*(?:\.\d+)?)\s*(?:KG|KGS)?\s*\n'
    r'.*?Country\s+of\s+Origin:\s*(.+?)$',
    re.IGNORECASE | re.MULTILINE | re.DOTALL,
)

COMMODITY_SIMPLE = re.compile(
    r'(\d+)\.\s*"?([^"]+)"?\s*\n'
    r'.*?HS\s*Code:\s*(\d{4}\.\d{2}(?:\.\d{2,4})?)\s*\n'
    r'.*?Quantity:\s*(\d+[\d,]*)\s*(UNITS?|PCS|PCE|BOX|SET|KG|KGS)?\s*\n'
    r'.*?Total\s+Value:\s*(?:USD|HKD|CNY|EUR)\s*([\d,]+(?:\.\d{2})?)',
    re.IGNORECASE | re.DOTALL,
)


def _parse_commodity_blocks(text: str) -> list[dict[str, Any]]:
    commodities: list[dict[str, Any]] = []

    # try full detail match first
    for m in COMMODITY_LINE_ITEM.finditer(text):
        commodity = {
            "description": m.group(2).strip(),
            "hs_code": m.group(3),
            "quantity": _parse_number(m.group(4)),
            "unit": (m.group(5) or "units").rstrip("S").upper(),
            "declared_value": _parse_number(m.group(7)),
            "weight": _parse_number(m.group(8)),
            "country_of_origin": _resolve_country(m.group(10).strip()),
        }
        commodities.append(commodity)

    if commodities:
        return commodities

    for m in COMMODITY_SIMPLE.finditer(text):
        commodity = {
            "description": m.group(2).strip(),
            "hs_code": m.group(3),
            "quantity": _parse_number(m.group(4)),
            "unit": (m.group(5) or "units").rstrip("S").upper(),
            "declared_value": _parse_number(m.group(6)),
            "weight": None,
            "country_of_origin": None,
        }
        commodities.append(commodity)

    return commodities


def _parse_number(s: str) -> float | None:
    if not s:
        return None
    cleaned = s.strip().replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _resolve_country(name: str) -> str | None:
    upper = name.strip().upper()
    if upper in COUNTRY_MAP:
        return COUNTRY_MAP[upper]
    if COUNTRY_CODE_PATTERN.fullmatch(name.strip()):
        return name.strip().upper()
    return None


def extract_labeled_fields(text: str) -> dict[str, Any]:
    fields: dict[str, Any] = {}
    for key, pattern in LABEL_PATTERNS.items():
        m = pattern.search(text)
        if m:
            val = m.group(1).strip()
            if key in ("total_value",) and val:
                fields[key] = _parse_number(val)
            elif key in ("gross_weight", "net_weight") and val:
                fields[key] = _parse_number(val)
            elif key in ("number_of_packages",) and val:
                try:
                    fields[key] = int(val.replace(",", ""))
                except ValueError:
                    fields[key] = 1
            elif key == "declaration_date" and val:
                fields[key] = val
            elif key == "container_number" and val:
                fields[key] = val
            else:
                fields[key] = val
    return fields


def extract_entities(text: str, structured_data: dict[str, Any] | None = None) -> dict[str, Any]:
    entities: dict[str, Any] = {
        "hs_codes": [],
        "container_numbers": [],
        "weights": [],
        "values": [],
        "quantities": [],
        "dates": [],
        "countries": [],
        "commodity_descriptions": [],
        "labeled_fields": extract_labeled_fields(text),
        "commodities": [],
    }

    for match in HS_CODE_PATTERN.finditer(text):
        code = match.group(1)
        if code not in entities["hs_codes"]:
            entities["hs_codes"].append(code)

    for match in CONTAINER_PATTERN.finditer(text):
        cntr = match.group(1)
        if cntr not in entities["container_numbers"]:
            entities["container_numbers"].append(cntr)

    for match in WEIGHT_PATTERN.finditer(text):
        entities["weights"].append(match.group(1))

    for match in VALUE_PATTERN.finditer(text):
        entities["values"].append(match.group(1))

    for match in QUANTITY_PATTERN.finditer(text):
        entities["quantities"].append(match.group(1))

    for match in DATE_PATTERN.finditer(text):
        entities["dates"].append(match.group(1))
    for match in DATE_ALT_PATTERN.finditer(text):
        entities["dates"].append(match.group(1))

    for match in COUNTRY_REVERSE.finditer(text):
        code = COUNTRY_MAP[match.group(1).upper()]
        if code not in entities["countries"]:
            entities["countries"].append(code)
    for match in COUNTRY_CODE_PATTERN.finditer(text):
        code = match.group(1)
        if code not in entities["countries"]:
            entities["countries"].append(code)

    # Parse commodity blocks from text
    entities["commodities"] = _parse_commodity_blocks(text)

    # If CSV structured_data with hs_code column, add those as commodities too
    if structured_data:
        rows = structured_data.get("rows", [])
        seen_hs = [c.get("hs_code") for c in entities["commodities"]]
        for row in rows:
            hs = row.get("hs_code", "").strip()
            if hs and hs not in seen_hs:
                seen_hs.append(hs)
                desc = row.get("description", "")
                qty = _parse_number(row.get("quantity", ""))
                unit_raw = row.get("unit", "PCS")
                val = _parse_number(row.get("total_value_usd", row.get("declared_value", "")))
                wt = _parse_number(row.get("gross_weight_kg", row.get("weight", "")))
                coo = _resolve_country(row.get("country_of_origin", ""))
                entities["commodities"].append({
                    "description": desc,
                    "hs_code": hs,
                    "quantity": qty,
                    "unit": unit_raw.upper().rstrip("S") if unit_raw else "PCS",
                    "declared_value": val,
                    "weight": wt,
                    "country_of_origin": coo,
                })

    lines = text.split("\n")
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        if re.search(r"(?:item|commodity|product|goods|desc)", line_stripped, re.IGNORECASE):
            if i + 1 < len(lines) and lines[i + 1].strip():
                desc = lines[i + 1].strip()
                if desc not in entities["commodity_descriptions"]:
                    entities["commodity_descriptions"].append(desc)

    return entities
