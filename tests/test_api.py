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


# ── Upload Data ────────────────────────────────────────────────────────────


def test_upload_data_direct():
    """Test direct data submission endpoint."""
    response = client.post(
        "/api/v1/upload-data/direct",
        json={
            "clinic_id": "test-upload-clinic",
            "clinic_name": "Upload Test Clinic",
            "source_description": "Test submission",
            "patient_data": {
                "patient_id": "UP001",
                "name": "Test Patient",
                "hkid": "X1234567",
                "dob": "1990-01-01",
                "gender": "M",
                "diagnoses": [{"code": "I10", "description": "Hypertension"}],
                "medications": [{"name": "Amlodipine", "dosage": "5mg", "frequency": "Once daily"}],
                "lab_results": [],
                "clinical_notes": "Test clinical notes",
            },
        },
        headers=HEADERS,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "direct_submission"
    assert data["records_extracted"] == 1
    assert "job_id" in data


def test_upload_data_direct_missing_api_key():
    """Test upload-data direct rejects missing API key."""
    response = client.post(
        "/api/v1/upload-data/direct",
        json={
            "patient_data": {
                "patient_id": "UP001",
                "name": "Test",
                "hkid": "X1234567",
                "dob": "",
                "gender": "",
                "diagnoses": [],
                "medications": [],
                "lab_results": [],
                "clinical_notes": "",
            }
        },
    )
    assert response.status_code == 401


def test_upload_data_direct_invalid_api_key():
    """Test upload-data direct rejects invalid API key."""
    response = client.post(
        "/api/v1/upload-data/direct",
        json={
            "patient_data": {
                "patient_id": "UP001",
                "name": "Test",
                "hkid": "X1234567",
                "dob": "",
                "gender": "",
                "diagnoses": [],
                "medications": [],
                "lab_results": [],
                "clinical_notes": "",
            }
        },
        headers={"X-API-Key": "wrong-key"},
    )
    assert response.status_code == 403


def test_upload_data_status_not_found():
    """Test upload-data status returns 404 for unknown job."""
    response = client.get("/api/v1/upload-data/nonexistent/status", headers=HEADERS)
    assert response.status_code == 404


def test_upload_data_file_no_file():
    """Test upload-data file endpoint without a file returns 400."""
    response = client.post(
        "/api/v1/upload-data",
        headers=HEADERS,
    )
    assert response.status_code == 400  # No file provided


def test_upload_data_file_json_upload():
    """Test uploading a JSON file via the file endpoint."""
    import io
    import json

    test_data = [{
        "patient_id": "F001",
        "name": "File Upload Patient",
        "hkid": "Y9876543",
        "dob": "1985-06-15",
        "gender": "F",
        "diagnoses": [{"code": "E11.9", "description": "Type 2 diabetes"}],
        "medications": [],
        "lab_results": [],
        "clinical_notes": "Uploaded via JSON file",
    }]

    response = client.post(
        "/api/v1/upload-data",
        headers=HEADERS,
        files={
            "file": ("patients.json", json.dumps(test_data), "application/json"),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "file_upload"
    assert data["records_extracted"] == 1


def test_upload_data_file_csv_upload():
    """Test uploading a CSV file via the file endpoint."""
    import io
    import csv

    csv_buffer = io.StringIO()
    writer = csv.DictWriter(csv_buffer, fieldnames=["patient_id", "first_name", "last_name", "hkid", "diagnoses"])
    writer.writeheader()
    writer.writerow({"patient_id": "C001", "first_name": "CSV", "last_name": "Patient", "hkid": "Z1111111", "diagnoses": '[{"code":"J45.9","description":"Asthma"}]'})

    response = client.post(
        "/api/v1/upload-data",
        headers=HEADERS,
        files={
            "file": ("patients.csv", csv_buffer.getvalue(), "text/csv"),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "file_upload"


def test_upload_data_file_image_upload():
    """Test uploading an image file (will fail OCR processing but should not crash)."""
    # Create a tiny valid PNG (1x1 pixel)
    import base64
    tiny_png = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    )
    response = client.post(
        "/api/v1/upload-data",
        headers=HEADERS,
        files={
            "file": ("test.png", tiny_png, "image/png"),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "file_upload"


def test_upload_data_direct_no_hkid():
    """Test direct submission with no HKID — should save 0 records."""
    response = client.post(
        "/api/v1/upload-data/direct",
        json={
            "patient_data": {
                "patient_id": "NOHKID",
                "name": "No HKID Patient",
                "hkid": "",
                "dob": "",
                "gender": "",
                "diagnoses": [],
                "medications": [],
                "lab_results": [],
                "clinical_notes": "",
            }
        },
        headers=HEADERS,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["records_extracted"] == 0  # No HKID → skipped


def test_certification_clinic_not_found():
    """Test certification returns 404 for unknown clinic."""
    response = client.get("/api/v1/certification/nonexistent", headers=HEADERS)
    assert response.status_code == 404
