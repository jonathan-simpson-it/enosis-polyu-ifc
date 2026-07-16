"""DeepSeek API integration for trade data translation."""

from __future__ import annotations

import json
from typing import Any

import httpx

from src.config import settings
from src.schemas import CommodityInput, GoodsItemInput, MeasureInput
from src.utils.logger import logger


SYSTEM_PROMPT = """You are a trade data translator. Map commercial commodity data to standard coding systems (HS Codes - Harmonized System, WCO Data Model) and output WCO JSON declarations. Return ONLY valid JSON.

Required output format:
{
    "declaration_header": {
        "declaration_number": "DEC-2026-001",
        "function_code": "IM",
        "issue_date": "2026-07-16",
        "currency": "HKD"
    },
    "commodities": [
        {
            "original_description": "Aluminium heat-sink profiles",
            "hs_code": "7604.29.90",
            "hs_code_description": "Aluminium profiles, not further worked than extruded",
            "hs_chapter": "76",
            "confidence": 0.95
        }
    ],
    "goods_items": [
        {
            "original_description": "Industrial aluminium heat sinks - 1000 pcs",
            "quantity": 1000,
            "unit": "PCE",
            "declared_value": 50000.0,
            "weight": 450.0,
            "country_of_origin": "CN",
            "hs_code": "7604.29.90",
            "confidence": 0.93
        }
    ],
    "wco_declaration": {
        "resourceType": "WCODeclaration",
        "type": "customs_declaration",
        "specification": "WCO Data Model v3.11",
        "declaration": {
            "Declaration": {...},
            "GoodsShipment": {...}
        }
    },
    "confidence": 0.94
}

Rules:
1. Map ALL commodities to HS Codes (6-10 digit Harmonized System codes).
2. Map ALL goods items with quantity, value, weight, and country of origin.
3. Create complete WCO JSON declaration structure.
4. Use realistic confidence scores (0.85-0.99) based on how confident you are in each mapping.
5. Return ONLY the JSON object — no markdown, no explanation."""


class DeepSeekTranslator:
    """Translates trade data using the DeepSeek API."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        self.api_key = api_key or settings.deepseek_api_key
        self.base_url = base_url or settings.deepseek_base_url
        self.model = model or settings.deepseek_model

    async def translate(self, trade_data: dict[str, Any]) -> dict[str, Any]:
        """Translate trade data to HS Codes and WCO JSON declaration.

        Args:
            trade_data: Raw trade data including declaration data, commodities,
                        goods items, measures, and commercial notes.

        Returns:
            Parsed translation result with WCO declaration.
        """
        prompt = self._build_prompt(trade_data)

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 4096,
                },
            )
            response.raise_for_status()
            data = response.json()

        result_text: str = data["choices"][0]["message"]["content"]

        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        result_dict = json.loads(result_text)
        logger.info(
            f"Translation complete — {len(result_dict.get('commodities', []))} commodities, "
            f"{len(result_dict.get('goods_items', []))} goods items, "
            f"overall confidence: {result_dict.get('confidence', 0):.2f}"
        )

        return result_dict

    def _build_prompt(self, trade_data: dict[str, Any]) -> str:
        """Build the user prompt from trade data."""
        payload = {
            "declaration_data": trade_data.get("declaration_data", {}),
            "commodities": trade_data.get("commodities", []),
            "goods_items": trade_data.get("goods_items", []),
            "measures": trade_data.get("measures", []),
            "commercial_notes": trade_data.get("commercial_notes", ""),
        }
        return (
            f"Translate the following trade declaration data to HS Codes and WCO JSON:\n\n"
            f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
        )
