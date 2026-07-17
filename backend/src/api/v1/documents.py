"""Document management endpoints: upload, list, get, update, delete."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.database import get_db
from backend.src.core.models.auth import User
from backend.src.core.models.trade import Declaration, Commodity
from backend.src.core.security import get_current_user
from backend.src.core.config import settings
from backend.src.ingestion.parser import parse_document
from backend.src.ingestion.sanitizer import validate_upload, redact_pii
from backend.src.utils.logger import logger

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])


async def _get_declaration(declaration_id: str, org_id: uuid.UUID, db: AsyncSession) -> Declaration:
    try:
        decl_uuid = uuid.UUID(declaration_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid declaration ID")
    result = await db.execute(
        select(Declaration).where(
            Declaration.id == decl_uuid,
            Declaration.org_id == org_id,
        )
    )
    decl = result.scalar_one_or_none()
    if not decl:
        raise HTTPException(status_code=404, detail="Document not found")
    return decl


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.org_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    raw_bytes = await file.read()

    validation = validate_upload(raw_bytes, file.filename or "unknown", settings.upload_max_size_mb)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail="; ".join(validation["errors"]))

    parsed = await parse_document(raw_bytes, file.filename or "unknown", file.content_type)

    raw_text = parsed["raw_text"]
    redacted = redact_pii(raw_text)
    parsed_data = {
        "tables": parsed.get("tables", []),
        "structured_data": parsed.get("structured_data", {}),
        "file_type": parsed["file_type"],
    }

    decl_id = uuid.uuid4()
    decl = Declaration(
        id=decl_id,
        org_id=current_user.org_id,
        user_id=current_user.id,
        filename=file.filename,
        file_type=parsed["file_type"],
        file_size=validation["file_size"],
        status="processing",
        raw_text=redacted,
        parsed_data=parsed_data,
    )
    db.add(decl)
    await db.commit()

    logger.info(f"Document uploaded: {decl_id} ({file.filename})")

    return {
        "declaration_id": str(decl_id),
        "filename": file.filename,
        "file_type": parsed["file_type"],
        "status": "processing",
        "char_count": len(redacted),
        "has_tables": len(parsed.get("tables", [])) > 0,
        "structured_fields": list(parsed.get("structured_data", {}).keys()),
    }


@router.get("")
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.org_id:
        return {"documents": []}

    result = await db.execute(
        select(Declaration)
        .where(Declaration.org_id == current_user.org_id)
        .order_by(Declaration.created_at.desc())
        .limit(100)
    )
    decls = result.scalars().all()

    return {
        "documents": [
            {
                "id": str(d.id),
                "filename": d.filename,
                "file_type": d.file_type,
                "status": d.status,
                "confidence_avg": d.confidence_avg,
                "created_at": str(d.created_at),
            }
            for d in decls
        ]
    }


@router.get("/{declaration_id}")
async def get_document(
    declaration_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    decl = await _get_declaration(declaration_id, current_user.org_id, db)

    commodities_result = await db.execute(
        select(Commodity).where(Commodity.declaration_id == decl.id)
    )
    commodities = commodities_result.scalars().all()

    return {
        "id": str(decl.id),
        "filename": decl.filename,
        "file_type": decl.file_type,
        "status": decl.status,
        "confidence_avg": decl.confidence_avg,
        "decl_number": decl.decl_number,
        "consignor_name": decl.consignor_name,
        "consignee_name": decl.consignee_name,
        "port_of_loading": decl.port_of_loading,
        "port_of_discharge": decl.port_of_discharge,
        "incoterms": decl.incoterms,
        "total_declared_value": decl.total_declared_value,
        "gross_weight": decl.gross_weight,
        "net_weight": decl.net_weight,
        "country_of_origin": decl.country_of_origin,
        "container_number": decl.container_number,
        "number_of_packages": decl.number_of_packages,
        "declared_currency": decl.declared_currency,
        "transport_mode": decl.transport_mode,
        "commercial_notes": decl.commercial_notes,
        "created_at": str(decl.created_at),
        "commodities": [
            {
                "id": str(c.id),
                "description": c.description,
                "hs_code": c.hs_code,
                "hs_code_confidence": c.hs_code_confidence,
                "quantity": c.quantity,
                "unit": c.unit,
                "declared_value": c.declared_value,
                "weight": c.weight,
                "country_of_origin": c.country_of_origin,
                "reviewed": c.reviewed,
            }
            for c in commodities
        ],
    }


class DeclarationUpdate(BaseModel):
    consignor_name: str | None = None
    consignor_address: str | None = None
    consignee_name: str | None = None
    consignee_address: str | None = None
    port_of_loading: str | None = None
    port_of_discharge: str | None = None
    incoterms: str | None = None
    total_declared_value: float | None = None
    gross_weight: float | None = None
    net_weight: float | None = None
    container_number: str | None = None
    number_of_packages: int | None = None
    transport_mode: str | None = None
    commercial_notes: str | None = None


@router.patch("/{declaration_id}")
async def update_document(
    declaration_id: str,
    updates: DeclarationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    decl = await _get_declaration(declaration_id, current_user.org_id, db)
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(decl, field, value)
    await db.commit()
    return {"status": "updated", "id": declaration_id}


@router.delete("/{declaration_id}")
async def delete_document(
    declaration_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    decl = await _get_declaration(declaration_id, current_user.org_id, db)
    await db.delete(decl)
    await db.commit()
    return {"status": "deleted", "id": declaration_id}
