"""DeepSeek API integration for WCO JSON generation as fallback."""

from __future__ import annotations

import json
from typing import Any

import httpx

from backend.src.core.config import settings
from backend.src.utils.logger import logger

SYSTEM_PROMPT = """You are a trade data translator. Map commodity descriptions to HS Codes and output WCO Data Model v3.11 JSON declarations. Return ONLY valid JSON.

Required output format:
{
    "commodities": [
        {
            "original_description": "Aluminium heat-sink profiles",
            "hs_code": "7604.29.90",
            "hs_code_description": "Aluminium profiles, not further worked than extruded",
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
        "declaration": {...}
    },
    "confidence": 0.94
}

Rules:
1. Map ALL commodities to HS Codes (6-10 digit Harmonized System codes).
2. Return ONLY the JSON object — no markdown, no explanation."""


class DeepSeekTranslator:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        self.api_key = api_key or settings.deepseek_api_key
        self.base_url = base_url or settings.deepseek_base_url
        self.model = model or settings.deepseek_model

    async def translate(self, trade_text: str) -> dict[str, Any]:
        if not self.api_key:
            logger.warning("DeepSeek API key not configured, returning empty result")
            return {"commodities": [], "goods_items": [], "wco_declaration": {}, "confidence": 0.0}

        prompt = f"Translate the following trade data to HS Codes and WCO JSON:\n\n{trade_text[:8000]}"

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

        result_text = data["choices"][0]["message"]["content"]
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        result_dict = json.loads(result_text)
        logger.info(
            f"DeepSeek translation: {len(result_dict.get('commodities', []))} commodities, "
            f"confidence: {result_dict.get('confidence', 0):.2f}"
        )
        return result_dict
