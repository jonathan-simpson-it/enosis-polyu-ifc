"""Export endpoints — WCO JSON, WCO XML, TSW payload."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.database import get_db
from backend.src.core.models.auth import User
from backend.src.core.models.trade import Declaration, Commodity
from backend.src.core.models.translation import WCODeclaration, AuditLog
from backend.src.core.security import get_current_user
from backend.src.schema.registry import registry
from backend.src.schema.wco import build_wco_json, build_wco_xml  # registers wco_json, wco_xml
from backend.src.schema.tsw import build_tsw_payload  # registers tsw_json
from backend.src.schema.validator import validate_tsw_ready
from backend.src.schema.rules import check_required_fields
from backend.src.services.tsw_client import MockTSWClient

router = APIRouter(prefix="/api/v1/export", tags=["Export"])

_tsw_client = MockTSWClient()


async def _get_declaration_and_commodities(
    declaration_id: str, org_id: uuid.UUID, db: AsyncSession
) -> tuple[Declaration, list[dict]]:
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

    commodities_result = await db.execute(
        select(Commodity).where(Commodity.declaration_id == decl.id)
    )
    commodities = commodities_result.scalars().all()

    decl_data = {
        "declaration_number": decl.decl_number or str(decl.id)[:12].upper(),
        "consignor_name": decl.consignor_name or "",
        "consignor_address": decl.consignor_address or "",
        "consignee_name": decl.consignee_name or "",
        "consignee_address": decl.consignee_address or "",
        "port_of_loading": decl.port_of_loading or "",
        "port_of_discharge": decl.port_of_discharge or "",
        "incoterms": decl.incoterms or "",
        "container_number": decl.container_number or "",
        "number_of_packages": decl.number_of_packages or 1,
        "gross_weight": decl.gross_weight or 0,
        "net_weight": decl.net_weight or 0,
        "transport_mode": decl.transport_mode or "Sea",
        "declaration_date": str(decl.created_at.date()) if decl.created_at else "",
    }

    commodity_dicts = [
        {
            "description": c.description or "",
            "hs_code": c.hs_code or "",
            "quantity": c.quantity,
            "unit": c.unit or "PCS",
            "declared_value": c.declared_value,
            "weight": c.weight,
            "country_of_origin": c.country_of_origin or "",
        }
        for c in commodities
    ]

    return decl, decl_data, commodity_dicts


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
    decl, decl_data, commodity_dicts = await _get_declaration_and_commodities(
        declaration_id, current_user.org_id, db
    )

    try:
        builder = registry.get(format)
        exported = builder(decl_data, commodity_dicts)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # validate_tsw_ready expects WCO Declaration structure
    if format == "wco_json":
        validation = validate_tsw_ready(exported)
    elif format == "tsw_json":
        # TSW wraps WCO under declaration key
        inner = exported.get("declaration", {})
        validation = validate_tsw_ready(inner)
    elif format == "wco_xml":
        validation = {"valid": True, "errors": []}
    else:
        validation = {"valid": True, "errors": []}

    wco_json_value = exported if format == "wco_json" else ({})
    wco_xml_value = exported if format == "wco_xml" else (None)

    wco_record = WCODeclaration(
        declaration_id=decl.id,
        wco_json=wco_json_value if isinstance(wco_json_value, dict) else {},
        wco_xml=wco_xml_value if isinstance(wco_xml_value, str) else None,
        validation_status="valid" if validation["valid"] else "invalid",
        validation_errors=validation.get("errors"),
    )
    db.add(wco_record)

    db.add(AuditLog(
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
    decl, decl_data, commodity_dicts = await _get_declaration_and_commodities(
        declaration_id, current_user.org_id, db
    )

    tsw_payload = build_tsw_payload(decl_data, commodity_dicts)

    rules_check = check_required_fields(decl_data)
    warnings = []
    if not rules_check["valid"]:
        warnings = rules_check["missing"]
        # For mock submission, warn but proceed

    result = await _tsw_client.submit(tsw_payload, consent=True)
    decl.status = "submitted"
    await db.commit()

    db.add(AuditLog(
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
