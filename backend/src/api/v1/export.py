"""Export endpoints — WCO JSON, WCO XML, CSV, TSW payload."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.database import get_db
from backend.src.core.models.auth import User
from backend.src.core.models.trade import Declaration, Commodity
from backend.src.core.models.translation import WCODeclaration, AuditLog
from backend.src.core.security import get_current_user
from backend.src.schema.registry import registry
from backend.src.schema.validator import validate_tsw_ready
from backend.src.schema.rules import check_required_fields
from backend.src.services.tsw_client import MockTSWClient

router = APIRouter(prefix="/api/v1/export", tags=["Export"])

_tsw_client = MockTSWClient()


@router.get("/formats")
async def list_formats():
    return {"formats": registry.list()}


@router.post("/{declaration_id}")
async def export_declaration(
    declaration_id: str,
    format: str = Query("wco_json", description="Export format"),
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

    commodities_result = await db.execute(
        select(Commodity).where(Commodity.declaration_id == declaration_id)
    )
    commodities = commodities_result.scalars().all()

    decl_data = {
        "declaration_number": decl.decl_number or str(decl.id)[:12].upper(),
        "consignor_name": decl.consignor_name,
        "consignor_address": decl.consignor_address,
        "consignee_name": decl.consignee_name,
        "consignee_address": decl.consignee_address,
        "port_of_loading": decl.port_of_loading,
        "port_of_discharge": decl.port_of_discharge,
        "incoterms": decl.incoterms,
        "container_number": decl.container_number,
        "number_of_packages": decl.number_of_packages,
        "gross_weight": decl.gross_weight,
        "net_weight": decl.net_weight,
        "transport_mode": decl.transport_mode,
        "declaration_date": str(decl.created_at.date()) if decl.created_at else "",
    }

    commodity_dicts = [
        {
            "id": str(c.id),
            "description": c.description,
            "hs_code": c.hs_code,
            "quantity": c.quantity,
            "unit": c.unit,
            "declared_value": c.declared_value,
            "weight": c.weight,
            "country_of_origin": c.country_of_origin,
        }
        for c in commodities
    ]

    try:
        builder = registry.get(format)
        exported = builder(decl_data, commodity_dicts)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    validation = validate_tsw_ready(exported) if format in ("wco_json", "wco_xml", "tsw_json") else {"valid": True}

    wco_record = WCODeclaration(
        declaration_id=decl.id,
        wco_json=exported if format == "wco_json" else {},
        validation_status="valid" if validation["valid"] else "invalid",
        validation_errors=validation.get("errors"),
    )
    db.add(wco_record)

    await db.add(AuditLog(
        org_id=current_user.org_id,
        user_id=current_user.id,
        action="document.exported",
        resource_type="declaration",
        resource_id=declaration_id,
        details={"format": format, "valid": validation["valid"]},
    ))
    await db.commit()

    return {
        "declaration_id": declaration_id,
        "format": format,
        "export": exported,
        "validation": validation,
    }


@router.post("/{declaration_id}/submit")
async def submit_to_tsw(
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

    commodities_result = await db.execute(
        select(Commodity).where(Commodity.declaration_id == declaration_id)
    )
    commodities = commodities_result.scalars().all()

    decl_data = {
        "declaration_number": decl.decl_number or str(decl.id)[:12].upper(),
        "consignor_name": decl.consignor_name,
        "consignee_name": decl.consignee_name,
        "port_of_loading": decl.port_of_loading,
        "port_of_discharge": decl.port_of_discharge,
    }

    from backend.src.schema.tsw import build_tsw_payload

    commodity_dicts = [
        {"description": c.description, "hs_code": c.hs_code,
         "quantity": c.quantity, "declared_value": c.declared_value,
         "weight": c.weight, "country_of_origin": c.country_of_origin}
        for c in commodities
    ]

    tsw_payload = build_tsw_payload(decl_data, commodity_dicts)

    rules_check = check_required_fields(decl_data)
    if not rules_check["valid"]:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {rules_check['missing']}")

    result = await _tsw_client.submit(tsw_payload, consent=True)

    decl.status = "submitted"

    await db.add(AuditLog(
        org_id=current_user.org_id,
        user_id=current_user.id,
        action="document.submitted",
        resource_type="declaration",
        resource_id=declaration_id,
        details={"tsw_reference": result["tsw_reference"]},
    ))
    await db.commit()

    return {
        "declaration_id": declaration_id,
        "status": "submitted",
        "tsw_reference": result["tsw_reference"],
        "submission_id": result["submission_id"],
    }
