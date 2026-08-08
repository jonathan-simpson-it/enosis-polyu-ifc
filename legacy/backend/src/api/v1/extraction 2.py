"""Extraction endpoints: process document, review, edit, approve."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.database import get_db
from backend.src.core.models.auth import User
from backend.src.core.models.trade import Declaration, Commodity
from backend.src.core.models.translation import WCODeclaration, AuditLog
from backend.src.core.security import get_current_user
from backend.src.extraction.ner import extract_entities
from backend.src.extraction.confidence import score_extraction_confidence, needs_human_review, score_hs_code_confidence
from backend.src.extraction.vector import search_similar_hs_codes
from backend.src.schema.validator import validate_hs_code
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
    try:
        decl_uuid = uuid.UUID(declaration_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid declaration ID")

    result = await db.execute(
        select(Declaration).where(
            Declaration.id == decl_uuid,
            Declaration.org_id == current_user.org_id,
        )
    )
    decl = result.scalar_one_or_none()
    if not decl:
        raise HTTPException(status_code=404, detail="Document not found")

    raw_text = decl.raw_text or ""

    parsed_data = decl.parsed_data or {}
    structured_data = parsed_data.get("structured_data")

    entities = extract_entities(raw_text, structured_data)
    confidence_scores = score_extraction_confidence(entities, raw_text)

    labeled = entities.get("labeled_fields", {})

    # Populate declaration header fields from NER
    if labeled.get("consignor_name"):
        decl.consignor_name = labeled["consignor_name"]
    if labeled.get("consignee_name"):
        decl.consignee_name = labeled["consignee_name"]
    if labeled.get("port_of_loading"):
        decl.port_of_loading = labeled["port_of_loading"]
    if labeled.get("port_of_discharge"):
        decl.port_of_discharge = labeled["port_of_discharge"]
    if labeled.get("incoterms"):
        decl.incoterms = labeled["incoterms"].upper()
    if labeled.get("container_number"):
        decl.container_number = labeled["container_number"]
    if labeled.get("total_value"):
        decl.total_declared_value = labeled["total_value"]
    if labeled.get("gross_weight"):
        decl.gross_weight = labeled["gross_weight"]
    if labeled.get("net_weight"):
        decl.net_weight = labeled["net_weight"]
    if labeled.get("number_of_packages"):
        decl.number_of_packages = labeled["number_of_packages"]

    # Create commodity rows
    commodity_entities = entities.get("commodities", [])
    for idx, ce in enumerate(commodity_entities):
        hs = ce.get("hs_code", "")
        hs_conf = 0.85
        if hs:
            hs_conf = score_hs_code_confidence(hs, ce.get("description", ""))

        coo = ce.get("country_of_origin")
        if not coo and entities.get("countries"):
            coo = entities["countries"][0]

        commodity = Commodity(
            id=uuid.uuid4(),
            declaration_id=decl.id,
            description=ce.get("description", ""),
            hs_code=hs,
            hs_code_confidence=hs_conf,
            quantity=ce.get("quantity"),
            unit=ce.get("unit", "PCS"),
            declared_value=ce.get("declared_value"),
            weight=ce.get("weight"),
            country_of_origin=coo,
        )
        db.add(commodity)

    if not commodity_entities:
        # Fallback: create commodities from each unique HS code found in text
        seen_hs = set()
        for hs in entities.get("hs_codes", []):
            if hs not in seen_hs:
                seen_hs.add(hs)
                commodity = Commodity(
                    id=uuid.uuid4(),
                    declaration_id=decl.id,
                    hs_code=hs,
                    hs_code_confidence=score_hs_code_confidence(hs, ""),
                )
                db.add(commodity)

    decl.status = "extracted"
    decl.confidence_avg = confidence_scores.get("overall", 0.0)
    await db.commit()

    await db.refresh(decl)

    db.add(AuditLog(
        org_id=current_user.org_id,
        user_id=current_user.id,
        action="document.processed",
        resource_type="declaration",
        resource_id=declaration_id,
        details={"confidence": decl.confidence_avg, "commodities": len(commodity_entities)},
    ))
    await db.commit()

    # Fetch created commodities to return
    commod_result = await db.execute(
        select(Commodity).where(Commodity.declaration_id == decl.id)
    )
    created = commod_result.scalars().all()

    return {
        "declaration_id": declaration_id,
        "status": "extracted",
        "confidence_avg": decl.confidence_avg,
        "entities": entities,
        "confidence_scores": confidence_scores,
        "needs_review": needs_human_review(decl.confidence_avg),
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
            for c in created
        ],
        "labeled_fields": labeled,
    }


@router.put("/commodities")
async def update_commodities(
    updates: list[CommodityUpdate],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = []
    for upd in updates:
        try:
            comm_id = uuid.UUID(upd.id)
        except ValueError:
            continue

        result = await db.execute(
            select(Commodity).where(
                Commodity.id == comm_id,
                Commodity.reviewed_by == current_user.id,
            )
        )
        commodity = result.scalar_one_or_none()
        if not commodity:
            result = await db.execute(select(Commodity).where(Commodity.id == comm_id))
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
    try:
        decl_uuid = uuid.UUID(declaration_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Invalid declaration ID")

    result = await db.execute(
        select(Declaration).where(
            Declaration.id == decl_uuid,
            Declaration.org_id == current_user.org_id,
        )
    )
    decl = result.scalar_one_or_none()
    if not decl:
        raise HTTPException(status_code=404, detail="Document not found")

    decl.status = "reviewed"
    await db.commit()

    db.add(AuditLog(
        org_id=current_user.org_id,
        user_id=current_user.id,
        action="document.approved",
        resource_type="declaration",
        resource_id=declaration_id,
    ))
    await db.commit()

    return {"declaration_id": declaration_id, "status": "reviewed"}
