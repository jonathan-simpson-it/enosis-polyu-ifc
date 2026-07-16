"""Upload endpoints — submit WCO declarations to mock HK TSW Phase 3."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import WCODeclaration, CertificationTracking
from src.schemas import UploadRequest, UploadResponse, UploadStatusResponse
from src.services.tsw import MockTSWAPI
from src.services.certification import calculate_level
from src.utils.logger import logger

router = APIRouter(prefix="/api/v1", tags=["Upload"])

_tsw = MockTSWAPI()


@router.post("/upload", response_model=UploadResponse)
async def upload_to_tsw(request: UploadRequest, db: Session = Depends(get_db)):
    """Submit a WCO declaration to HK TSW Phase 3 (mock for v0).

    Requires trader consent to be explicitly set to true.
    """
    if not request.trader_consent:
        raise HTTPException(status_code=400, detail="Trader consent is required")

    try:
        result = await _tsw.submit_declaration(
            trader_id=request.trader_id,
            declaration_id=request.declaration_id,
            wco_declaration=request.wco_declaration,
            consent=request.trader_consent,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    declaration = (
        db.query(WCODeclaration)
        .filter(
            WCODeclaration.trader_id == request.trader_id,
            WCODeclaration.declaration_id == request.declaration_id,
        )
        .order_by(WCODeclaration.created_at.desc())
        .first()
    )
    if declaration:
        declaration.submission_status = "completed"
        declaration.tsw_reference = result["tsw_reference"]

    tracking = (
        db.query(CertificationTracking)
        .filter(CertificationTracking.trader_id == request.trader_id)
        .first()
    )
    if not tracking:
        tracking = CertificationTracking(trader_id=request.trader_id, records_uploaded=0, accuracy_rate=0.0)
        db.add(tracking)

    tracking.records_uploaded += 1
    tracking.current_level = calculate_level(
        tracking.records_uploaded, tracking.accuracy_rate
    )
    db.commit()

    logger.info(
        f"Upload complete for trader={request.trader_id}, "
        f"ref={result['tsw_reference']}"
    )

    return UploadResponse(
        upload_id=result["submission_id"],
        status=result["status"],
        tsw_reference=result["tsw_reference"],
        message=result["message"],
    )


@router.get("/upload/{upload_id}/status", response_model=UploadStatusResponse)
async def get_upload_status(upload_id: str):
    """Retrieve the status of a TSW submission."""
    status_data = _tsw.get_status(upload_id)

    if status_data.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="Upload not found")

    return UploadStatusResponse(
        upload_id=status_data["submission_id"],
        status=status_data["status"],
        tsw_reference=status_data.get("tsw_reference"),
        submitted_at=status_data.get("submitted_at"),
    )
