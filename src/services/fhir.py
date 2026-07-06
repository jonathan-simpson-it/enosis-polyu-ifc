"""FHIR R5 resource construction service."""

from __future__ import annotations

import uuid
from typing import Any


def generate_id() -> str:
    """Generate a UUID for FHIR resource IDs."""
    return str(uuid.uuid4())


def create_fhir_patient(patient_data: dict[str, Any]) -> dict[str, Any]:
    """Create a FHIR R5 Patient resource.

    Args:
        patient_data: Dict with name, hkid, dob, gender fields.

    Returns:
        FHIR R5 Patient resource as a dict.
    """
    name_info = patient_data.get("name", {})
    family = name_info.get("last", name_info.get("family", ""))
    given = name_info.get("first", name_info.get("given", ""))

    gender_map = {"M": "male", "F": "female", "O": "other", "U": "unknown"}
    gender = gender_map.get(patient_data.get("gender", "M"), "unknown")

    return {
        "resourceType": "Patient",
        "id": generate_id(),
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/Patient"],
        },
        "identifier": [
            {
                "system": "https://www.ehealth.gov.hk",
                "value": patient_data.get("hkid", ""),
            }
        ],
        "name": [
            {
                "use": "official",
                "family": family,
                "given": [given] if given else [],
            }
        ],
        "gender": gender,
        "birthDate": patient_data.get("dob", ""),
    }


def create_fhir_condition(diagnosis: dict[str, Any]) -> dict[str, Any]:
    """Create a FHIR R5 Condition resource.

    Args:
        diagnosis: Dict with icd10_code and icd10_description fields.

    Returns:
        FHIR R5 Condition resource as a dict.
    """
    return {
        "resourceType": "Condition",
        "id": generate_id(),
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/Condition"],
        },
        "clinicalStatus": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    "code": "active",
                }
            ]
        },
        "code": {
            "coding": [
                {
                    "system": "http://hl7.org/fhir/sid/icd-10",
                    "code": diagnosis.get("icd10_code", ""),
                    "display": diagnosis.get("icd10_description", ""),
                }
            ]
        },
    }


def create_fhir_medication_request(medication: dict[str, Any]) -> dict[str, Any]:
    """Create a FHIR R5 MedicationRequest resource.

    Args:
        medication: Dict with snomed_code, snomed_name, dosage, frequency.

    Returns:
        FHIR R5 MedicationRequest resource as a dict.
    """
    dosage_text = f"{medication.get('dosage', '')} {medication.get('frequency', '')}".strip()

    return {
        "resourceType": "MedicationRequest",
        "id": generate_id(),
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/MedicationRequest"],
        },
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": medication.get("snomed_code", ""),
                    "display": medication.get("snomed_name", ""),
                }
            ]
        },
        "dosageInstruction": [
            {
                "text": dosage_text,
                "timing": {
                    "repeat": {
                        "frequency": 1,
                        "period": 1,
                        "periodUnit": "d",
                    }
                },
                "route": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "26643006",
                            "display": "Oral route",
                        }
                    ]
                },
            }
        ],
    }


def create_fhir_bundle(
    patient: dict[str, Any],
    conditions: list[dict[str, Any]],
    medications: list[dict[str, Any]],
) -> dict[str, Any]:
    """Create a FHIR R5 transaction Bundle.

    Args:
        patient: FHIR Patient resource.
        conditions: List of FHIR Condition resources.
        medications: List of FHIR MedicationRequest resources.

    Returns:
        FHIR R5 Bundle resource as a dict.
    """
    entries: list[dict[str, Any]] = []

    # Patient entry
    entries.append({
        "resource": patient,
        "request": {"method": "POST", "url": "Patient"},
    })

    # Condition entries
    for cond in conditions:
        entries.append({
            "resource": cond,
            "request": {"method": "POST", "url": "Condition"},
        })

    # MedicationRequest entries
    for med in medications:
        entries.append({
            "resource": med,
            "request": {"method": "POST", "url": "MedicationRequest"},
        })

    return {
        "resourceType": "Bundle",
        "id": generate_id(),
        "type": "transaction",
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/Bundle"],
        },
        "entry": entries,
    }
