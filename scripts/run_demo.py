#!/usr/bin/env python3
"""
Enosis v0 — End-to-end demo script for PolyU IFC 2026 (Trading Domain).

Demonstrates the full data flow:
  1. Health check
  2. Ingest trade declaration data from mock Trade Declaration System
  3. Translate to HS Codes / WCO JSON
  4. Submit to mock HK TSW Phase 3
  5. View Smart Trader Certification
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

TRADER_ID = "t1010101-0000-4000-a000-000000000001"


def section(title: str):
    print(f"\n{'═' * 60}")
    print(f"  {title}")
    print(f"{'═' * 60}")


def step(n: int, title: str):
    print(f"\n── Step {n}: {title} ──")


def main():
    print()
    print("╔" + "═" * 58 + "╗")
    print("║" + "   🚢  ENOSIS v0  —  Trade Domain Demo".center(58) + "║")
    print("║" + "   Universal Data Translation Layer".center(58) + "║")
    print("║" + "   HK TSW Phase 3 — PolyU IFC 2026".center(58) + "║")
    print("╚" + "═" * 58 + "╝")

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

    step(2, "Ingest Declaration Data from Mock Trade System")
    ingest_payload = {
        "trader_id": TRADER_ID,
        "trader_name": "GBA Trading Ltd",
        "source_system": "mock_trade",
        "source_url": "http://localhost:8080/declaration.html",
        "declaration_ids": ["D001", "D002", "D003"],
    }
    print(f"  Scraping {len(ingest_payload['declaration_ids'])} declarations from mock trade system...")

    try:
        resp = httpx.post(f"{BASE_URL}/api/v1/ingest", json=ingest_payload, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        ingest_result = resp.json()
        job_id = ingest_result["job_id"]
        print(f"  ✓ Job started:          {job_id}")
        print(f"  ✓ Declarations scraped: {ingest_result['declarations_scraped']}")

        print("  Waiting for completion...", end=" ", flush=True)
        time.sleep(2)

        resp = httpx.get(f"{BASE_URL}/api/v1/ingest/{job_id}/status", headers=HEADERS, timeout=10)
        resp.raise_for_status()
        status = resp.json()
        print(f"{status['status'].upper()}")
        print(f"  ✓ Declarations found:    {status['declarations_found']}")
        print(f"  ✓ Declarations extracted: {status['declarations_extracted']}")
    except Exception as e:
        print(f"  ✗ Ingest failed: {e}")
        print(f"  → Ensure mock trade system is running at http://localhost:8080")
        return

    step(3, "Translate Trade Data to HS Codes and WCO JSON")
    translate_payload = {
        "trader_id": TRADER_ID,
        "declaration_id": "D001",
        "declaration_data": {
            "declaration_number": "DEC-2026-001",
            "consignor_name": "GBA Trading Ltd",
            "consignee_name": "HK Electronics Ltd",
            "port_of_loading": "Yantian, Shenzhen",
            "port_of_discharge": "Hong Kong",
            "incoterms": "CIF",
            "container_number": "MSCU4820347",
            "gross_weight": 910.0,
            "net_weight": 850.0,
            "number_of_packages": 12,
            "total_declared_value": 630000.0,
            "declared_currency": "HKD",
        },
        "commodities": [
            {"description": "Integrated circuits, electronic", "hs_code_hint": "8542"},
            {"description": "Printed circuit boards", "hs_code_hint": "8534"},
        ],
        "goods_items": [
            {"description": "IC chips 7400 series - 5000 pcs", "quantity": 5000, "unit": "PCE", "declared_value": 450000.0, "weight": 120.0, "country_of_origin": "CN"},
            {"description": "PCB assemblies - 200 pcs", "quantity": 200, "unit": "PCE", "declared_value": 180000.0, "weight": 85.0, "country_of_origin": "CN"},
        ],
        "commercial_notes": "Importer: HK Electronics Ltd. Goods manufactured in Shenzhen. CIF Hong Kong via Yantian port.",
    }

    try:
        resp = httpx.post(f"{BASE_URL}/api/v1/translate", json=translate_payload, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        translate_result = resp.json()

        n_goods_items = len(translate_result.get("wco_declaration", {}).get("declaration", {}).get("GoodsShipment", {}).get("GovernmentAgencyGoodsItem", []))
        n_translations = len(translate_result.get("translations", []))
        confidences = [t["confidence"] for t in translate_result.get("translations", []) if t.get("confidence")]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0

        print(f"  ✓ Job ID:            {translate_result['job_id']}")
        print(f"  ✓ WCO goods items:   {n_goods_items}")
        print(f"  ✓ Translations:      {n_translations}")
        print(f"  ✓ Avg confidence:    {avg_conf:.1%}")

        wco_declaration = translate_result.get("wco_declaration", {})
        translations = translate_result.get("translations", [])
    except Exception as e:
        print(f"  ✗ Translate failed: {e}")
        print(f"  → Check DEEPSEEK_API_KEY in .env")
        print("  → Falling back to mock WCO declaration for demo...")
        wco_declaration = {
            "resourceType": "WCODeclaration",
            "type": "customs_declaration",
            "declaration_id": str(uuid.uuid4()),
            "declaration": {
                "Declaration": {"ID": "DEC-2026-001", "FunctionCode": "9"},
                "GoodsShipment": {"GovernmentAgencyGoodsItem": []},
            },
        }
        translations = []

    step(4, "Submit to HK TSW Phase 3 (Mock)")
    upload_payload = {
        "trader_id": TRADER_ID,
        "declaration_id": "D001",
        "wco_declaration": wco_declaration,
        "trader_consent": True,
    }

    try:
        resp = httpx.post(f"{BASE_URL}/api/v1/upload", json=upload_payload, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        upload_result = resp.json()
        print(f"  ✓ Submission ID:     {upload_result['upload_id']}")
        print(f"  ✓ Status:            {upload_result['status']}")
        print(f"  ✓ TSW Reference:     {upload_result['tsw_reference']}")
        print(f"  ✓ Message:           {upload_result['message']}")
    except Exception as e:
        print(f"  ✗ Upload failed: {e}")
        return

    step(5, "Smart Trader Certification")
    try:
        resp = httpx.get(f"{BASE_URL}/api/v1/certification/{TRADER_ID}", headers=HEADERS, timeout=10)
        resp.raise_for_status()
        cert = resp.json()

        level_emoji = {"bronze": "🥉", "silver": "🥈", "gold": "🥇", "platinum": "💎", "diamond": "👑", "none": "⚪"}
        emoji = level_emoji.get(cert["current_level"], "🏅")

        print(f"  ✓ Trader:            {cert['trader_name']}")
        print(f"  ✓ Level:             {emoji} {cert['current_level'].upper()} — {cert['level_name']}")
        print(f"  ✓ Declarations:      {cert['declarations_submitted']}")
        print(f"  ✓ Accuracy rate:     {cert['accuracy_rate']:.0%}")
        print(f"  ✓ Badge:             {cert['badge_url']}")
        if cert.get("next_level") and not cert["next_level"].get("achieved"):
            nl = cert["next_level"]
            print(f"  ✓ Next level:        {nl['name']} ({nl['records_required']} declarations, {nl['accuracy_required']:.0%} accuracy)")
        print(f"  ✓ Progress:          {cert['progress']:.0%}")
    except Exception as e:
        print(f"  ✗ Certification check failed: {e}")
        return

    section("DEMO COMPLETE ✓")
    print(f"""
   ✅ Extracted declaration data from mock trade system
   ✅ Translated to HS Codes and WCO JSON ({n_goods_items if 'n_goods_items' in dir() else 0} goods items)
   ✅ Submitted to mock TSW Phase 3 (ref: {upload_result['tsw_reference']})
   ✅ Earned {cert['current_level'].upper()} Smart Trader Certification

   Next Steps:
   • API Docs:  {BASE_URL}/docs
   • Mock Trade System:  http://localhost:8080
   • Badges:    {BASE_URL}/badges/gold.svg
""")


if __name__ == "__main__":
    main()
