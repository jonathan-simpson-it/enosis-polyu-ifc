"""Confidence scoring engine for extracted fields."""

from __future__ import annotations

from typing import Any


def score_hs_code_confidence(hs_code: str, description: str, vector_distance: float | None = None) -> float:
    factors: list[float] = [0.85]

    if len(hs_code) >= 6 and "." in hs_code:
        factors.append(0.1)

    if vector_distance is not None:
        dist_score = max(0.0, 1.0 - vector_distance)
        factors.append(dist_score * 0.15)

    if description and len(description) > 5:
        factors.append(0.05)

    return min(round(sum(factors), 2), 0.99)


def score_extraction_confidence(
    entities: dict[str, Any],
    raw_text: str,
) -> dict[str, float]:
    scores: dict[str, float] = {}

    hs_count = len(entities.get("hs_codes", []))
    if hs_count:
        scores["hs_codes"] = min(0.95, 0.75 + hs_count * 0.05)
    else:
        scores["hs_codes"] = 0.0

    if entities.get("container_numbers"):
        scores["containers"] = 0.95
    else:
        scores["containers"] = 0.0

    if entities.get("weights"):
        scores["weights"] = 0.90
    else:
        scores["weights"] = 0.0

    if entities.get("dates"):
        scores["dates"] = 0.90
    else:
        scores["dates"] = 0.0

    commodities = entities.get("commodities", [])
    labeled = entities.get("labeled_fields", {})

    # Boost confidence based on how many fields we extracted
    header_fields_found = sum(
        1 for k in ("consignor_name", "consignee_name", "port_of_loading", "port_of_discharge", "incoterms", "total_value")
        if labeled.get(k)
    )

    commodity_count = len(commodities)

    # Overall confidence based on data richness
    if commodity_count >= 3 and header_fields_found >= 4:
        scores["overall"] = 0.88
    elif commodity_count >= 2:
        scores["overall"] = 0.80
    elif commodity_count >= 1:
        scores["overall"] = 0.70
    elif entities.get("hs_codes"):
        scores["overall"] = 0.60
    elif len(raw_text) > 100:
        scores["overall"] = 0.50
    elif len(raw_text) > 50:
        scores["overall"] = 0.40
    else:
        scores["overall"] = 0.30

    if hs_count and commodity_count:
        scores["overall"] = min(0.95, scores["overall"] + 0.05)

    return scores


def needs_human_review(confidence: float, threshold: float = 0.85) -> bool:
    return confidence < threshold
