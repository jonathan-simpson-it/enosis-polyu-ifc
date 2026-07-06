"""SQLAlchemy ORM models for Enosis v0."""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, JSON, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def generate_uuid() -> str:
    """Generate a UUID4 string."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Return current UTC datetime."""
    from datetime import timezone
    return datetime.now(timezone.utc)


class Clinic(Base):
    """A clinic enrolled in the Enosis platform."""

    __tablename__ = "clinics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    cms_type = Column(String(100), default="mock")
    certification_level = Column(String(20), default="none")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class Patient(Base):
    """A patient record scraped from a clinic CMS."""

    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    clinic_id = Column(String(36), nullable=False, index=True)
    hkid = Column(String(20), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    dob = Column(String(10))
    gender = Column(String(1))
    created_at = Column(DateTime, default=utcnow)


class Translation(Base):
    """A translation record mapping clinical data to standard codes."""

    __tablename__ = "translations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    clinic_id = Column(String(36), nullable=False, index=True)
    patient_id = Column(String(36), nullable=False, index=True)
    source_type = Column(String(50))  # diagnosis, medication, lab, note
    original_text = Column(String)
    translated_text = Column(String)
    confidence = Column(Float)
    mapped_code = Column(String(50))
    mapping_standard = Column(String(50))  # ICD-10, SNOMED-CT
    fhir_resource = Column(JSON)
    ehealth_status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=utcnow)


class FHIRBundle(Base):
    """A FHIR R5 bundle ready for eHealth+ upload."""

    __tablename__ = "fhir_bundles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    clinic_id = Column(String(36), nullable=False, index=True)
    patient_id = Column(String(36), nullable=False, index=True)
    bundle = Column(JSON, nullable=False)
    upload_status = Column(String(20), default="pending")
    ehealth_reference = Column(String(255))
    created_at = Column(DateTime, default=utcnow)


class CertificationTracking(Base):
    """Tracks certification progress for each clinic."""

    __tablename__ = "certification_tracking"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    clinic_id = Column(String(36), nullable=False, unique=True, index=True)
    records_uploaded = Column(Integer, default=0)
    accuracy_rate = Column(Float, default=0.0)
    current_level = Column(String(20), default="none")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
