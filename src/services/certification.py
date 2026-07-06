"""Smart Clinic Certification service."""

from __future__ import annotations

from typing import Any

CERTIFICATION_LEVELS: dict[str, dict[str, Any]] = {
    "none": {"min_records": 0, "min_accuracy": 0.0, "name": "Not Certified"},
    "bronze": {"min_records": 50, "min_accuracy": 0.80, "name": "Bronze Clinic"},
    "silver": {"min_records": 200, "min_accuracy": 0.85, "name": "Silver Clinic"},
    "gold": {"min_records": 500, "min_accuracy": 0.90, "name": "Gold Clinic"},
    "platinum": {"min_records": 1000, "min_accuracy": 0.95, "name": "Platinum Clinic"},
    "diamond": {"min_records": 5000, "min_accuracy": 0.97, "name": "Diamond Clinic"},
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
    """Determine the certification level based on metrics.

    Args:
        records_uploaded: Total records uploaded to eHealth+.
        accuracy: Translation accuracy rate (0.0-1.0).

    Returns:
        Certification level string.
    """
    best = "none"
    for level in LEVEL_ORDER:
        req = CERTIFICATION_LEVELS[level]
        if records_uploaded >= req["min_records"] and accuracy >= req["min_accuracy"]:
            best = level
    return best


def get_badge_url(level: str) -> str | None:
    """Get the badge SVG URL for a certification level.

    Args:
        level: Certification level string.

    Returns:
        Badge URL or None.
    """
    return BADGE_URLS.get(level)


def get_next_level(current_level: str) -> dict[str, Any]:
    """Get requirements for the next certification tier.

    Args:
        current_level: Current certification level.

    Returns:
        Dict with next level name and requirements, or achieved=True if at max.
    """
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
    """Calculate progress fraction toward the next level.

    Args:
        current_level: Current certification level.
        records: Current record count.
        accuracy: Current accuracy rate.

    Returns:
        Progress value between 0.0 and 1.0.
    """
    next_lvl = get_next_level(current_level)
    if next_lvl.get("achieved"):
        return 1.0

    records_progress = min(1.0, records / next_lvl["records_required"])
    accuracy_progress = min(1.0, accuracy / next_lvl["accuracy_required"])
    return round((records_progress + accuracy_progress) / 2, 2)


def get_certification_status(
    clinic_id: str,
    clinic_name: str,
    records_uploaded: int,
    accuracy: float,
    level_history: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Build the full certification status response.

    Args:
        clinic_id: Clinic UUID.
        clinic_name: Human-readable clinic name.
        records_uploaded: Total records uploaded.
        accuracy: Accuracy rate (0.0-1.0).
        level_history: Optional list of previously achieved levels.

    Returns:
        Full certification status dict.
    """
    current_level = calculate_level(records_uploaded, accuracy)

    return {
        "clinic_id": clinic_id,
        "clinic_name": clinic_name,
        "current_level": current_level,
        "level_name": CERTIFICATION_LEVELS[current_level]["name"],
        "records_uploaded": records_uploaded,
        "accuracy_rate": round(accuracy, 2),
        "badge_url": get_badge_url(current_level),
        "next_level": get_next_level(current_level),
        "progress": calculate_progress(current_level, records_uploaded, accuracy),
        "levels": level_history or [],
    }
