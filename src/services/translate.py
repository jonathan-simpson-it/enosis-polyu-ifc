"""DeepSeek API integration for clinical data translation."""

from __future__ import annotations

import json
from typing import Any

import httpx

from src.config import settings
from src.schemas import DiagnosisInput, MedicationInput, LabResultInput
from src.utils.logger import logger


SYSTEM_PROMPT = """You are a medical data translator. Map clinical data to standard coding systems (ICD-10, SNOMED-CT, WHO-ATC) and output FHIR R5 resources. Return ONLY valid JSON.

Required output format:
{
    "patient": {"name": {"first": "...", "last": "..."}, "hkid": "...", "dob": "...", "gender": "..."},
    "diagnoses": [
        {
            "original_code": "E11.9",
            "original_description": "Type 2 diabetes mellitus",
            "icd10_code": "E11.9",
            "icd10_description": "Type 2 diabetes mellitus without complications",
            "confidence": 0.95
        }
    ],
    "medications": [
        {
            "original_name": "Metformin",
            "dosage": "500mg",
            "frequency": "Twice daily",
            "snomed_code": "372531002",
            "snomed_name": "Metformin",
            "atc_code": "A10BA02",
            "confidence": 0.92
        }
    ],
    "fhir_bundle": {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": [
            {"resource": {"resourceType": "Patient", ...}},
            {"resource": {"resourceType": "Condition", ...}},
            {"resource": {"resourceType": "MedicationRequest", ...}}
        ]
    },
    "confidence": 0.94
}

Rules:
1. Map ALL diagnoses to ICD-10 codes.
2. Map ALL medications to SNOMED-CT and WHO-ATC codes.
3. Create complete FHIR R5 resources for Patient, Condition (for each diagnosis), and MedicationRequest (for each medication).
4. Use realistic confidence scores (0.85-0.99) based on how confident you are in each mapping.
5. Return ONLY the JSON object — no markdown, no explanation."""


class DeepSeekTranslator:
    """Translates clinical data using the DeepSeek API."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        """Initialize the translator.

        Args:
            api_key: DeepSeek API key.
            base_url: DeepSeek API base URL.
            model: Model name to use.
        """
        self.api_key = api_key or settings.deepseek_api_key
        self.base_url = base_url or settings.deepseek_base_url
        self.model = model or settings.deepseek_model

    async def translate(self, patient_data: dict[str, Any]) -> dict[str, Any]:
        """Translate patient data to standard codes and FHIR R5.

        Args:
            patient_data: Raw patient data including demographics, diagnoses,
                          medications, lab results, and clinical notes.

        Returns:
            Parsed translation result with FHIR bundle.
        """
        prompt = self._build_prompt(patient_data)

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

        # Strip markdown fences if present
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        result_dict = json.loads(result_text)
        logger.info(
            f"Translation complete — {len(result_dict.get('diagnoses', []))} diagnoses, "
            f"{len(result_dict.get('medications', []))} medications, "
            f"overall confidence: {result_dict.get('confidence', 0):.2f}"
        )

        return result_dict

    def _build_prompt(self, patient_data: dict[str, Any]) -> str:
        """Build the user prompt from patient data."""
        payload = {
            "patient": patient_data.get("patient_data", {}),
            "diagnoses": patient_data.get("diagnoses", []),
            "medications": patient_data.get("medications", []),
            "lab_results": patient_data.get("lab_results", []),
            "clinical_notes": patient_data.get("clinical_notes", ""),
        }
        return (
            f"Translate the following patient data to ICD-10, SNOMED-CT, WHO-ATC, and FHIR R5:\n\n"
            f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
        )
