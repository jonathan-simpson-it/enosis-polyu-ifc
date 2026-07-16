"""SQLAlchemy ORM models for Enosis — Trading Domain."""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, JSON, Integer, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    from datetime import timezone
    return datetime.now(timezone.utc)


class Trader(Base):
    """A trader/business enrolled in the Enosis platform for TSW submissions."""

    __tablename__ = "traders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    source_system = Column(String(100), default="mock_trade")
    trader_reg_number = Column(String(50), nullable=True)
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    certification_level = Column(String(20), default="none")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class Declaration(Base):
    """A trade declaration / shipment record ingested from a trade system."""

    __tablename__ = "declarations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trader_id = Column(String(36), nullable=False, index=True)
    declaration_number = Column(String(50), nullable=False)
    consignor_name = Column(String(255))
    consignor_address = Column(String(500))
    consignee_name = Column(String(255))
    consignee_address = Column(String(500))
    port_of_loading = Column(String(100))
    port_of_discharge = Column(String(100))
    incoterms = Column(String(10))
    declared_currency = Column(String(3), default="HKD")
    total_declared_value = Column(Float, default=0.0)
    gross_weight = Column(Float, default=0.0)
    net_weight = Column(Float, default=0.0)
    number_of_packages = Column(Integer, default=1)
    container_number = Column(String(50))
    country_of_origin = Column(String(100))
    country_of_destination = Column(String(100))
    transport_mode = Column(String(50))
    declaration_date = Column(String(10))
    commercial_notes = Column(Text)
    created_at = Column(DateTime, default=utcnow)


class Translation(Base):
    """A translation record mapping trade data to standard codes (HS, WCO)."""

    __tablename__ = "translations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trader_id = Column(String(36), nullable=False, index=True)
    declaration_id = Column(String(36), nullable=False, index=True)
    source_type = Column(String(50))
    original_text = Column(String)
    translated_text = Column(String)
    confidence = Column(Float)
    mapped_code = Column(String(50))
    mapping_standard = Column(String(50))
    wco_declaration_item = Column(JSON)
    tsw_status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=utcnow)


class WCODeclaration(Base):
    """A WCO JSON declaration ready for TSW Phase 3 submission."""

    __tablename__ = "wco_declarations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trader_id = Column(String(36), nullable=False, index=True)
    declaration_id = Column(String(36), nullable=False, index=True)
    declaration = Column(JSON, nullable=False)
    submission_status = Column(String(20), default="pending")
    tsw_reference = Column(String(255))
    created_at = Column(DateTime, default=utcnow)


class CertificationTracking(Base):
    """Tracks certification progress for each trader."""

    __tablename__ = "certification_tracking"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trader_id = Column(String(36), nullable=False, unique=True, index=True)
    records_uploaded = Column(Integer, default=0)
    accuracy_rate = Column(Float, default=0.0)
    current_level = Column(String(20), default="none")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
