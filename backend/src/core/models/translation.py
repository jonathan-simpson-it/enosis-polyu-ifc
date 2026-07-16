"""Translation & audit models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from backend.src.core.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class WCODeclaration(Base):
    __tablename__ = "wco_declarations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    declaration_id = Column(UUID(as_uuid=True), ForeignKey("declarations.id"), nullable=False, index=True)
    wco_json = Column(JSONB, nullable=False)
    wco_xml = Column(Text, nullable=True)
    validation_status = Column(String(20), default="pending")
    validation_errors = Column(JSONB, nullable=True)
    tsw_reference = Column(String(50))
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    declaration = relationship("Declaration")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(String(100))
    details = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
