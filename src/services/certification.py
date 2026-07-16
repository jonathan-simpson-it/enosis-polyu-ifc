"""Smart Trader Certification service."""

from __future__ import annotations

from typing import Any

CERTIFICATION_LEVELS: dict[str, dict[str, Any]] = {
    "none": {"min_records": 0, "min_accuracy": 0.0, "name": "Not Certified"},
    "bronze": {"min_records": 50, "min_accuracy": 0.80, "name": "Bronze Trader"},
    "silver": {"min_records": 200, "min_accuracy": 0.85, "name": "Silver Trader"},
    "gold": {"min_records": 500, "min_accuracy": 0.90, "name": "Gold Trader"},
    "platinum": {"min_records": 1000, "min_accuracy": 0.95, "name": "Platinum Trader"},
    "diamond": {"min_records": 5000, "min_accuracy": 0.97, "name": "Diamond Trader"},
}

LEVEL_ORDER = ["none", "bronze", "silver", "gold", "platinum", "diamond"]

BADGE_URLS: dict[str, str | None] = {
    "none": None,
    "bronze": "/badges/bronze.svg",
    "silver": "/badges/silver.svg",
    "gold": "/badges/gold.svg",
    "platinum": "/badges/platinum.svg",
    "diamond": "/badges/diamond.svg",
}


def calculate_level(records_uploaded: int, accuracy: float) -> str:
    best = "none"
    for level in LEVEL_ORDER:
        req = CERTIFICATION_LEVELS[level]
        if records_uploaded >= req["min_records"] and accuracy >= req["min_accuracy"]:
            best = level
    return best


def get_badge_url(level: str) -> str | None:
    return BADGE_URLS.get(level)


def get_next_level(current_level: str) -> dict[str, Any]:
    try:
        idx = LEVEL_ORDER.index(current_level)
    except ValueError:
        idx = 0

    if idx >= len(LEVEL_ORDER) - 1:
        return {"achieved": True}

    next_lvl = LEVEL_ORDER[idx + 1]
    req = CERTIFICATION_LEVELS[next_lvl]
    return {
        "level": next_lvl,
        "name": req["name"],
        "records_required": req["min_records"],
        "accuracy_required": req["min_accuracy"],
        "achieved": False,
    }


def calculate_progress(
    current_level: str, records: int, accuracy: float
) -> float:
    next_lvl = get_next_level(current_level)
    if next_lvl.get("achieved"):
        return 1.0

    records_progress = min(1.0, records / next_lvl["records_required"])
    accuracy_progress = min(1.0, accuracy / next_lvl["accuracy_required"])
    return round((records_progress + accuracy_progress) / 2, 2)


def get_certification_status(
    trader_id: str,
    trader_name: str,
    records_uploaded: int,
    accuracy: float,
    level_history: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    current_level = calculate_level(records_uploaded, accuracy)

    return {
        "trader_id": trader_id,
        "trader_name": trader_name,
        "current_level": current_level,
        "level_name": CERTIFICATION_LEVELS[current_level]["name"],
        "records_uploaded": records_uploaded,
        "accuracy_rate": round(accuracy, 2),
        "badge_url": get_badge_url(current_level),
        "next_level": get_next_level(current_level),
        "progress": calculate_progress(current_level, records_uploaded, accuracy),
        "levels": level_history or [],
    }
