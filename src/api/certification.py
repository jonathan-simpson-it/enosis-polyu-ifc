"""Smart Clinic Certification endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Clinic, CertificationTracking
from src.schemas import CertificationResponse, NextLevel, LevelHistory
from src.services.certification import (
    get_certification_status,
    LEVEL_ORDER,
    CERTIFICATION_LEVELS,
)

router = APIRouter(prefix="/api/v1", tags=["Certification"])


@router.get("/certification/{clinic_id}", response_model=CertificationResponse)
async def get_certification(clinic_id: str, db: Session = Depends(get_db)):
    """Get the Smart Clinic Certification status for a clinic."""
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    tracking = (
        db.query(CertificationTracking)
        .filter(CertificationTracking.clinic_id == clinic_id)
        .first()
    )

    records = tracking.records_uploaded if tracking else 0
    accuracy = tracking.accuracy_rate if tracking else 0.0

    # Build level history
    levels_history = []
    for level in LEVEL_ORDER[1:]:  # skip "none"
        req = CERTIFICATION_LEVELS[level]
        achieved = records >= req["min_records"] and accuracy >= req["min_accuracy"]
        levels_history.append(LevelHistory(
            level=level,
            achieved=achieved,
            date=None,  # Would come from audit log in production
        ))

    status = get_certification_status(
        clinic_id=clinic_id,
        clinic_name=clinic.name,
        records_uploaded=records,
        accuracy=accuracy,
        level_history=[h.model_dump() for h in levels_history],
    )

    return CertificationResponse(
        clinic_id=clinic_id,
        clinic_name=clinic.name,
        current_level=status["current_level"],
        level_name=status["level_name"],
        records_uploaded=status["records_uploaded"],
        accuracy_rate=status["accuracy_rate"],
        badge_url=status["badge_url"],
        next_level=NextLevel(**status["next_level"]) if status["next_level"] else None,
        progress=status["progress"],
        levels=levels_history,
    )
