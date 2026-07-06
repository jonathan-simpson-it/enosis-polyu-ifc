"""Data ingestion endpoints — scrape clinic CMS for patient data."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Clinic, Patient
from src.schemas import IngestRequest, IngestResponse, IngestStatusResponse
from src.services.scrape import CMSScraper
from src.utils.logger import logger

router = APIRouter(prefix="/api/v1", tags=["Ingest"])

# In-memory job store for v0 (no Redis)
_jobs: dict[str, dict[str, Any]] = {}


@router.post("/ingest", response_model=IngestResponse)
async def ingest_data(request: IngestRequest, db: Session = Depends(get_db)):
    """Scrape patient data from a clinic CMS.

    Kicks off an async scraping job and returns a job_id for status polling.
    """
    clinic_id = request.clinic_id or str(uuid.uuid4())

    # Ensure clinic exists
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        clinic = Clinic(id=clinic_id, name=request.clinic_name, cms_type=request.cms_type)
        db.add(clinic)
        db.commit()

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "processing",
        "clinic_id": clinic_id,
        "patients_scraped": 0,
        "patients_found": 0,
    }

    # Determine patient IDs to scrape
    patient_ids = request.patient_ids or ["P001", "P002", "P003"]

    # Scrape in background
    try:
        scraper = CMSScraper()
        patients_data = await scraper.scrape_patients(request.cms_url, patient_ids)

        # Save patients to DB
        saved_count = 0
        for pdata in patients_data:
            if not pdata or not pdata.get("hkid"):
                continue

            # Parse name
            full_name = pdata.get("name", "")
            parts = full_name.rsplit(" ", 1) if " " in full_name else [full_name, ""]
            last_name = parts[1] if len(parts) > 1 else parts[0]
            first_name = parts[0] if len(parts) > 1 else ""

            patient = Patient(
                clinic_id=clinic_id,
                hkid=pdata.get("hkid", ""),
                first_name=first_name,
                last_name=last_name,
                dob=pdata.get("dob", ""),
                gender=pdata.get("gender", ""),
            )
            db.add(patient)
            saved_count += 1

        db.commit()

        _jobs[job_id].update({
            "status": "completed",
            "patients_found": len(patients_data),
            "patients_extracted": saved_count,
            "data": patients_data,
        })

        return IngestResponse(
            job_id=job_id,
            status="processing",
            patients_scraped=len(patients_data),
            estimated_time=3,
        )

    except Exception as exc:
        logger.error(f"Ingest job {job_id} failed: {exc}")
        _jobs[job_id]["status"] = "failed"
        raise HTTPException(status_code=500, detail=f"Ingest failed: {str(exc)}")


@router.get("/ingest/{job_id}/status", response_model=IngestStatusResponse)
async def get_ingest_status(job_id: str):
    """Poll the status of an ingest job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return IngestStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        patients_found=job.get("patients_found", 0),
        patients_extracted=job.get("patients_extracted", 0),
        data=job.get("data", []),
    )
