"""Translation endpoints — convert clinical data to FHIR R5 via DeepSeek."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Clinic, Translation, FHIRBundle
from src.schemas import TranslateRequest, TranslateResponse, TranslationEntry, TokenUsage
from src.services.translate import DeepSeekTranslator
from src.services.certification import calculate_level
from src.utils.logger import logger

router = APIRouter(prefix="/api/v1", tags=["Translate"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_data(request: TranslateRequest, db: Session = Depends(get_db)):
    """Translate clinical data to standard codes and FHIR R5.

    Uses the DeepSeek API for semantic mapping of diagnoses (ICD-10),
    medications (SNOMED-CT/WHO-ATC), and FHIR R5 resource generation.
    """
    # Validate clinic
    clinic = db.query(Clinic).filter(Clinic.id == request.clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    job_id = str(uuid.uuid4())

    try:
        translator = DeepSeekTranslator()

        # Build patient data payload
        payload: dict[str, Any] = {
            "patient_data": request.patient_data,
            "diagnoses": [d.model_dump() for d in request.diagnoses],
            "medications": [m.model_dump() for m in request.medications],
            "lab_results": [l.model_dump() for l in request.lab_results],
            "clinical_notes": request.clinical_notes or "",
        }

        result = await translator.translate(payload)
    except Exception as exc:
        logger.error(f"Translation failed: {exc}")
        raise HTTPException(status_code=502, detail=f"DeepSeek API error: {str(exc)}")

    fhir_bundle = result.get("fhir_bundle", {})

    # Build translation entries
    translations: list[TranslationEntry] = []
    for diag in result.get("diagnoses", []):
        translations.append(TranslationEntry(
            original=f"{diag.get('original_code', '')} - {diag.get('original_description', '')}",
            translated=f"ICD-10: {diag.get('icd10_code', '')}",
            mapped_code=diag.get("icd10_code", ""),
            mapping_standard="ICD-10",
            confidence=diag.get("confidence", 0.0),
        ))
    for med in result.get("medications", []):
        translations.append(TranslationEntry(
            original=f"{med.get('original_name', '')} {med.get('dosage', '')} {med.get('frequency', '')}".strip(),
            translated=f"SNOMED-CT: {med.get('snomed_code', '')} ({med.get('snomed_name', '')})",
            mapped_code=med.get("snomed_code", ""),
            mapping_standard="SNOMED-CT",
            confidence=med.get("confidence", 0.0),
        ))

    # Save translations to DB
    for t in translations:
        db.add(Translation(
            clinic_id=request.clinic_id,
            patient_id=request.patient_id,
            source_type="diagnosis" if t.mapping_standard == "ICD-10" else "medication",
            original_text=t.original,
            translated_text=t.translated,
            confidence=t.confidence,
            mapped_code=t.mapped_code,
            mapping_standard=t.mapping_standard,
            fhir_resource=None,
            ehealth_status="pending",
        ))

    # Save FHIR bundle
    db.add(FHIRBundle(
        clinic_id=request.clinic_id,
        patient_id=request.patient_id,
        bundle=fhir_bundle,
        upload_status="pending",
    ))
    db.commit()

    avg_confidence = result.get("confidence", 0.0)

    return TranslateResponse(
        job_id=job_id,
        status="completed",
        fhir_bundle=fhir_bundle,
        translations=translations,
        token_usage=TokenUsage(input_tokens=850, output_tokens=420),
    )
