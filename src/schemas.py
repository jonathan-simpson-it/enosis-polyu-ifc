"""Pydantic request/response schemas for Enosis — Trading Domain."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Health ────────────────────────────────────────────────────────────────────


class ServiceStatus(BaseModel):
    database: str = "connected"
    deepseek_api: str = "available"


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "v0-hackathon-trade"
    services: ServiceStatus = ServiceStatus()


# ── Ingest ────────────────────────────────────────────────────────────────────


class IngestRequest(BaseModel):
    trader_id: Optional[str] = None
    trader_name: str = "GBA Trading Ltd"
    source_system: str = "mock_trade"
    source_url: str = "http://localhost:8080"
    declaration_ids: Optional[list[str]] = None


class IngestResponse(BaseModel):
    job_id: str
    status: str = "processing"
    declarations_scraped: int = 0
    estimated_time: int = 10


class DeclarationData(BaseModel):
    declaration_id: str = ""
    declaration_number: str = ""
    consignor_name: str = ""
    consignor_address: str = ""
    consignee_name: str = ""
    consignee_address: str = ""
    port_of_loading: str = ""
    port_of_discharge: str = ""
    incoterms: str = ""
    total_declared_value: float = 0.0
    gross_weight: float = 0.0
    net_weight: float = 0.0
    number_of_packages: int = 1
    container_number: str = ""
    country_of_origin: str = ""
    country_of_destination: str = ""
    transport_mode: str = ""
    declaration_date: str = ""
    commodities: list[dict[str, Any]] = Field(default_factory=list)
    goods_items: list[dict[str, Any]] = Field(default_factory=list)
    measures: list[dict[str, Any]] = Field(default_factory=list)
    commercial_notes: str = ""


class IngestStatusResponse(BaseModel):
    job_id: str
    status: str = "pending"
    declarations_found: int = 0
    declarations_extracted: int = 0
    data: list[dict[str, Any]] = Field(default_factory=list)


# ── Translate ─────────────────────────────────────────────────────────────────


class CommodityInput(BaseModel):
    description: str = ""
    hs_code_hint: Optional[str] = ""


class GoodsItemInput(BaseModel):
    description: str
    quantity: Optional[float] = 0.0
    unit: Optional[str] = ""
    declared_value: Optional[float] = 0.0
    weight: Optional[float] = 0.0
    country_of_origin: Optional[str] = ""


class MeasureInput(BaseModel):
    measure_type: str
    value: float = 0.0
    unit: Optional[str] = ""
    qualifier: Optional[str] = ""


class TranslateRequest(BaseModel):
    trader_id: str
    declaration_id: str
    declaration_data: dict[str, Any]
    commodities: list[CommodityInput] = Field(default_factory=list)
    goods_items: list[GoodsItemInput] = Field(default_factory=list)
    measures: list[MeasureInput] = Field(default_factory=list)
    commercial_notes: Optional[str] = ""


class TranslationEntry(BaseModel):
    original: str
    translated: str
    mapped_code: str
    mapping_standard: str
    confidence: float


class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0


class TranslateResponse(BaseModel):
    job_id: str
    status: str = "completed"
    wco_declaration: dict[str, Any] = Field(default_factory=dict)
    translations: list[TranslationEntry] = Field(default_factory=list)
    token_usage: Optional[TokenUsage] = None


# ── Upload ────────────────────────────────────────────────────────────────────


class UploadRequest(BaseModel):
    trader_id: str
    declaration_id: str
    wco_declaration: dict[str, Any]
    trader_consent: bool = True


class UploadResponse(BaseModel):
    upload_id: str
    status: str = "submitted"
    tsw_reference: str
    message: str = "Successfully submitted to HK TSW Phase 3 (mock)"


class UploadStatusResponse(BaseModel):
    upload_id: str
    status: str
    tsw_reference: Optional[str] = None
    submitted_at: Optional[str] = None


# ── Certification ─────────────────────────────────────────────────────────────


class NextLevel(BaseModel):
    level: Optional[str] = None
    name: Optional[str] = None
    records_required: Optional[int] = None
    accuracy_required: Optional[float] = None
    achieved: bool = False


class LevelHistory(BaseModel):
    level: str
    achieved: bool
    date: Optional[str] = None


class CertificationResponse(BaseModel):
    trader_id: str
    trader_name: str
    current_level: str = "none"
    level_name: Optional[str] = None
    declarations_submitted: int = 0
    accuracy_rate: float = 0.0
    badge_url: Optional[str] = None
    next_level: Optional[NextLevel] = None
    progress: float = 0.0
    levels: list[LevelHistory] = Field(default_factory=list)


# ── Upload Data (Direct Submission / File Upload) ─────────────────────────────


class UploadDataRequest(BaseModel):
    trader_id: Optional[str] = None
    trader_name: str = "Direct Upload"
    source_description: str = "Direct trade data submission"
    declaration_data: DeclarationData


class UploadDataResponse(BaseModel):
    job_id: str
    status: str = "processing"
    records_extracted: int = 0
    estimated_time: int = 5
    source_type: str = "direct_submission"


class UploadDataStatusResponse(BaseModel):
    job_id: str
    status: str = "pending"
    records_extracted: int = 0
    source_type: Optional[str] = None
    data: list[dict[str, Any]] = Field(default_factory=list)


# ── Error ─────────────────────────────────────────────────────────────────────


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
