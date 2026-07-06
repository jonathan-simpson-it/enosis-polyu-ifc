"""
Tests for Enosis v0 API endpoints.
"""

import sys
import os

# Set test database BEFORE any application imports
import tempfile
TEST_DB_PATH = os.path.join(tempfile.gettempdir(), f"enosis_test_{os.getpid()}.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.database import init_db

client = TestClient(app)
API_KEY = "dev-api-key-123456"
HEADERS = {"X-API-Key": API_KEY}


@pytest.fixture(autouse=True, scope="session")
def setup_db():
    """Initialize test database once for the entire test session."""
    init_db()
    yield
    # Cleanup after all tests
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def test_health():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "v0-hackathon"


def test_root():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "Enosis"


def test_health_services():
    """Test health includes service status."""
    response = client.get("/health")
    data = response.json()
    assert "services" in data
    assert data["services"]["database"] == "connected"


def test_ingest_missing_api_key():
    """Test ingest endpoint rejects missing API key."""
    response = client.post("/api/v1/ingest", json={"clinic_name": "Test"})
    assert response.status_code == 401


def test_ingest_invalid_api_key():
    """Test ingest endpoint rejects invalid API key."""
    response = client.post(
        "/api/v1/ingest",
        json={"clinic_name": "Test"},
        headers={"X-API-Key": "wrong-key"},
    )
    assert response.status_code == 403


def test_ingest_with_api_key():
    """Test ingest endpoint accepts valid API key."""
    response = client.post(
        "/api/v1/ingest",
        json={
            "clinic_name": "Test Clinic",
            "cms_type": "mock",
            "cms_url": "http://localhost:8080/patient.html",
            "patient_ids": ["P001"],
        },
        headers=HEADERS,
    )
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "processing"


def test_ingest_status_not_found():
    """Test ingest status returns 404 for unknown job."""
    response = client.get("/api/v1/ingest/nonexistent/status", headers=HEADERS)
    assert response.status_code == 404


def test_translate_with_api_key():
    """Test translate endpoint structure (may fail without DeepSeek key)."""
    response = client.post(
        "/api/v1/translate",
        json={
            "clinic_id": "test-clinic-id",
            "patient_id": "P001",
            "patient_data": {"name": {"first": "Test", "last": "User"}, "hkid": "A1234567", "dob": "2000-01-01", "gender": "M"},
            "diagnoses": [{"code": "E11.9", "description": "Type 2 diabetes"}],
            "medications": [{"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily"}],
            "lab_results": [],
            "clinical_notes": "",
        },
        headers=HEADERS,
    )
    # Will likely fail without real DeepSeek key, but shouldn't be auth error
    assert response.status_code != 401
    assert response.status_code != 403


def test_upload_missing_consent():
    """Test upload rejects missing consent."""
    response = client.post(
        "/api/v1/upload",
        json={
            "clinic_id": "test-clinic",
            "patient_id": "P001",
            "fhir_bundle": {"resourceType": "Bundle", "type": "transaction", "entry": []},
            "patient_consent": False,
        },
        headers=HEADERS,
    )
    assert response.status_code == 400


def test_upload_with_consent():
    """Test upload accepts valid data with consent."""
    response = client.post(
        "/api/v1/upload",
        json={
            "clinic_id": "test-clinic",
            "patient_id": "P001",
            "fhir_bundle": {"resourceType": "Bundle", "type": "transaction", "entry": [{"resource": {"resourceType": "Patient"}}]},
            "patient_consent": True,
        },
        headers=HEADERS,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "submitted"
    assert "ehealth_reference" in data


def test_upload_status_not_found():
    """Test upload status returns 404 for unknown ID."""
    response = client.get("/api/v1/upload/nonexistent/status", headers=HEADERS)
    assert response.status_code == 404


def test_certification_clinic_not_found():
    """Test certification returns 404 for unknown clinic."""
    response = client.get("/api/v1/certification/nonexistent", headers=HEADERS)
    assert response.status_code == 404
