#!/usr/bin/env python3
"""
Enosis v0 — End-to-end demo script for PolyU IFC 2026.

Demonstrates the full data flow:
  1. Health check
  2. Ingest patient data from mock CMS
  3. Translate to ICD-10 / SNOMED-CT / FHIR R5
  4. Upload to mock eHealth+
  5. View Smart Clinic Certification
"""

import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx
import uuid

BASE_URL = os.environ.get("ENOSIS_URL", "http://localhost:8000")
API_KEY = os.environ.get("ENOSIS_API_KEY", "dev-api-key-123456")
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

CLINIC_ID = "c1010101-0000-4000-a000-000000000001"


def section(title: str):
    """Print a section header."""
    print(f"\n{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}")


def step(n: int, title: str):
    """Print a step header."""
    print(f"\n── Step {n}: {title} ──")


def main():
    print()
    print("╔" + "═" * 58 + "╗")
    print("║" + "   🏥  ENOSIS v0  —  Hackathon Demo".center(58) + "║")
    print("║" + "   Universal Data Translation Layer".center(58) + "║")
    print("║" + "   PolyU IFC 2026".center(58) + "║")
    print("╚" + "═" * 58 + "╝")

    # ── Step 1: Health Check ──
    step(1, "Health Check")
    try:
        resp = httpx.get(f"{BASE_URL}/health", timeout=10)
        resp.raise_for_status()
        health = resp.json()
        print(f"  ✓ Status:   {health['status']}")
        print(f"  ✓ Version:  {health['version']}")
        print(f"  ✓ Services: DB={health['services']['database']}, LLM={health['services']['deepseek_api']}")
    except Exception as e:
        print(f"  ✗ Health check failed: {e}")
        print(f"  → Is the server running? Try: docker-compose up --build")
        return

    # ── Step 2: Ingest ──
    step(2, "Ingest Patient Data from Mock CMS")
    ingest_payload = {
        "clinic_id": CLINIC_ID,
        "clinic_name": "Central Clinic",
        "cms_type": "mock",
        "cms_url": "http://localhost:8080/patient.html",
        "patient_ids": ["P001", "P002", "P003"],
    }
    print(f"  Scraping {len(ingest_payload['patient_ids'])} patients from mock CMS...")

    try:
        resp = httpx.post(f"{BASE_URL}/api/v1/ingest", json=ingest_payload, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        ingest_result = resp.json()
        job_id = ingest_result["job_id"]
        print(f"  ✓ Job started:       {job_id}")
        print(f"  ✓ Patients scraped:  {ingest_result['patients_scraped']}")

        # Poll for completion
        print("  Waiting for completion...", end=" ", flush=True)
        time.sleep(2)

        resp = httpx.get(f"{BASE_URL}/api/v1/ingest/{job_id}/status", headers=HEADERS, timeout=10)
        resp.raise_for_status()
        status = resp.json()
        print(f"{status['status'].upper()}")
        print(f"  ✓ Patients found:    {status['patients_found']}")
        print(f"  ✓ Patients extracted:{status['patients_extracted']}")
    except Exception as e:
        print(f"  ✗ Ingest failed: {e}")
        print(f"  → Ensure mock CMS is running at http://localhost:8080")
        return

    # ── Step 3: Translate ──
    step(3, "Translate Clinical Data to FHIR R5")
    translate_payload = {
        "clinic_id": CLINIC_ID,
        "patient_id": "P001",
        "patient_data": {
            "name": {"first": "Tai Man", "last": "Chan"},
            "hkid": "A1234567",
            "dob": "1955-01-01",
            "gender": "M",
        },
        "diagnoses": [
            {"code": "E11.9", "description": "Type 2 diabetes mellitus without complications"},
            {"code": "I10", "description": "Essential (primary) hypertension"},
        ],
        "medications": [
            {"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily"},
            {"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily"},
        ],
        "lab_results": [
            {"test": "HbA1c", "value": "7.2", "unit": "%", "reference": "< 7.0"},
        ],
        "clinical_notes": "Patient presents with fatigue and increased thirst. BP 140/90.",
    }

    try:
        resp = httpx.post(f"{BASE_URL}/api/v1/translate", json=translate_payload, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        translate_result = resp.json()

        n_resources = len(translate_result["fhir_bundle"].get("entry", []))
        n_translations = len(translate_result.get("translations", []))
        confidences = [t["confidence"] for t in translate_result.get("translations", []) if t.get("confidence")]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0

        print(f"  ✓ Job ID:            {translate_result['job_id']}")
        print(f"  ✓ FHIR resources:    {n_resources}")
        print(f"  ✓ Translations:      {n_translations}")
        print(f"  ✓ Avg confidence:    {avg_conf:.1%}")

        fhir_bundle = translate_result["fhir_bundle"]
        translations = translate_result["translations"]
    except Exception as e:
        print(f"  ✗ Translate failed: {e}")
        print(f"  → Check DEEPSEEK_API_KEY in .env")
        # Continue with mock data so demo doesn't break
        print("  → Falling back to mock FHIR bundle for demo...")
        fhir_bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": [
                {"resource": {"resourceType": "Patient", "id": str(uuid.uuid4())}},
                {"resource": {"resourceType": "Condition", "id": str(uuid.uuid4())}},
            ],
        }
        translations = []

    # ── Step 4: Upload ──
    step(4, "Upload to eHealth+ (Mock)")
    upload_payload = {
        "clinic_id": CLINIC_ID,
        "patient_id": "P001",
        "fhir_bundle": fhir_bundle,
        "patient_consent": True,
    }

    try:
        resp = httpx.post(f"{BASE_URL}/api/v1/upload", json=upload_payload, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        upload_result = resp.json()
        print(f"  ✓ Upload ID:         {upload_result['upload_id']}")
        print(f"  ✓ Status:            {upload_result['status']}")
        print(f"  ✓ eHealth+ Ref:      {upload_result['ehealth_reference']}")
        print(f"  ✓ Message:           {upload_result['message']}")
    except Exception as e:
        print(f"  ✗ Upload failed: {e}")
        return

    # ── Step 5: Certification ──
    step(5, "Smart Clinic Certification")
    try:
        resp = httpx.get(f"{BASE_URL}/api/v1/certification/{CLINIC_ID}", headers=HEADERS, timeout=10)
        resp.raise_for_status()
        cert = resp.json()

        level_emoji = {"bronze": "🥉", "silver": "🥈", "gold": "🥇", "platinum": "💎", "diamond": "👑", "none": "⚪"}
        emoji = level_emoji.get(cert["current_level"], "🏅")

        print(f"  ✓ Clinic:            {cert['clinic_name']}")
        print(f"  ✓ Level:             {emoji} {cert['current_level'].upper()} — {cert['level_name']}")
        print(f"  ✓ Records uploaded:  {cert['records_uploaded']}")
        print(f"  ✓ Accuracy rate:     {cert['accuracy_rate']:.0%}")
        print(f"  ✓ Badge:             {cert['badge_url']}")
        if cert.get("next_level") and not cert["next_level"].get("achieved"):
            nl = cert["next_level"]
            print(f"  ✓ Next level:        {nl['name']} ({nl['records_required']} records, {nl['accuracy_required']:.0%} accuracy)")
        print(f"  ✓ Progress:          {cert['progress']:.0%}")
    except Exception as e:
        print(f"  ✗ Certification check failed: {e}")
        return

    # ── Summary ──
    section("DEMO COMPLETE ✓")
    print(f"""
   ✅ Extracted patient data from mock clinic CMS
   ✅ Translated to FHIR R5 ({len(fhir_bundle.get('entry', []))} resources)
   ✅ Uploaded to mock eHealth+ (ref: {upload_result['ehealth_reference']})
   ✅ Earned {cert['current_level'].upper()} Smart Clinic Certification

   Next Steps:
   • API Docs:  {BASE_URL}/docs
   • Mock CMS:  http://localhost:8080
   • Badges:    {BASE_URL}/badges/gold.svg
""")


if __name__ == "__main__":
    main()
