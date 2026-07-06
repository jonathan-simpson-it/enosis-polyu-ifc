"""E2E tests for Enosis — covers UI, API, and translation pipeline."""

import time
import uuid
import pytest
import httpx
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:8000"
CMS_URL = "http://localhost:8080"
API_KEY = "dev-api-key-123456"


# ── Fixtures ──────────────────────────────────────────────────────────────────

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


# ── Act 1: Mock CMS UI ───────────────────────────────────────────────────────

class TestMockCMS:
    def test_cms_login_page(self, page):
        page.goto(CMS_URL)
        assert "Mock Clinic CMS" in page.title()
        assert page.get_by_role("button", name="Login").is_visible()

    def test_cms_login(self, page):
        page.goto(CMS_URL)
        page.get_by_role("textbox", name="Username").fill("admin")
        page.get_by_role("textbox", name="Password").fill("password")
        page.get_by_role("button", name="Login").click()
        page.wait_for_load_state("networkidle")
        assert "Dashboard" in page.title()
        assert page.get_by_text("Central Clinic").is_visible()

    def test_cms_dashboard_summary(self, page):
        page.goto(CMS_URL)
        page.get_by_role("button", name="Login").click()
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Today's Summary").is_visible()
        assert page.get_by_text("Total Patients").is_visible()

    def test_cms_patient_list(self, page):
        page.goto(CMS_URL + "/patients.html")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Leung Hin Wa").is_visible()
        assert page.get_by_text("Fong Chun Kit").is_visible()
        assert page.get_by_text("Wan Sze Man").is_visible()
        assert page.get_by_text("Synthea-generated").is_visible()

    def test_cms_patient_detail_p001(self, page):
        page.goto(CMS_URL + "/patient.html?id=P001")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Leung Hin Wa").is_visible()
        assert page.get_by_text("U2167390").is_visible()
        assert page.get_by_text("1977-03-26").is_visible()
        assert page.get_by_text("I10", exact=True).is_visible()
        assert page.get_by_text("HbA1c").is_visible()

    def test_cms_patient_p002(self, page):
        page.goto(CMS_URL + "/patient.html?id=P002")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Fong Chun Kit").is_visible()
        assert page.get_by_text("B3999814").is_visible()
        assert page.get_by_text("D64.9", exact=True).is_visible()
        assert page.get_by_text("Omeprazole").is_visible()

    def test_cms_patient_p003(self, page):
        page.goto(CMS_URL + "/patient.html?id=P003")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Wan Sze Man").is_visible()
        assert page.get_by_text("N6452810").is_visible()
        assert page.get_by_text("E78.5", exact=True).is_visible()
        assert page.get_by_role("cell", name="Lisinopril", exact=True).is_visible()

    def test_cms_nav_links(self, page):
        page.goto(CMS_URL + "/reports.html")
        page.wait_for_load_state("networkidle")
        assert page.get_by_role("heading", name="📊 Reports").is_visible()
        page.goto(CMS_URL + "/appointments.html")
        page.wait_for_load_state("networkidle")
        assert page.get_by_role("heading", name="📅 Appointments").is_visible()


# ── Act 2: Translation Demo UI ────────────────────────────────────────────────

class TestTranslationDemo:
    def test_demo_page_loads(self, page):
        page.goto(BASE_URL + "/demo/")
        page.wait_for_load_state("networkidle")
        assert "Translation Demo" in page.title()
        assert page.get_by_text("Data Source").first.is_visible()

    def test_demo_source_tabs(self, page):
        page.goto(BASE_URL + "/demo/")
        page.wait_for_load_state("networkidle")
        assert page.get_by_text("Mock Clinic CMS").is_visible()
        assert page.get_by_text("Lab Report (OCR)").is_visible()
        assert page.get_by_text("Custom Clinical Text").is_visible()

    def test_demo_translate_button(self, page):
        page.goto(BASE_URL + "/demo/")
        page.wait_for_load_state("networkidle")
        btn = page.get_by_role("button", name="Translate via DeepSeek")
        assert btn.is_visible()
        assert btn.is_enabled()

    def test_demo_step_indicator(self, page):
        page.goto(BASE_URL + "/demo/")
        page.wait_for_load_state("networkidle")
        assert page.get_by_role("heading", name="1. Select Data Source").is_visible()
        assert page.get_by_text("Upload & Certify").is_visible()


