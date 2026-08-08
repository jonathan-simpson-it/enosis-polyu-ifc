"""HK TSW Phase 3 specific schema wrapper.

Wraps the WCO Data Model with TSW-specific headers and routing.
"""

from __future__ import annotations

from typing import Any

from backend.src.schema.registry import registry


def build_tsw_payload(
    declaration_data: dict[str, Any],
    commodities: list[dict[str, Any]],
    trader_ref: str = "",
) -> dict[str, Any]:
    from backend.src.schema.wco import build_wco_json

    wco = build_wco_json(declaration_data, commodities)

    tsw_payload = {
        "tsw_version": "3.0",
        "submission_type": "declaration",
        "trader_reference": trader_ref or declaration_data.get("declaration_number", ""),
        "submission_channel": "API",
        "declaration": wco,
    }

    return tsw_payload


registry.register("tsw_json", build_tsw_payload)
