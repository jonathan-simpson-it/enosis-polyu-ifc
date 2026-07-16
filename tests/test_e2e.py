"""E2E tests for Enosis — covers UI, API, and translation pipeline (Trading Domain)."""

import time
import uuid
import pytest
import httpx
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:8000"
TRADE_SYSTEM_URL = "http://localhost:8080"
API_KEY = "dev-api-key-123456"


@pytest.fixture(scope="module")
def api_client():
    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        yield client


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        yield b
        b.close()


@pytest.fixture
def page(browser):
    p = browser.new_page(viewport={"width": 1280, "height": 900})
    yield p
    p.close()


# ── Act 1: Mock Trade System UI ───────────────────────────────────────────────

class TestMockTradeSystem:
    def test_trade_login_page(self, page):
        page.goto(TRADE_SYSTEM_URL)
        assert "Trade Declaration System" in page.title()
        assert page.get_by_role("button", name="Login").is_visible()

    def test_trade_login(self, page):
        page.goto(TRADE_SYSTEM_URL)
        page.get_by_role("textbox", name="Trader ID").fill("trader01")
        page.get_by_role("textbox", name="Password").fill("password")
        page.get_by_role("button", name="Login").click()
        page.wait_for_load_state("networkidle")
        assert "Dashboard" in page.title()

    def test_trade_dashboard_displays_declarations(self, page):
        page.goto(f"{TRADE_SYSTEM_URL}/dashboard.html")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Recent Declarations").is_visible()
        assert page.get_by_text("Gold Trader").is_visible()

    def test_trade_declaration_detail(self, page):
        page.goto(f"{TRADE_SYSTEM_URL}/declaration.html?id=D001")
        page.wait_for_load_state("networkidle")
        assert "Declaration Detail" in page.title()
        assert page.get_by_text("Declaration Information").is_visible()

    def test_trade_declarations_list(self, page):
        page.goto(f"{TRADE_SYSTEM_URL}/declarations.html")
        page.wait_for_load_state("networkidle")
        assert "Declarations" in page.title()


# ── Act 2: API ────────────────────────────────────────────────────────────────

class TestTradeAPI:
    def test_health(self, api_client):
        resp = api_client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
        assert resp.json()["version"] == "v0-hackathon-trade"

    def test_root_info(self, api_client):
        resp = api_client.get("/")
        assert resp.status_code == 200
        assert "Enosis" in resp.json()["name"]
        assert "HK TSW Phase 3" in resp.json()["tagline"]

    def test_full_trade_flow(self, api_client):
        trader_id = f"t-e2e-flow-{str(uuid.uuid4())[:8]}"

        # Step 1: Ingest
        ingest_resp = api_client.post(
            "/api/v1/ingest",
            json={
                "trader_id": trader_id,
                "trader_name": "E2E Flow Trader",
                "source_system": "mock_trade",
                "source_url": "http://localhost:8080",
                "declaration_ids": ["D001"],
            },
            headers={"X-API-Key": API_KEY},
        )
        assert ingest_resp.status_code == 200
        job_id = ingest_resp.json()["job_id"]

        time.sleep(1)
        status_resp = api_client.get(f"/api/v1/ingest/{job_id}/status", headers={"X-API-Key": API_KEY})
        assert status_resp.status_code == 200

        # Step 2: Translate
        translate_resp = api_client.post(
            "/api/v1/translate",
            json={
                "trader_id": trader_id,
                "declaration_id": "D001",
                "declaration_data": {
                    "declaration_number": "DEC-E2E-001",
                    "consignor_name": "E2E Trader Ltd",
                    "consignee_name": "E2E Buyer Ltd",
                    "port_of_loading": "Yantian",
                    "port_of_discharge": "Hong Kong",
                    "incoterms": "CIF",
                    "total_declared_value": 100000.0,
                },
                "commodities": [
                    {"description": "Test electronic integrated circuits", "hs_code_hint": "8542"},
                ],
                "goods_items": [
                    {"description": "Test IC chips - 100 pcs", "quantity": 100, "unit": "PCE", "declared_value": 50000.0, "weight": 10.0, "country_of_origin": "CN"},
                ],
            },
            headers={"X-API-Key": API_KEY},
        )
        assert translate_resp.status_code in (200, 502)
        if translate_resp.status_code == 200:
            translate_data = translate_resp.json()
            assert "wco_declaration" in translate_data
            assert "translations" in translate_data

            wco = translate_data["wco_declaration"]
            assert wco.get("resourceType") == "WCODeclaration"

            # Step 3: Upload
            upload_resp = api_client.post(
                "/api/v1/upload",
                json={
                    "trader_id": trader_id,
                    "declaration_id": "D001",
                    "wco_declaration": wco,
                    "trader_consent": True,
                },
                headers={"X-API-Key": API_KEY},
            )
            assert upload_resp.status_code == 200
            upload_data = upload_resp.json()
            assert upload_data["status"] == "submitted"
            assert "MOCK-TSW-" in upload_data["tsw_reference"]

            # Step 4: Certification
            cert_resp = api_client.get(
                f"/api/v1/certification/{trader_id}",
                headers={"X-API-Key": API_KEY},
            )
            assert cert_resp.status_code == 200
            cert_data = cert_resp.json()
            assert cert_data["trader_name"] == "E2E Flow Trader"
            assert "current_level" in cert_data


# ── Act 3: Demo UI ────────────────────────────────────────────────────────────

class TestTradeDemoUI:
    def test_demo_page_loads(self, page):
        page.goto(f"{BASE_URL}/demo/")
        page.wait_for_load_state("networkidle")
        assert "ENOSIS" in page.title()

    def test_demo_three_source_tabs(self, page):
        page.goto(f"{BASE_URL}/demo/")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Mock Trade System").is_visible()
        assert page.get_by_text("Manifest OCR").is_visible()
        assert page.get_by_text("Custom Commercial Text").is_visible()

    def test_demo_default_shows_trade_declarations(self, page):
        page.goto(f"{BASE_URL}/demo/")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("DEC-2026-001").is_visible()
        assert page.get_by_text("GBA Trading Ltd").is_visible()

    def test_demo_manifest_tab_shows_ocr(self, page):
        page.goto(f"{BASE_URL}/demo/")
        page.wait_for_load_state("networkidle")
        page.get_by_text("Manifest OCR").click()
        page.wait_for_timeout(500)
        assert page.get_by_text("INVOICE NO").is_visible()

    def test_demo_custom_tab_shows_textarea(self, page):
        page.goto(f"{BASE_URL}/demo/")
        page.wait_for_load_state("networkidle")
        page.get_by_text("Custom Commercial Text").click()
        page.wait_for_timeout(500)
        assert page.get_by_text("Laptop computers").is_visible()

    def test_demo_translate_button_exists(self, page):
        page.goto(f"{BASE_URL}/demo/")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Translate to WCO JSON").is_visible()
