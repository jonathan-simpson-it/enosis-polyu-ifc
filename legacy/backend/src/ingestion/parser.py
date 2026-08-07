"""Document parsing dispatcher — routes to correct parser by file type."""

from __future__ import annotations

from typing import Any

from backend.src.utils.logger import logger


def detect_file_type(filename: str, content_type: str | None = None) -> str:
    name_lower = filename.lower()
    if name_lower.endswith(".pdf"):
        return "pdf"
    if name_lower.endswith((".xlsx", ".xls")):
        return "excel"
    if name_lower.endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp")):
        return "image"
    if name_lower.endswith(".json"):
        return "json"
    if name_lower.endswith(".csv"):
        return "csv"

    if content_type:
        if "pdf" in content_type:
            return "pdf"
        if "excel" in content_type or "spreadsheet" in content_type:
            return "excel"
        if content_type.startswith("image/"):
            return "image"

    return "text"


async def parse_document(
    file_bytes: bytes,
    filename: str,
    content_type: str | None = None,
) -> dict[str, Any]:
    file_type = detect_file_type(filename, content_type)
    logger.info(f"Parsing {filename} as type={file_type}")

    result: dict[str, Any] = {
        "filename": filename,
        "file_type": file_type,
        "raw_text": "",
        "structured_data": {},
        "tables": [],
    }

    if file_type == "pdf":
        from backend.src.ingestion import pdf

        result["raw_text"] = pdf.extract_text_from_bytes(file_bytes, filename)
        result["tables"] = pdf.extract_tables_from_bytes(file_bytes)

    elif file_type == "excel":
        from backend.src.ingestion import excel

        sheets = excel.extract_sheets_from_bytes(file_bytes, filename)
        result["structured_data"]["sheets"] = sheets
        result["raw_text"] = excel.extract_text_from_bytes(file_bytes, filename)

    elif file_type == "image":
        from backend.src.ingestion import image

        parsed = image.extract_structured_data(file_bytes)
        result["raw_text"] = parsed["raw_text"]
        result["structured_data"] = parsed["structured"]

    elif file_type == "json":
        import json

        result["raw_text"] = file_bytes.decode("utf-8", errors="replace")
        try:
            result["structured_data"] = json.loads(result["raw_text"])
        except json.JSONDecodeError:
            pass

    elif file_type == "csv":
        import csv
        import io

        text = file_bytes.decode("utf-8-sig", errors="replace")
        result["raw_text"] = text
        reader = csv.DictReader(io.StringIO(text))
        result["structured_data"]["rows"] = list(reader)

    else:
        result["raw_text"] = file_bytes.decode("utf-8", errors="replace")

    logger.info(f"Parsed {filename}: {len(result['raw_text'])} chars")
    return result
