"""Upload-data endpoints — accept trade declaration file uploads and direct submissions."""

from __future__ import annotations

import io
import json
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Trader, Declaration
from src.schemas import (
    UploadDataRequest,
    UploadDataResponse,
    UploadDataStatusResponse,
    DeclarationData,
)
from src.services.ocr import OCRService
from src.utils.logger import logger

router = APIRouter(prefix="/api/v1", tags=["Upload Data"])

_jobs: dict[str, dict[str, Any]] = {}


@router.post("/upload-data", response_model=UploadDataResponse)
async def upload_data(
    db: Session = Depends(get_db),
    file: UploadFile | None = File(None, description="Image file (PNG/JPG) for OCR, or JSON/CSV data file"),
    trader_id: str | None = Form(None),
    trader_name: str = Form("Direct Upload"),
    source_description: str = Form(""),
):
    """Accept trade declaration file uploads.

    Accepts either:
    - **Multipart file upload** (image → OCR, or JSON/CSV → parsed data)
    - **JSON body** with `UploadDataRequest` structure for direct submission

    Returns a job_id for status polling.
    """
    resolved_trader_id = trader_id or str(uuid.uuid4())

    trader = db.query(Trader).filter(Trader.id == resolved_trader_id).first()
    if not trader:
        trader = Trader(id=resolved_trader_id, name=trader_name, source_system="direct_upload")
        db.add(trader)
        db.commit()

    job_id = str(uuid.uuid4())
    source_type = "file_upload" if file else "direct_submission"

    _jobs[job_id] = {
        "job_id": job_id,
        "status": "processing",
        "trader_id": resolved_trader_id,
        "source_type": source_type,
        "records_extracted": 0,
    }

    try:
        declarations_data: list[dict[str, Any]] = []

        if file:
            content_type = file.content_type or ""
            filename = file.filename or "unknown"

            raw_bytes = await file.read()

            if content_type.startswith("image/"):
                try:
                    text = OCRService().extract_text(raw_bytes)
                    structured = OCRService().extract_manifest_data(raw_bytes)
                    commodities = structured.get("structured", {}).get("commodities", [])
                except Exception as ocr_err:
                    logger.warning(f"OCR failed for {filename}: {ocr_err}")
                    text = f"[OCR unavailable: {ocr_err}]"
                    commodities = []

                declaration_id = str(uuid.uuid4())[:8]
                record: dict[str, Any] = {
                    "declaration_id": declaration_id,
                    "declaration_number": structured.get("structured", {}).get("invoice_number", ""),
                    "consignor_name": "",
                    "consignee_name": "",
                    "commodities": commodities,
                    "goods_items": [],
                    "measures": [],
                    "commercial_notes": text,
                    "container_number": structured.get("structured", {}).get("container_number", ""),
                    "gross_weight": structured.get("structured", {}).get("gross_weight", 0),
                    "country_of_origin": structured.get("structured", {}).get("country_of_origin", ""),
                    "source_file": filename,
                    "source_type": "ocr_image",
                }
                declarations_data.append(record)

            elif content_type.endswith("json") or filename.endswith(".json"):
                raw_json = json.loads(raw_bytes.decode("utf-8"))

                if isinstance(raw_json, list):
                    for item in raw_json:
                        declarations_data.append(_normalize_declaration_record(item, filename))
                else:
                    declarations_data.append(_normalize_declaration_record(raw_json, filename))

            elif content_type.endswith("csv") or filename.endswith(".csv"):
                import csv
                text = raw_bytes.decode("utf-8-sig")
                reader = csv.DictReader(io.StringIO(text))
                for row in reader:
                    declarations_data.append(_normalize_csv_row(row, filename))
            else:
                text = raw_bytes.decode("utf-8", errors="replace")
                declaration_id = str(uuid.uuid4())[:8]
                declarations_data.append({
                    "declaration_id": declaration_id,
                    "declaration_number": "",
                    "consignor_name": "",
                    "consignee_name": "",
                    "commodities": [],
                    "goods_items": [],
                    "measures": [],
                    "commercial_notes": text,
                    "source_file": filename,
                    "source_type": "text_file",
                })

        else:
            raise HTTPException(status_code=400, detail="No file provided. For direct JSON submission, use POST /api/v1/upload-data/direct instead.")

        saved_count = _save_declarations(db, resolved_trader_id, declarations_data)

        _jobs[job_id].update({
            "status": "completed",
            "records_extracted": saved_count,
            "data": declarations_data,
        })

        return UploadDataResponse(
            job_id=job_id,
            status="processing",
            records_extracted=saved_count,
            estimated_time=3,
            source_type=source_type,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Upload-data job {job_id} failed: {exc}")
        _jobs[job_id]["status"] = "failed"
        raise HTTPException(status_code=500, detail=f"Upload-data failed: {str(exc)}")


@router.post("/upload-data/direct", response_model=UploadDataResponse)
async def upload_data_direct(request: UploadDataRequest, db: Session = Depends(get_db)):
    """Accept direct trade declaration data submission as JSON body (no file upload)."""
    resolved_trader_id = request.trader_id or str(uuid.uuid4())

    trader = db.query(Trader).filter(Trader.id == resolved_trader_id).first()
    if not trader:
        trader = Trader(id=resolved_trader_id, name=request.trader_name, source_system="direct_submission")
        db.add(trader)
        db.commit()

    job_id = str(uuid.uuid4())

    decl_data = request.declaration_data
    record = {
        "declaration_id": decl_data.declaration_id,
        "declaration_number": decl_data.declaration_number,
        "consignor_name": decl_data.consignor_name,
        "consignor_address": decl_data.consignor_address,
        "consignee_name": decl_data.consignee_name,
        "consignee_address": decl_data.consignee_address,
        "port_of_loading": decl_data.port_of_loading,
        "port_of_discharge": decl_data.port_of_discharge,
        "incoterms": decl_data.incoterms,
        "total_declared_value": decl_data.total_declared_value,
        "gross_weight": decl_data.gross_weight,
        "net_weight": decl_data.net_weight,
        "number_of_packages": decl_data.number_of_packages,
        "container_number": decl_data.container_number,
        "country_of_origin": decl_data.country_of_origin,
        "country_of_destination": decl_data.country_of_destination,
        "transport_mode": decl_data.transport_mode,
        "declaration_date": decl_data.declaration_date,
        "commodities": decl_data.commodities,
        "goods_items": decl_data.goods_items,
        "measures": decl_data.measures,
        "commercial_notes": decl_data.commercial_notes,
        "source_type": "direct_submission",
        "source_description": request.source_description,
    }

    saved_count = _save_declarations(db, resolved_trader_id, [record])

    _jobs[job_id] = {
        "job_id": job_id,
        "status": "completed",
        "trader_id": resolved_trader_id,
        "source_type": "direct_submission",
        "records_extracted": saved_count,
        "data": [record],
    }

    return UploadDataResponse(
        job_id=job_id,
        status="processing",
        records_extracted=saved_count,
        estimated_time=1,
        source_type="direct_submission",
    )


@router.get("/upload-data/{job_id}/status", response_model=UploadDataStatusResponse)
async def get_upload_data_status(job_id: str):
    """Poll the status of an upload-data job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return UploadDataStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        records_extracted=job.get("records_extracted", 0),
        source_type=job.get("source_type"),
        data=job.get("data", []),
    )


def _normalize_declaration_record(item: dict, filename: str) -> dict[str, Any]:
    return {
        "declaration_id": item.get("declaration_id", item.get("id", str(uuid.uuid4())[:8])),
        "declaration_number": item.get("declaration_number", item.get("decl_no", "")),
        "consignor_name": item.get("consignor_name", item.get("consignor", "")),
        "consignee_name": item.get("consignee_name", item.get("consignee", "")),
        "port_of_loading": item.get("port_of_loading", ""),
        "port_of_discharge": item.get("port_of_discharge", ""),
        "incoterms": item.get("incoterms", ""),
        "total_declared_value": item.get("total_declared_value", 0),
        "gross_weight": item.get("gross_weight", item.get("gross_weight", 0)),
        "net_weight": item.get("net_weight", 0),
        "number_of_packages": item.get("number_of_packages", 1),
        "container_number": item.get("container_number", ""),
        "country_of_origin": item.get("country_of_origin", ""),
        "country_of_destination": item.get("country_of_destination", ""),
        "transport_mode": item.get("transport_mode", ""),
        "declaration_date": item.get("declaration_date", ""),
        "commodities": item.get("commodities", []),
        "goods_items": item.get("goods_items", item.get("items", [])),
        "measures": item.get("measures", []),
        "commercial_notes": item.get("commercial_notes", item.get("notes", "")),
        "source_file": filename,
        "source_type": "json_file",
    }


def _normalize_csv_row(row: dict, filename: str) -> dict[str, Any]:
    def parse_list_field(value: str) -> list:
        if not value:
            return []
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return [{"value": v.strip()} for v in value.split(";") if v.strip()]

    return {
        "declaration_id": row.get("declaration_id", row.get("id", str(uuid.uuid4())[:8])),
        "declaration_number": row.get("declaration_number", row.get("decl_no", "")),
        "consignor_name": row.get("consignor_name", row.get("consignor", "")),
        "consignee_name": row.get("consignee_name", row.get("consignee", "")),
        "port_of_loading": row.get("port_of_loading", ""),
        "port_of_discharge": row.get("port_of_discharge", ""),
        "incoterms": row.get("incoterms", ""),
        "total_declared_value": float(row.get("total_declared_value", 0)),
        "gross_weight": float(row.get("gross_weight", 0)),
        "net_weight": float(row.get("net_weight", 0)),
        "number_of_packages": int(row.get("number_of_packages", 1)),
        "container_number": row.get("container_number", ""),
        "country_of_origin": row.get("country_of_origin", ""),
        "country_of_destination": row.get("country_of_destination", ""),
        "transport_mode": row.get("transport_mode", ""),
        "declaration_date": row.get("declaration_date", ""),
        "commodities": parse_list_field(row.get("commodities", "")),
        "goods_items": parse_list_field(row.get("goods_items", "")),
        "measures": parse_list_field(row.get("measures", "")),
        "commercial_notes": row.get("commercial_notes", row.get("notes", "")),
        "source_file": filename,
        "source_type": "csv_file",
    }


def _save_declarations(db: Session, trader_id: str, declarations_data: list[dict[str, Any]]) -> int:
    saved = 0
    for ddata in declarations_data:
        if not ddata or not ddata.get("declaration_number"):
            continue

        declaration = Declaration(
            trader_id=trader_id,
            declaration_number=ddata.get("declaration_number", ""),
            consignor_name=ddata.get("consignor_name", ""),
            consignor_address=ddata.get("consignor_address", ""),
            consignee_name=ddata.get("consignee_name", ""),
            consignee_address=ddata.get("consignee_address", ""),
            port_of_loading=ddata.get("port_of_loading", ""),
            port_of_discharge=ddata.get("port_of_discharge", ""),
            incoterms=ddata.get("incoterms", ""),
            total_declared_value=ddata.get("total_declared_value", 0.0),
            gross_weight=ddata.get("gross_weight", 0.0),
            net_weight=ddata.get("net_weight", 0.0),
            number_of_packages=ddata.get("number_of_packages", 1),
            container_number=ddata.get("container_number", ""),
            country_of_origin=ddata.get("country_of_origin", ""),
            country_of_destination=ddata.get("country_of_destination", ""),
            transport_mode=ddata.get("transport_mode", ""),
            declaration_date=ddata.get("declaration_date", ""),
            commercial_notes=ddata.get("commercial_notes", ""),
        )
        db.add(declaration)
        saved += 1

    db.commit()
    return saved
