"""Schema validation — JSON Schema and business rule checks."""

from __future__ import annotations

from typing import Any

from backend.src.utils.logger import logger


def validate_commodity(commodity: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []

    hs_code = commodity.get("hs_code", "")
    if hs_code and not _validate_hs_code_format(hs_code):
        errors.append(f"Invalid HS code format: {hs_code}")

    value = commodity.get("declared_value", 0)
    if value and value < 0:
        errors.append("Declared value cannot be negative")

    weight = commodity.get("weight", 0)
    if weight and weight < 0:
        errors.append("Weight cannot be negative")

    quantity = commodity.get("quantity", 0)
    if quantity and quantity < 0:
        errors.append("Quantity cannot be negative")

    return {"valid": len(errors) == 0, "errors": errors}


def validate_hs_code(hs_code: str) -> bool:
    return _validate_hs_code_format(hs_code)


def _validate_hs_code_format(code: str) -> bool:
    import re
    return bool(re.match(r"^\d{4}\.\d{2}(\.\d{2,4})?$", code))


def validate_declaration(declaration: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    decl = declaration.get("declaration", {})

    if not decl.get("Declaration"):
        errors.append("Missing Declaration header")

    shipment = decl.get("GoodsShipment", {})
    goods_items = shipment.get("GovernmentAgencyGoodsItem", [])

    if not goods_items:
        errors.append("No goods items in declaration")

    seen_hs_codes: set[str] = set()
    for item in goods_items:
        classifications = item.get("Commodity", {}).get("Classification", [])
        for cls in classifications:
            code = cls.get("ID", "")
            if code in seen_hs_codes:
                errors.append(f"Duplicate HS code: {code}")
            seen_hs_codes.add(code)

    return {"valid": len(errors) == 0, "errors": errors}


def validate_tsw_ready(declaration: dict[str, Any]) -> dict[str, Any]:
    all_errors: list[str] = []

    decl_validation = validate_declaration(declaration)
    all_errors.extend(decl_validation["errors"])

    goods_items = (
        declaration.get("declaration", {})
        .get("GoodsShipment", {})
        .get("GovernmentAgencyGoodsItem", [])
    )

    for item in goods_items:
        commodity_validation = validate_commodity(
            {
                "hs_code": item.get("Commodity", {}).get("Classification", [{}])[0].get("ID", ""),
                "declared_value": item.get("GoodsMeasure", {}).get("CustomsValueAmount", {}).get("Value"),
                "weight": item.get("GoodsMeasure", {}).get("NetNetWeightMeasure", {}).get("Value"),
            }
        )
        all_errors.extend(commodity_validation["errors"])

    return {
        "valid": len(all_errors) == 0,
        "errors": all_errors,
        "confidence": max(0.0, 1.0 - len(all_errors) * 0.1),
    }
