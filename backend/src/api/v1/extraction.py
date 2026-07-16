"""Extraction endpoints: process document, review, edit, approve."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.database import get_db
from backend.src.core.models.auth import User
from backend.src.core.models.trade import Declaration, Commodity
from backend.src.core.models.translation import WCODeclaration, AuditLog
from backend.src.core.security import get_current_user
from backend.src.extraction.ner import extract_entities
from backend.src.extraction.confidence import score_extraction_confidence, needs_human_review
from backend.src.utils.logger import logger

router = APIRouter(prefix="/api/v1/extraction", tags=["Extraction"])


class CommodityUpdate(BaseModel):
    id: str
    hs_code: str | None = None
    description: str | None = None
    quantity: float | None = None
    unit: str | None = None
    declared_value: float | None = None
    weight: float | None = None
    country_of_origin: str | None = None


@router.post("/process/{declaration_id}")
async def process_document(
    declaration_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Declaration).where(
            Declaration.id == declaration_id,
            Declaration.org_id == current_user.org_id,
        )
    )
    decl = result.scalar_one_or_none()
    if not decl:
        raise HTTPException(status_code=404, detail="Document not found")

    raw_text = getattr(decl, "_raw_text", "")

    entities = extract_entities(raw_text)
    confidence_scores = score_extraction_confidence(entities, raw_text)

    decl.status = "extracted"
    decl.confidence_avg = confidence_scores.get("overall", 0.0)
    await db.commit()

    await db.refresh(decl)

    await db.add(AuditLog(
        org_id=current_user.org_id,
        user_id=current_user.id,
        action="document.processed",
        resource_type="declaration",
        resource_id=declaration_id,
        details={"confidence": decl.confidence_avg},
    ))
    await db.commit()

    return {
        "declaration_id": declaration_id,
        "status": "extracted",
        "confidence_avg": decl.confidence_avg,
        "entities": entities,
        "confidence_scores": confidence_scores,
        "needs_review": needs_human_review(decl.confidence_avg),
    }


@router.put("/commodities")
async def update_commodities(
    updates: list[CommodityUpdate],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = []
    for upd in updates:
        result = await db.execute(
            select(Commodity).where(
                Commodity.id == upd.id,
                Commodity.reviewed_by == current_user.id,
            )
        )
        commodity = result.scalar_one_or_none()
        if not commodity:
            result = await db.execute(select(Commodity).where(Commodity.id == upd.id))
            commodity = result.scalar_one_or_none()
            if not commodity:
                continue

        if upd.hs_code is not None:
            commodity.hs_code = upd.hs_code
        if upd.description is not None:
            commodity.description = upd.description
        if upd.quantity is not None:
            commodity.quantity = upd.quantity
        if upd.unit is not None:
            commodity.unit = upd.unit
        if upd.declared_value is not None:
            commodity.declared_value = upd.declared_value
        if upd.weight is not None:
            commodity.weight = upd.weight
        if upd.country_of_origin is not None:
            commodity.country_of_origin = upd.country_of_origin

        commodity.reviewed = True
        commodity.reviewed_by = current_user.id
        updated.append(str(commodity.id))

    await db.commit()
    return {"updated": len(updated), "commodity_ids": updated}


@router.post("/approve/{declaration_id}")
async def approve_declaration(
    declaration_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Declaration).where(
            Declaration.id == declaration_id,
            Declaration.org_id == current_user.org_id,
        )
    )
    decl = result.scalar_one_or_none()
    if not decl:
        raise HTTPException(status_code=404, detail="Document not found")

    decl.status = "reviewed"
    await db.commit()

    await db.add(AuditLog(
        org_id=current_user.org_id,
        user_id=current_user.id,
        action="document.approved",
        resource_type="declaration",
        resource_id=declaration_id,
    ))
    await db.commit()

    return {"declaration_id": declaration_id, "status": "reviewed"}
