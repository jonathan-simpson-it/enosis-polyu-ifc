"""PDF document parsing using pdfplumber + PyPDF2 fallback."""

from __future__ import annotations

import io
from typing import Any

from backend.src.utils.logger import logger


def extract_text_from_bytes(file_bytes: bytes, filename: str = "") -> str:
    try:
        import pdfplumber

        text_parts: list[str] = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        result = "\n".join(text_parts)
        if result.strip():
            logger.info(f"PDF extracted {len(result)} chars from {filename}")
            return result
    except Exception as exc:
        logger.warning(f"pdfplumber failed for {filename}: {exc}")

    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = [page.extract_text() or "" for page in reader.pages]
        result = "\n".join(text_parts)
        logger.info(f"PyPDF2 extracted {len(result)} chars from {filename}")
        return result
    except Exception as exc:
        logger.warning(f"PyPDF2 also failed for {filename}: {exc}")

    return ""


def extract_tables_from_bytes(file_bytes: bytes) -> list[list[list[str | None]]]:
    try:
        import pdfplumber

        tables: list[list[list[str | None]]] = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_tables = page.extract_tables()
                if page_tables:
                    tables.extend(page_tables)
        return tables
    except Exception as exc:
        logger.warning(f"Table extraction failed: {exc}")
        return []
