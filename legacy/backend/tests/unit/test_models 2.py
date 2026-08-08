"""Test ORM model creation."""

import sys
import os
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def test_organization_model():
    from backend.src.core.models.auth import Organization

    org_id = uuid.uuid4()
    org = Organization(id=org_id, name="Test Trader Ltd", br_number="BR-12345678")
    assert org.name == "Test Trader Ltd"
    assert org.br_number == "BR-12345678"
    assert org.id == org_id


def test_user_model():
    from backend.src.core.models.auth import User

    user_id = uuid.uuid4()
    user = User(id=user_id, email="test@example.com", hashed_password="hashed_pw",
                role="admin", is_active=True)
    assert user.email == "test@example.com"
    assert user.role == "admin"
    assert user.is_active is True
    assert user.id == user_id


def test_declaration_model():
    from backend.src.core.models.trade import Declaration

    decl_id = uuid.uuid4()
    decl = Declaration(
        id=decl_id,
        org_id=uuid.uuid4(),
        filename="invoice.pdf",
        file_type="pdf",
        status="uploaded",
    )
    assert decl.filename == "invoice.pdf"
    assert decl.status == "uploaded"
    assert decl.id == decl_id


def test_hs_code_model():
    from backend.src.core.models.trade import HSCode

    code = HSCode(code="8542.31.00", description="Electronic integrated circuits")
    assert code.code == "8542.31.00"
    assert code.chapter is None


def test_wco_declaration_model():
    from backend.src.core.models.translation import WCODeclaration

    wco = WCODeclaration(
        declaration_id=uuid.uuid4(),
        wco_json={"resourceType": "WCODeclaration"},
        validation_status="pending",
    )
    assert wco.wco_json["resourceType"] == "WCODeclaration"
    assert wco.validation_status == "pending"


def test_audit_log_model():
    from backend.src.core.models.translation import AuditLog

    log = AuditLog(
        org_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        action="document.uploaded",
        resource_type="declaration",
    )
    assert log.action == "document.uploaded"
    assert log.resource_type == "declaration"
