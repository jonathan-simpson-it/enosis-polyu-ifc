"""Excel document parsing using openpyxl + pandas."""

from __future__ import annotations

import io
from typing import Any

import pandas as pd

from backend.src.utils.logger import logger


def extract_sheets_from_bytes(file_bytes: bytes, filename: str = "") -> dict[str, list[dict[str, Any]]]:
    try:
        xls = pd.ExcelFile(io.BytesIO(file_bytes))
        sheets: dict[str, list[dict[str, Any]]] = {}

        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            df = df.dropna(how="all")
            if not df.empty:
                sheets[sheet_name] = df.to_dict(orient="records")

        logger.info(f"Excel extracted {len(sheets)} sheets from {filename}")
        return sheets
    except Exception as exc:
        logger.warning(f"Excel parsing failed for {filename}: {exc}")
        return {}


def extract_text_from_bytes(file_bytes: bytes, filename: str = "") -> str:
    sheets = extract_sheets_from_bytes(file_bytes, filename)
    if not sheets:
        return ""

    lines: list[str] = []
    for sheet_name, rows in sheets.items():
        lines.append(f"[Sheet: {sheet_name}]")
        if rows:
            headers = list(rows[0].keys())
            lines.append(" | ".join(str(h) for h in headers))
            for row in rows[:100]:
                lines.append(" | ".join(str(v) for v in row.values()))
        lines.append("")

    return "\n".join(lines)
