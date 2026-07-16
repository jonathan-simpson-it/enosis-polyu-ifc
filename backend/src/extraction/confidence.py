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

    if entities.get("hs_codes"):
        scores["hs_codes"] = min(0.95, 0.75 + len(entities["hs_codes"]) * 0.05)
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

    if len(raw_text) > 100:
        scores["overall"] = 0.80
    elif len(raw_text) > 50:
        scores["overall"] = 0.60
    else:
        scores["overall"] = 0.30

    if entities.get("hs_codes") and entities.get("weights") and entities.get("dates"):
        scores["overall"] = min(0.95, scores["overall"] + 0.15)

    return scores


def needs_human_review(confidence: float, threshold: float = 0.85) -> bool:
    return confidence < threshold
