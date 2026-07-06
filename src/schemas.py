"""Pydantic request/response schemas for Enosis v0 API."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Health ────────────────────────────────────────────────────────────────────


class ServiceStatus(BaseModel):
    database: str = "connected"
    deepseek_api: str = "available"


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "v0-hackathon"
    services: ServiceStatus = ServiceStatus()


# ── Ingest ────────────────────────────────────────────────────────────────────


class IngestRequest(BaseModel):
    clinic_id: Optional[str] = None
    clinic_name: str = "Central Clinic"
    cms_type: str = "mock"
    cms_url: str = "http://localhost:8080"
    patient_ids: Optional[list[str]] = None


class IngestResponse(BaseModel):
    job_id: str
    status: str = "processing"
    patients_scraped: int = 0
    estimated_time: int = 10


class PatientData(BaseModel):
    patient_id: str
    name: str = ""
    hkid: str = ""
    dob: str = ""
    gender: str = ""
    diagnoses: list[dict[str, str]] = Field(default_factory=list)
    medications: list[dict[str, str]] = Field(default_factory=list)
    lab_results: list[dict[str, str]] = Field(default_factory=list)
    clinical_notes: str = ""


class IngestStatusResponse(BaseModel):
    job_id: str
    status: str = "pending"
    patients_found: int = 0
    patients_extracted: int = 0
    data: list[dict[str, Any]] = Field(default_factory=list)


# ── Translate ─────────────────────────────────────────────────────────────────


class DiagnosisInput(BaseModel):
    code: Optional[str] = ""
    description: str = ""


class MedicationInput(BaseModel):
    name: str
    dosage: Optional[str] = ""
    frequency: Optional[str] = ""


class LabResultInput(BaseModel):
    test: str
    value: str
    unit: Optional[str] = ""
    reference: Optional[str] = ""


class TranslateRequest(BaseModel):
    clinic_id: str
    patient_id: str
    patient_data: dict[str, Any]
    diagnoses: list[DiagnosisInput] = Field(default_factory=list)
    medications: list[MedicationInput] = Field(default_factory=list)
    lab_results: list[LabResultInput] = Field(default_factory=list)
    clinical_notes: Optional[str] = ""


class TranslationEntry(BaseModel):
    original: str
    translated: str
    mapped_code: str
    mapping_standard: str
    confidence: float


class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0


class TranslateResponse(BaseModel):
    job_id: str
    status: str = "completed"
    fhir_bundle: dict[str, Any] = Field(default_factory=dict)
    translations: list[TranslationEntry] = Field(default_factory=list)
    token_usage: Optional[TokenUsage] = None


# ── Upload ────────────────────────────────────────────────────────────────────


class UploadRequest(BaseModel):
    clinic_id: str
    patient_id: str
    fhir_bundle: dict[str, Any]
    patient_consent: bool = True


class UploadResponse(BaseModel):
    upload_id: str
    status: str = "submitted"
    ehealth_reference: str
    message: str = "Successfully uploaded to eHealth+ (mock)"


class UploadStatusResponse(BaseModel):
    upload_id: str
    status: str
    ehealth_reference: Optional[str] = None
    uploaded_at: Optional[str] = None


# ── Certification ─────────────────────────────────────────────────────────────


class NextLevel(BaseModel):
    level: Optional[str] = None
    name: Optional[str] = None
    records_required: Optional[int] = None
    accuracy_required: Optional[float] = None
    achieved: bool = False


class LevelHistory(BaseModel):
    level: str
    achieved: bool
    date: Optional[str] = None


class CertificationResponse(BaseModel):
    clinic_id: str
    clinic_name: str
    current_level: str = "none"
    level_name: Optional[str] = None
    records_uploaded: int = 0
    accuracy_rate: float = 0.0
    badge_url: Optional[str] = None
    next_level: Optional[NextLevel] = None
    progress: float = 0.0
    levels: list[LevelHistory] = Field(default_factory=list)


# ── Error ─────────────────────────────────────────────────────────────────────


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
