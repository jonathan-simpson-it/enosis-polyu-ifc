"""PII redaction and document validation."""

from __future__ import annotations

import re
from typing import Any

PII_PATTERNS = {
    "hkid": r"[A-Z]\d{6}\(?\d\)?",
    "phone_hk": r"(?:\+852)?\d{8}",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "passport": r"[A-Z]{2}\d{7}",
    "br_number": r"BR-\d{8}",
}


def redact_pii(text: str, placeholder: str = "[REDACTED]") -> str:
    for name, pattern in PII_PATTERNS.items():
        text = re.sub(pattern, placeholder, text)
    return text


def validate_upload(file_bytes: bytes, filename: str, max_size_mb: int = 20) -> dict[str, Any]:
    errors: list[str] = []
    file_size = len(file_bytes)
    max_bytes = max_size_mb * 1024 * 1024

    if file_size > max_bytes:
        errors.append(f"File exceeds {max_size_mb}MB limit ({file_size / 1024 / 1024:.1f}MB)")

    if file_size == 0:
        errors.append("File is empty")

    valid_extensions = {".pdf", ".xlsx", ".xls", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".json", ".csv"}
    ext = filename[filename.rfind("."):].lower() if "." in filename else ""
    if ext and ext not in valid_extensions:
        errors.append(f"Unsupported file extension: {ext}")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "file_size": file_size,
    }