# ── Act 3: API Endpoints ─────────────────────────────────────────────────────

class TestAPI:
    def test_health(self, api_client):
        r = api_client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert data["services"]["database"] == "connected"

    def test_ingest(self, api_client):
        r = api_client.post("/api/v1/ingest", json={
            "clinic_id": str(uuid.uuid4()),
            "clinic_name": "E2E Test Clinic",
            "cms_type": "mock",
            "cms_url": "http://localhost:8080/patient.html",
            "patient_ids": ["P001"]
        }, headers={"X-API-Key": API_KEY})
        assert r.status_code in (200, 500)

    def test_translate(self, api_client):
        clinic_id = str(uuid.uuid4())
        api_client.post("/api/v1/ingest", json={
            "clinic_id": clinic_id, "clinic_name": "Test",
            "cms_type": "mock", "cms_url": "http://localhost:8080/patient.html",
            "patient_ids": ["P001"]
        }, headers={"X-API-Key": API_KEY})
        r = api_client.post("/api/v1/translate", json={
            "clinic_id": clinic_id,
            "patient_id": "P001",
            "patient_data": {"name": {"first": "Tai Man", "last": "Chan"}, "hkid": "A1234567", "dob": "1955-01-01", "gender": "M"},
            "diagnoses": [{"code": "E11.9", "description": "Type 2 diabetes mellitus"}],
            "medications": [{"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily"}],
            "lab_results": [{"test": "HbA1c", "value": "7.2", "unit": "%", "reference": "< 7.0"}],
            "clinical_notes": "Test patient"
        }, headers={"X-API-Key": API_KEY}, timeout=60)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "completed"
        assert len(data["translations"]) > 0

    def test_auth_required(self, api_client):
        r = api_client.get("/api/v1/ingest/xxx/status")
        assert r.status_code in (401, 403)

    def test_badge_svg(self, api_client):
        for level in ["bronze", "silver", "gold", "platinum", "diamond"]:
            r = api_client.get(f"/badges/{level}.svg")
            assert r.status_code == 200
            assert r.headers["content-type"] == "image/svg+xml"

    def test_static_demo_page(self, api_client):
        r = api_client.get("/demo/")
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]


# ── Act 4: E2E Translation Pipeline ──────────────────────────────────────────

class TestE2EPipeline:
    def test_full_pipeline_demo(self, api_client):
        clinic_id = str(uuid.uuid4())

        r = api_client.get("/health")
        assert r.json()["status"] == "healthy"

        api_client.post("/api/v1/ingest", json={
            "clinic_id": clinic_id, "clinic_name": "Pipeline Test",
            "cms_type": "mock", "cms_url": "http://localhost:8080/patient.html",
            "patient_ids": ["P001"]
        }, headers={"X-API-Key": API_KEY})

        t = api_client.post("/api/v1/translate", json={
            "clinic_id": clinic_id, "patient_id": "P001",
            "patient_data": {"name": {"first": "Tai Man", "last": "Chan"}, "hkid": "A1234567", "dob": "1955-01-01", "gender": "M"},
            "diagnoses": [{"code": "E11.9", "description": "Type 2 diabetes mellitus"}],
            "medications": [{"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily"}],
            "lab_results": [], "clinical_notes": "E2E pipeline test"
        }, headers={"X-API-Key": API_KEY}, timeout=60)

        assert t.status_code == 200
        td = t.json()
        assert td["status"] == "completed"
        assert len(td["translations"]) >= 2

        fhir_bundle = td.get("fhir_bundle", {})
        assert fhir_bundle.get("resourceType") == "Bundle"

        u = api_client.post("/api/v1/upload", json={
            "clinic_id": clinic_id, "patient_id": "P001",
            "fhir_bundle": fhir_bundle, "patient_consent": True
        }, headers={"X-API-Key": API_KEY})
        assert u.status_code == 200
        ud = u.json()
        assert "MOCK-EH-" in ud["ehealth_reference"]

    def test_certification_flow(self, api_client):
        r = api_client.get(f"/api/v1/certification/c1010101-0000-4000-a000-000000000001",
                           headers={"X-API-Key": API_KEY})
        assert r.status_code == 200
        data = r.json()
        assert data["current_level"] in ("gold", "bronze", "silver", "platinum", "diamond", "none")
        assert isinstance(data["badge_url"], str)
