"""Trade declaration & commodity models with pgvector support."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from backend.src.core.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class HSCode(Base):
    __tablename__ = "hs_codes"

    code = Column(String(12), primary_key=True)
    description = Column(Text, nullable=False)
    chapter = Column(String(2))
    heading = Column(String(4))
    subheading = Column(String(6))
    embedding = Column(Vector(384))


class Declaration(Base):
    __tablename__ = "declarations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    filename = Column(String(500))
    file_type = Column(String(20))
    file_size = Column(Integer)
    status = Column(String(30), default="uploaded")
    confidence_avg = Column(Float, default=0.0)
    decl_number = Column(String(50))
    consignor_name = Column(String(255))
    consignor_address = Column(Text)
    consignee_name = Column(String(255))
    consignee_address = Column(Text)
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
    commercial_notes = Column(Text)
    created_at = Column(DateTime, default=_utcnow)

    commodities = relationship("Commodity", back_populates="declaration", cascade="all, delete-orphan")


class Commodity(Base):
    __tablename__ = "commodities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    declaration_id = Column(UUID(as_uuid=True), ForeignKey("declarations.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text)
    hs_code = Column(String(20))
    hs_code_confidence = Column(Float)
    quantity = Column(Float)
    unit = Column(String(10))
    declared_value = Column(Float)
    weight = Column(Float)
    country_of_origin = Column(String(2))
    reviewed = Column(Boolean, default=False)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    embedding = Column(Vector(384))

    declaration = relationship("Declaration", back_populates="commodities")
