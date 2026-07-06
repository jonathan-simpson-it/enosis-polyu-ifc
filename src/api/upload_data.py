"""Upload-data endpoints — accept file uploads and direct data submissions from doctors."""

from __future__ import annotations

import io
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Clinic, Patient
from src.schemas import (
    UploadDataRequest,
    UploadDataResponse,
    UploadDataStatusResponse,
    PatientData,
)
from src.services.ocr import OCRService
from src.utils.logger import logger

router = APIRouter(prefix="/api/v1", tags=["Upload Data"])

# In-memory job store for v0 (no Redis)
_jobs: dict[str, dict[str, Any]] = {}


@router.post("/upload-data", response_model=UploadDataResponse)
async def upload_data(
    db: Session = Depends(get_db),
    file: UploadFile | None = File(None, description="Image file (PNG/JPG) for OCR, or JSON/CSV data file"),
    clinic_id: str | None = Form(None),
    clinic_name: str = Form("Direct Upload"),
    source_description: str = Form(""),
):
    """Accept file uploads or direct data from doctors.

    Accepts either:
    - **Multipart file upload** (image → OCR, or JSON/CSV → parsed data)
    - **JSON body** with `UploadDataRequest` structure for direct submission

    Returns a job_id for status polling.
    """
    resolved_clinic_id = clinic_id or str(uuid.uuid4())

    # Ensure clinic exists
    clinic = db.query(Clinic).filter(Clinic.id == resolved_clinic_id).first()
    if not clinic:
        clinic = Clinic(id=resolved_clinic_id, name=clinic_name, cms_type="direct_upload")
        db.add(clinic)
        db.commit()

    job_id = str(uuid.uuid4())
    source_type = "file_upload" if file else "direct_submission"

    _jobs[job_id] = {
        "job_id": job_id,
        "status": "processing",
        "clinic_id": resolved_clinic_id,
        "source_type": source_type,
        "records_extracted": 0,
    }

    try:
        patients_data: list[dict[str, Any]] = []

        if file:
            content_type = file.content_type or ""
            filename = file.filename or "unknown"

            raw_bytes = await file.read()

            if content_type.startswith("image/"):
                try:
                    text = OCRService().extract_text(raw_bytes)
                    structured = OCRService().extract_clinical_notes(raw_bytes)
                    medications = structured.get("structured", {}).get("medications", [])
                except Exception as ocr_err:
                    logger.warning(f"OCR failed for {filename}: {ocr_err}")
                    text = f"[OCR unavailable: {ocr_err}]"
                    medications = []

                patient_id = str(uuid.uuid4())[:8]
                record: dict[str, Any] = {
                    "patient_id": patient_id,
                    "name": "",
                    "hkid": "",
                    "dob": "",
                    "gender": "",
                    "diagnoses": [],
                    "medications": medications,
                    "lab_results": [],
                    "clinical_notes": text,
                    "source_file": filename,
                    "source_type": "ocr_image",
                }
                patients_data.append(record)

            elif content_type.endswith("json") or filename.endswith(".json"):
                import json
                raw_json = json.loads(raw_bytes.decode("utf-8"))

                if isinstance(raw_json, list):
                    for item in raw_json:
                        patients_data.append(_normalize_record(item, filename))
                else:
                    patients_data.append(_normalize_record(raw_json, filename))

            elif content_type.endswith("csv") or filename.endswith(".csv"):
                import csv
                text = raw_bytes.decode("utf-8-sig")
                reader = csv.DictReader(io.StringIO(text))
                for row in reader:
                    patients_data.append(_normalize_csv_row(row, filename))
            else:
                text = raw_bytes.decode("utf-8", errors="replace")
                patient_id = str(uuid.uuid4())[:8]
                patients_data.append({
                    "patient_id": patient_id,
                    "name": "",
                    "hkid": "",
                    "dob": "",
                    "gender": "",
                    "diagnoses": [],
                    "medications": [],
                    "lab_results": [],
                    "clinical_notes": text,
                    "source_file": filename,
                    "source_type": "text_file",
                })

        else:
            raise HTTPException(status_code=400, detail="No file provided. For direct JSON submission, use POST /api/v1/upload-data/direct instead.")

        saved_count = _save_patients(db, resolved_clinic_id, patients_data)

        _jobs[job_id].update({
            "status": "completed",
            "records_extracted": saved_count,
            "data": patients_data,
        })

        return UploadDataResponse(
            job_id=job_id,
            status="processing",
            records_extracted=saved_count,
            estimated_time=3,
            source_type=source_type,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Upload-data job {job_id} failed: {exc}")
        _jobs[job_id]["status"] = "failed"
        raise HTTPException(status_code=500, detail=f"Upload-data failed: {str(exc)}")


@router.post("/upload-data/direct", response_model=UploadDataResponse)
async def upload_data_direct(request: UploadDataRequest, db: Session = Depends(get_db)):
    """Accept direct clinical data submission as JSON body (no file upload).

    Doctors or frontends can POST structured patient data directly.
    """
    resolved_clinic_id = request.clinic_id or str(uuid.uuid4())

    clinic = db.query(Clinic).filter(Clinic.id == resolved_clinic_id).first()
    if not clinic:
        clinic = Clinic(id=resolved_clinic_id, name=request.clinic_name, cms_type="direct_submission")
        db.add(clinic)
        db.commit()

    job_id = str(uuid.uuid4())

    patient_data = request.patient_data
    record = {
        "patient_id": patient_data.patient_id,
        "name": patient_data.name,
        "hkid": patient_data.hkid,
        "dob": patient_data.dob,
        "gender": patient_data.gender,
        "diagnoses": patient_data.diagnoses,
        "medications": patient_data.medications,
        "lab_results": patient_data.lab_results,
        "clinical_notes": patient_data.clinical_notes,
        "source_type": "direct_submission",
        "source_description": request.source_description,
    }

    saved_count = _save_patients(db, resolved_clinic_id, [record])

    _jobs[job_id] = {
        "job_id": job_id,
        "status": "completed",
        "clinic_id": resolved_clinic_id,
        "source_type": "direct_submission",
        "records_extracted": saved_count,
        "data": [record],
    }

    return UploadDataResponse(
        job_id=job_id,
        status="processing",
        records_extracted=saved_count,
        estimated_time=1,
        source_type="direct_submission",
    )


@router.get("/upload-data/{job_id}/status", response_model=UploadDataStatusResponse)
async def get_upload_data_status(job_id: str):
    """Poll the status of an upload-data job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return UploadDataStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        records_extracted=job.get("records_extracted", 0),
        source_type=job.get("source_type"),
        data=job.get("data", []),
    )


# ── Helpers ──────────────────────────────────────────────────────────────────


def _normalize_record(item: dict, filename: str) -> dict[str, Any]:
    """Normalize a JSON dict into a consistent patient record."""
    return {
        "patient_id": item.get("patient_id", item.get("id", str(uuid.uuid4())[:8])),
        "name": item.get("name", ""),
        "hkid": item.get("hkid", item.get("hk_id", item.get("id_number", ""))),
        "dob": item.get("dob", item.get("date_of_birth", "")),
        "gender": item.get("gender", ""),
        "diagnoses": item.get("diagnoses", []),
        "medications": item.get("medications", []),
        "lab_results": item.get("lab_results", item.get("lab_results", [])),
        "clinical_notes": item.get("clinical_notes", item.get("notes", "")),
        "source_file": filename,
        "source_type": "json_file",
    }


def _normalize_csv_row(row: dict, filename: str) -> dict[str, Any]:
    """Normalize a CSV row into a consistent patient record."""
    def parse_list_field(value: str) -> list:
        if not value:
            return []
        try:
            import json
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return [{"value": v.strip()} for v in value.split(";") if v.strip()]

    return {
        "patient_id": row.get("patient_id", row.get("id", str(uuid.uuid4())[:8])),
        "name": f"{row.get('first_name', '')} {row.get('last_name', '')}".strip(),
        "hkid": row.get("hkid", row.get("hk_id", "")),
        "dob": row.get("dob", row.get("date_of_birth", "")),
        "gender": row.get("gender", ""),
        "diagnoses": parse_list_field(row.get("diagnoses", "")),
        "medications": parse_list_field(row.get("medications", "")),
        "lab_results": parse_list_field(row.get("lab_results", "")),
        "clinical_notes": row.get("clinical_notes", row.get("notes", "")),
        "source_file": filename,
        "source_type": "csv_file",
    }


def _save_patients(db: Session, clinic_id: str, patients_data: list[dict[str, Any]]) -> int:
    """Save extracted patient records to the database. Returns count saved."""
    saved = 0
    for pdata in patients_data:
        if not pdata or not pdata.get("hkid"):
            continue

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
        saved += 1

    db.commit()
    return saved
