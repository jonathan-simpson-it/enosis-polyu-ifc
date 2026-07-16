"""
Tests for Enosis v0 API endpoints — Trading Domain.
"""

import sys
import os

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
    init_db()
    yield
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "v0-hackathon"


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "Enosis"


def test_auth_required():
    response = client.post("/api/v1/translate", json={})
    assert response.status_code == 401


def test_auth_invalid():
    response = client.post("/api/v1/translate", json={}, headers={"X-API-Key": "wrong"})
    assert response.status_code == 403


def test_trader_creation_on_ingest():
    payload = {
        "trader_id": "t-test-trader-001",
        "trader_name": "Test Trader Ltd",
        "source_system": "mock_trade",
        "source_url": "http://localhost:8080",
        "declaration_ids": ["D001"],
    }
    response = client.post("/api/v1/ingest", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processing"
    assert "job_id" in data


def test_translate_missing_trader():
    payload = {
        "trader_id": "nonexistent",
        "declaration_id": "D001",
        "declaration_data": {"declaration_number": "DEC-001"},
        "commodities": [{"description": "Test commodity"}],
    }
    response = client.post("/api/v1/translate", json=payload, headers=HEADERS)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_upload_rejects_without_consent():
    payload = {
        "trader_id": "t-test-upload",
        "declaration_id": "D001",
        "wco_declaration": {"test": "data"},
        "trader_consent": False,
    }
    response = client.post("/api/v1/upload", json=payload, headers=HEADERS)
    assert response.status_code == 400
    assert "consent" in response.json()["detail"].lower()


def test_upload_without_trader():
    payload = {
        "trader_id": "t-nonexistent",
        "declaration_id": "D001",
        "wco_declaration": {"resourceType": "WCODeclaration", "declaration": {}},
        "trader_consent": True,
    }
    response = client.post("/api/v1/upload", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "submitted"
    assert "MOCK-TSW-" in data["tsw_reference"]


def test_upload_status_not_found():
    response = client.get("/api/v1/upload/nonexistent-upload/status", headers=HEADERS)
    assert response.status_code == 404


def test_upload_data_no_file():
    response = client.post("/api/v1/upload-data", headers=HEADERS)
    assert response.status_code == 400


def test_upload_data_direct_json():
    payload = {
        "trader_id": "t-direct-001",
        "trader_name": "Direct Trader",
        "declaration_data": {
            "declaration_id": "DIRECT-001",
            "declaration_number": "DEC-DIRECT-001",
            "consignor_name": "Direct Trader Ltd",
            "consignee_name": "Buyer Ltd",
            "port_of_loading": "Yantian",
            "port_of_discharge": "Hong Kong",
            "commercial_notes": "Test declaration",
        },
    }
    response = client.post("/api/v1/upload-data/direct", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processing"
    assert data["source_type"] == "direct_submission"


def test_ingest_status_polling():
    payload = {
        "trader_id": "t-poll-001",
        "trader_name": "Poll Trader",
        "source_system": "mock_trade",
        "source_url": "http://localhost:8080",
        "declaration_ids": ["D001"],
    }
    resp = client.post("/api/v1/ingest", json=payload, headers=HEADERS)
    job_id = resp.json()["job_id"]

    status_resp = client.get(f"/api/v1/ingest/{job_id}/status", headers=HEADERS)
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["job_id"] == job_id


def test_certification_trader_not_found():
    response = client.get("/api/v1/certification/nonexistent-trader", headers=HEADERS)
    assert response.status_code == 404


def test_certification_with_trader():
    trader_id = "t-cert-001"
    client.post("/api/v1/ingest", json={
        "trader_id": trader_id,
        "trader_name": "Cert Trader",
        "source_system": "mock_trade",
        "source_url": "http://localhost:8080",
        "declaration_ids": ["D001"],
    }, headers=HEADERS)

    client.post("/api/v1/upload", json={
        "trader_id": trader_id,
        "declaration_id": "D001",
        "wco_declaration": {"resourceType": "WCODeclaration", "type": "customs_declaration"},
        "trader_consent": True,
    }, headers=HEADERS)

    response = client.get(f"/api/v1/certification/{trader_id}", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["trader_id"] == trader_id
    assert data["trader_name"] == "Cert Trader"
    assert "current_level" in data
    assert "declarations_submitted" in data


def test_upload_data_status_not_found():
    response = client.get("/api/v1/upload-data/nonexistent/status", headers=HEADERS)
    assert response.status_code == 404


def test_upload_data_direct_with_measures():
    payload = {
        "trader_id": "t-measures-001",
        "trader_name": "Measures Trader",
        "declaration_data": {
            "declaration_id": "MEAS-001",
            "declaration_number": "DEC-MEAS-001",
            "consignor_name": "Measures Trader Ltd",
            "consignee_name": "Buyer Ltd",
            "port_of_loading": "Yantian",
            "port_of_discharge": "Hong Kong",
            "country_of_origin": "CN",
            "country_of_destination": "HK",
            "total_declared_value": 100000.0,
            "gross_weight": 5000.0,
            "net_weight": 4800.0,
            "number_of_packages": 50,
            "container_number": "TEST1234567",
            "incoterms": "CIF",
            "transport_mode": "Sea",
            "commodities": [{"description": "Test goods", "hs_code_hint": "8471"}],
            "goods_items": [{"description": "Test item", "quantity": 100, "unit": "PCE", "declared_value": 50000.0, "weight": 100.0, "country_of_origin": "CN"}],
            "commercial_notes": "Test submission with all fields",
        },
    }
    response = client.post("/api/v1/upload-data/direct", json=payload, headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] == "direct_submission"
