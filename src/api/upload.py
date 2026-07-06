"""Upload endpoints — send FHIR bundles to mock eHealth+."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import FHIRBundle, CertificationTracking
from src.schemas import UploadRequest, UploadResponse, UploadStatusResponse
from src.services.ehealth import MockEHealthAPI
from src.services.certification import calculate_level
from src.utils.logger import logger

router = APIRouter(prefix="/api/v1", tags=["Upload"])

# Singleton mock eHealth+ instance
_ehealth = MockEHealthAPI()


@router.post("/upload", response_model=UploadResponse)
async def upload_to_ehealth(request: UploadRequest, db: Session = Depends(get_db)):
    """Upload a FHIR bundle to eHealth+ (mock for v0).

    Requires patient consent to be explicitly set to true.
    """
    if not request.patient_consent:
        raise HTTPException(status_code=400, detail="Patient consent is required")

    try:
        result = await _ehealth.upload_bundle(
            clinic_id=request.clinic_id,
            patient_id=request.patient_id,
            fhir_bundle=request.fhir_bundle,
            consent=request.patient_consent,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Update the latest FHIR bundle for this patient
    bundle = (
        db.query(FHIRBundle)
        .filter(
            FHIRBundle.clinic_id == request.clinic_id,
            FHIRBundle.patient_id == request.patient_id,
        )
        .order_by(FHIRBundle.created_at.desc())
        .first()
    )
    if bundle:
        bundle.upload_status = "completed"
        bundle.ehealth_reference = result["ehealth_reference"]

    # Update certification tracking
    tracking = (
        db.query(CertificationTracking)
        .filter(CertificationTracking.clinic_id == request.clinic_id)
        .first()
    )
    if not tracking:
        tracking = CertificationTracking(clinic_id=request.clinic_id, records_uploaded=0, accuracy_rate=0.0)
        db.add(tracking)

    tracking.records_uploaded += len(request.fhir_bundle.get("entry", []))
    tracking.current_level = calculate_level(
        tracking.records_uploaded, tracking.accuracy_rate
    )
    db.commit()

    logger.info(
        f"Upload complete for clinic={request.clinic_id}, "
        f"ref={result['ehealth_reference']}"
    )

    return UploadResponse(
        upload_id=result["upload_id"],
        status=result["status"],
        ehealth_reference=result["ehealth_reference"],
        message=result["message"],
    )


@router.get("/upload/{upload_id}/status", response_model=UploadStatusResponse)
async def get_upload_status(upload_id: str):
    """Retrieve the status of an eHealth+ upload."""
    status_data = _ehealth.get_status(upload_id)

    if status_data.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="Upload not found")

    return UploadStatusResponse(
        upload_id=status_data["upload_id"],
        status=status_data["status"],
        ehealth_reference=status_data.get("ehealth_reference"),
        uploaded_at=status_data.get("uploaded_at"),
    )
