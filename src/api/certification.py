"""Smart Trader Certification endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Trader, CertificationTracking
from src.schemas import CertificationResponse, NextLevel, LevelHistory
from src.services.certification import (
    get_certification_status,
    LEVEL_ORDER,
    CERTIFICATION_LEVELS,
)

router = APIRouter(prefix="/api/v1", tags=["Certification"])


@router.get("/certification/{trader_id}", response_model=CertificationResponse)
async def get_certification(trader_id: str, db: Session = Depends(get_db)):
    """Get the Smart Trader Certification status for a trader."""
    trader = db.query(Trader).filter(Trader.id == trader_id).first()
    if not trader:
        raise HTTPException(status_code=404, detail="Trader not found")

    tracking = (
        db.query(CertificationTracking)
        .filter(CertificationTracking.trader_id == trader_id)
        .first()
    )

    records = tracking.records_uploaded if tracking else 0
    accuracy = tracking.accuracy_rate if tracking else 0.0

    levels_history = []
    for level in LEVEL_ORDER[1:]:
        req = CERTIFICATION_LEVELS[level]
        achieved = records >= req["min_records"] and accuracy >= req["min_accuracy"]
        levels_history.append(LevelHistory(
            level=level,
            achieved=achieved,
            date=None,
        ))

    status = get_certification_status(
        trader_id=trader_id,
        trader_name=trader.name,
        records_uploaded=records,
        accuracy=accuracy,
        level_history=[h.model_dump() for h in levels_history],
    )

    return CertificationResponse(
        trader_id=trader_id,
        trader_name=trader.name,
        current_level=status["current_level"],
        level_name=status["level_name"],
        declarations_submitted=status["records_uploaded"],
        accuracy_rate=status["accuracy_rate"],
        badge_url=status["badge_url"],
        next_level=NextLevel(**status["next_level"]) if status["next_level"] else None,
        progress=status["progress"],
        levels=levels_history,
    )
