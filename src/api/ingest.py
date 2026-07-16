"""Data ingestion endpoints — scrape trade declarations from mock Trade Declaration System."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Trader, Declaration
from src.schemas import IngestRequest, IngestResponse, IngestStatusResponse
from src.services.scrape import TradeSystemScraper
from src.utils.logger import logger

router = APIRouter(prefix="/api/v1", tags=["Ingest"])

_jobs: dict[str, dict[str, Any]] = {}


@router.post("/ingest", response_model=IngestResponse)
async def ingest_data(request: IngestRequest, db: Session = Depends(get_db)):
    """Scrape declaration data from a Trade Declaration System.

    Kicks off an async scraping job and returns a job_id for status polling.
    """
    trader_id = request.trader_id or str(uuid.uuid4())

    trader = db.query(Trader).filter(Trader.id == trader_id).first()
    if not trader:
        trader = Trader(id=trader_id, name=request.trader_name, source_system=request.source_system)
        db.add(trader)
        db.commit()

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "processing",
        "trader_id": trader_id,
        "declarations_scraped": 0,
        "declarations_found": 0,
    }

    declaration_ids = request.declaration_ids or ["D001", "D002", "D003"]

    try:
        scraper = TradeSystemScraper()
        declarations_data = await scraper.scrape_declarations(request.source_url, declaration_ids)

        saved_count = 0
        for ddata in declarations_data:
            if not ddata or not ddata.get("declaration_number"):
                continue

            declaration = Declaration(
                trader_id=trader_id,
                declaration_number=ddata.get("declaration_number", ""),
                consignor_name=ddata.get("consignor_name", ""),
                consignee_name=ddata.get("consignee_name", ""),
                port_of_loading=ddata.get("port_of_loading", ""),
                port_of_discharge=ddata.get("port_of_discharge", ""),
                commercial_notes=ddata.get("commercial_notes", ""),
            )
            db.add(declaration)
            saved_count += 1

        db.commit()

        _jobs[job_id].update({
            "status": "completed",
            "declarations_found": len(declarations_data),
            "declarations_extracted": saved_count,
            "data": declarations_data,
        })

        return IngestResponse(
            job_id=job_id,
            status="processing",
            declarations_scraped=len(declarations_data),
            estimated_time=3,
        )

    except Exception as exc:
        logger.error(f"Ingest job {job_id} failed: {exc}")
        _jobs[job_id]["status"] = "failed"
        raise HTTPException(status_code=500, detail=f"Ingest failed: {str(exc)}")


@router.get("/ingest/{job_id}/status", response_model=IngestStatusResponse)
async def get_ingest_status(job_id: str):
    """Poll the status of an ingest job."""
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return IngestStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        declarations_found=job.get("declarations_found", 0),
        declarations_extracted=job.get("declarations_extracted", 0),
        data=job.get("data", []),
    )
