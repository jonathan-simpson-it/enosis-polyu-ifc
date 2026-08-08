"""Test document ingestion pipeline."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def test_detect_pdf():
    from backend.src.ingestion.parser import detect_file_type

    assert detect_file_type("invoice.pdf") == "pdf"
    assert detect_file_type("invoice.xlsx") == "excel"
    assert detect_file_type("photo.png", "image/png") == "image"
    assert detect_file_type("data.json") == "json"
    assert detect_file_type("data.csv") == "csv"


def test_detect_by_content_type():
    from backend.src.ingestion.parser import detect_file_type

    assert detect_file_type("unknown.xyz", "application/pdf") == "pdf"
    assert detect_file_type("unknown.xyz", "image/jpeg") == "image"


def test_validate_upload():
    from backend.src.ingestion.sanitizer import validate_upload

    result = validate_upload(b"test data", "invoice.pdf", max_size_mb=20)
    assert result["valid"] is True

    result = validate_upload(b"", "empty.pdf")
    assert result["valid"] is False

    result = validate_upload(b"data", "bad.exe")
    assert result["valid"] is False


def test_redact_pii():
    from backend.src.ingestion.sanitizer import redact_pii

    text = "Contact: A123456(7) or +85298765432 or test@email.com"
    result = redact_pii(text)
    assert "[REDACTED]" in result
    assert "A123456(7)" not in result
    assert "test@email.com" not in result
