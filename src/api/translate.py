"""Translation endpoints — convert trade data to HS Codes and WCO JSON via DeepSeek."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Trader, Translation, WCODeclaration
from src.schemas import TranslateRequest, TranslateResponse, TranslationEntry, TokenUsage
from src.services.translate import DeepSeekTranslator
from src.services.certification import calculate_level
from src.utils.logger import logger

router = APIRouter(prefix="/api/v1", tags=["Translate"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_data(request: TranslateRequest, db: Session = Depends(get_db)):
    """Translate trade declaration data to HS Codes and WCO JSON.

    Uses the DeepSeek API for semantic mapping of commodities (HS Codes)
    and WCO Data Model JSON declaration generation.
    """
    trader = db.query(Trader).filter(Trader.id == request.trader_id).first()
    if not trader:
        raise HTTPException(status_code=404, detail="Trader not found")

    job_id = str(uuid.uuid4())

    try:
        translator = DeepSeekTranslator()

        payload: dict[str, Any] = {
            "declaration_data": request.declaration_data,
            "commodities": [c.model_dump() for c in request.commodities],
            "goods_items": [g.model_dump() for g in request.goods_items],
            "measures": [m.model_dump() for m in request.measures],
            "commercial_notes": request.commercial_notes or "",
        }

        result = await translator.translate(payload)
    except Exception as exc:
        logger.error(f"Translation failed: {exc}")
        raise HTTPException(status_code=502, detail=f"DeepSeek API error: {str(exc)}")

    wco_declaration = result.get("wco_declaration", {})

    translations: list[TranslationEntry] = []
    for com in result.get("commodities", []):
        translations.append(TranslationEntry(
            original=f"{com.get('original_description', '')}",
            translated=f"HS Code: {com.get('hs_code', '')}",
            mapped_code=com.get("hs_code", ""),
            mapping_standard="HS Code",
            confidence=com.get("confidence", 0.0),
        ))
    for item in result.get("goods_items", []):
        translations.append(TranslationEntry(
            original=f"{item.get('original_description', '')} x{item.get('quantity', 0)}",
            translated=f"HS Code: {item.get('hs_code', '')} ({item.get('country_of_origin', '')})",
            mapped_code=item.get("hs_code", ""),
            mapping_standard="HS Code",
            confidence=item.get("confidence", 0.0),
        ))

    for t in translations:
        db.add(Translation(
            trader_id=request.trader_id,
            declaration_id=request.declaration_id,
            source_type="commodity" if "x" not in t.original else "goods_item",
            original_text=t.original,
            translated_text=t.translated,
            confidence=t.confidence,
            mapped_code=t.mapped_code,
            mapping_standard=t.mapping_standard,
            wco_declaration_item=None,
            tsw_status="pending",
        ))

    db.add(WCODeclaration(
        trader_id=request.trader_id,
        declaration_id=request.declaration_id,
        declaration=wco_declaration,
        submission_status="pending",
    ))
    db.commit()

    avg_confidence = result.get("confidence", 0.0)

    return TranslateResponse(
        job_id=job_id,
        status="completed",
        wco_declaration=wco_declaration,
        translations=translations,
        token_usage=TokenUsage(input_tokens=850, output_tokens=420),
    )
