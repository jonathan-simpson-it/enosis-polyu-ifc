"""Business rule validation for trade declarations."""

from __future__ import annotations

from typing import Any


def check_weight_consistency(commodities: list[dict[str, Any]], declared_gross: float) -> dict[str, Any]:
    total_item_weight = sum(c.get("weight", 0) or 0 for c in commodities)
    margin = abs(total_item_weight - declared_gross)

    if declared_gross > 0:
        ratio = total_item_weight / declared_gross
        if ratio > 1.1:
            return {"valid": False, "reason": f"Item weights ({total_item_weight}) exceed gross weight ({declared_gross})"}
        if margin > 1000:
            return {"valid": True, "warning": f"Large margin between item weights ({total_item_weight}) and gross ({declared_gross})"}

    return {"valid": True, "reason": "Weight consistent"}


def check_incoterms_rules(incoterms: str, port_of_loading: str, port_of_discharge: str) -> dict[str, Any]:
    if not incoterms:
        return {"valid": False, "reason": "Incoterms is required"}

    valid_codes = {"EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"}
    if incoterms.upper() not in valid_codes:
        return {"valid": False, "reason": f"Invalid Incoterms code: {incoterms}"}

    if not port_of_loading:
        return {"valid": False, "reason": "Port of loading is required for Incoterms"}

    return {"valid": True, "reason": "Incoterms valid"}


def check_required_fields(data: dict[str, Any]) -> dict[str, Any]:
    required = ["consignor_name", "consignee_name", "port_of_loading", "port_of_discharge"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return {"valid": False, "missing": missing}
    return {"valid": True, "missing": []}
