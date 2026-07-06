# Enosis — Complete Product Requirements Document (PRD)

## v0 · v1 · v2 · v3 · v4 · v5

---

**Product Name:** Enosis
**Tagline:** The Universal Data Translation Layer
**Mission:** Unlock data so every AI application can work
**Core Principle:** *"Zero additional work. Zero friction. Just automatic translation."*

---

# PHASE 0: HACKATHON DEMO (v0)

## 1. v0 Overview

### Goal
Win PolyU IFC 2026 by demonstrating:
1. Technical capability — Extract, translate, format healthcare data
2. Friction reduction — Automatic, zero clinic effort
3. Certification vision — Smart Clinic Certified badges create viral adoption

### Timeline: 4 Weeks

| Week | Focus |
|---|---|
| Week 1 | Project setup, Docker, database, FastAPI skeleton |
| Week 2 | DeepSeek integration, FHIR conversion |
| Week 3 | Playwright scraping, Tesseract OCR |
| Week 4 | Mock eHealth+, certification, demo script |

### v0 Success Criteria

| Criterion | Measurement |
|---|---|
| Working demo | End-to-end flow: CMS → translation → FHIR → mock upload |
| Technical credibility | DeepSeek API + FHIR R5 + screen scraping working |
| User experience | "Zero work" — clinic does nothing different |
| Judges impressed | Clear problem, elegant solution, big vision |

---

## 2. v0 Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Language | Python | 3.11+ | Core development |
| Web Framework | FastAPI | 0.115+ | REST API with auto docs |
| Database | SQLite | 3.40+ | Local data storage |
| ORM | SQLAlchemy | 2.0+ | Database abstraction |
| LLM | DeepSeek API | v4-flash | Translation & mapping |
| Browser Automation | Playwright | 1.40+ | Screen scraping |
| OCR | Tesseract | 5.0+ | Handwritten text recognition |
| FHIR | fhir.resources | 7.0+ | FHIR R5 conversion |
| HTTP Client | httpx | 0.28+ | API calls |
| Validation | Pydantic | 2.0+ | Request/response models |
| Container | Docker | 24+ | Application containerization |
| Orchestration | Docker Compose | 2.0+ | Local development |
| CI/CD | GitHub Actions | Latest | Automated testing |

### Requirements.txt

```txt
fastapi==0.115.6
uvicorn==0.34.0
sqlalchemy==2.0.36
pydantic==2.10.3
pydantic-settings==2.5.2
playwright==1.48.0
pytesseract==0.3.13
Pillow==10.4.0
fhir.resources==7.0.0
httpx==0.28.0
python-dotenv==1.0.1
alembic==1.14.0
```

### v0 Testing Strategy

**Testing Pyramid:**

| Level | Coverage | Tools | Targets |
|---|---|---|---|
| **Unit tests** | 80%+ | pytest | Models, schemas, certification logic, FHIR builders |
| **Integration tests** | All external APIs | pytest + httpx | API endpoints against test DB |
| **End-to-end tests** | Critical paths | Playwright | CMS scraping → ingest → translate → upload |
| **API contract tests** | All endpoints | OpenAPI + schemathesis | Request/response validation |
| **Security tests** | API key, injection | OWASP ZAP | Auth bypass, SQL injection, XSS |

**Test Data Strategy:**

| Source | Purpose | Examples |
|---|---|---|
| **Synthetic data** | Found in test fixtures | Generated patients, diagnoses, FHIR bundles |
| **Edge cases** | Boundary testing | Missing fields, empty arrays, malformed JSON, extreme values |
| **Negative tests** | Error handling | Invalid API keys, nonexistent patients, consent refusal |

### What We Skip in v0

| Skip | Why |
|---|---|
| PostgreSQL | SQLite is fine for demo |
| Redis | Not needed for demo scale |
| Celery + RabbitMQ | Use asyncio instead |
| Kubernetes | Docker Compose is enough |
| OAuth2 | Simple API key for demo |
| Real eHealth+ integration | Mock it |
| Qwen2.5-VL | Tesseract sufficient for demo |
| RLHF | Manual validation for demo |
| Production monitoring | Not needed for demo |

---

## 3. v0 Database Schema (SQLite)

```python
# models.py
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, Integer
from sqlalchemy.dialects.sqlite import UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    cms_type = Column(String(100), default="mock")
    certification_level = Column(String(20), default="none")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID, nullable=False)
    hkid = Column(String(20), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    dob = Column(String(10))
    gender = Column(String(1))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Translation(Base):
    __tablename__ = "translations"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID, nullable=False)
    patient_id = Column(UUID, nullable=False)
    source_type = Column(String(50))  # diagnosis, medication, lab, note
    original_text = Column(String)
    translated_text = Column(String)
    confidence = Column(Float)
    mapped_code = Column(String(50))
    mapping_standard = Column(String(50))  # ICD-10, SNOMED-CT
    fhir_resource = Column(JSON)
    ehealth_status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.now)

class FHIRBundle(Base):
    __tablename__ = "fhir_bundles"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID, nullable=False)
    patient_id = Column(UUID, nullable=False)
    bundle = Column(JSON, nullable=False)
    upload_status = Column(String(20), default="pending")
    ehealth_reference = Column(String(255))
    created_at = Column(DateTime, default=datetime.now)

class CertificationTracking(Base):
    __tablename__ = "certification_tracking"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID, nullable=False, unique=True)
    records_uploaded = Column(Integer, default=0)
    accuracy_rate = Column(Float, default=0.0)
    current_level = Column(String(20), default="none")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
```

---

## 4. v0 API Endpoints

### Base URL
```
http://localhost:8000
```

### Authentication (Simple API Key)
```
X-API-Key: dev-api-key-123456
```

### Health Check
```
GET /health

Response:
{
    "status": "healthy",
    "version": "v0-hackathon",
    "services": {
        "database": "connected",
        "deepseek_api": "available"
    }
}
```

### Ingest Data
```
POST /api/v1/ingest

Request:
{
    "clinic_id": "uuid",
    "clinic_name": "Central Clinic",
    "cms_type": "mock",
    "cms_url": "http://localhost:8080/patients.html",
    "patient_ids": ["P001", "P002"]  # Optional
}

Response:
{
    "job_id": "uuid",
    "status": "processing",
    "patients_scraped": 5,
    "estimated_time": 10
}

GET /api/v1/ingest/{job_id}/status

Response:
{
    "job_id": "uuid",
    "status": "completed",
    "patients_found": 5,
    "patients_extracted": 5,
    "data": [
        {
            "patient_id": "P001",
            "name": "Chan Tai Man",
            "hkid": "A1234567",
            "dob": "1955-01-01",
            "gender": "M",
            "diagnoses": [...],
            "medications": [...]
        }
    ]
}
```

### Translate Data
```
POST /api/v1/translate

Request:
{
    "clinic_id": "uuid",
    "patient_id": "uuid",
    "patient_data": {
        "name": {"first": "Tai Man", "last": "Chan"},
        "hkid": "A1234567",
        "dob": "1955-01-01",
        "gender": "M"
    },
    "diagnoses": [
        {"code": "E11.9", "description": "Type 2 diabetes mellitus"}
    ],
    "medications": [
        {"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily"}
    ],
    "lab_results": [
        {"test": "HbA1c", "value": "7.2", "unit": "%", "reference": "< 7.0"}
    ],
    "clinical_notes": "Patient presents with fatigue..."
}

Response:
{
    "job_id": "uuid",
    "status": "completed",
    "fhir_bundle": {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": [...]
    },
    "translations": [
        {
            "original": "E11.9 - Type 2 diabetes mellitus",
            "translated": "ICD-10: E11.9",
            "mapped_code": "E11.9",
            "mapping_standard": "ICD-10",
            "confidence": 0.95
        }
    ],
    "token_usage": {
        "input_tokens": 850,
        "output_tokens": 420
    }
}
```

### Upload to eHealth+ (Mock)
```
POST /api/v1/upload

Request:
{
    "clinic_id": "uuid",
    "patient_id": "uuid",
    "fhir_bundle": {...},
    "patient_consent": true
}

Response:
{
    "upload_id": "uuid",
    "status": "submitted",
    "ehealth_reference": "MOCK-EH-2026-001234",
    "message": "Successfully uploaded to eHealth+ (mock)"
}

GET /api/v1/upload/{upload_id}/status

Response:
{
    "upload_id": "uuid",
    "status": "completed",
    "ehealth_reference": "MOCK-EH-2026-001234",
    "uploaded_at": "2026-07-06T10:30:00Z"
}
```

### Smart Clinic Certification (Mock)
```
GET /api/v1/certification/{clinic_id}

Response:
{
    "clinic_id": "uuid",
    "clinic_name": "Central Clinic",
    "current_level": "gold",
    "records_uploaded": 1234,
    "accuracy_rate": 0.94,
    "badge_url": "http://localhost:8000/badges/gold.svg",
    "levels": [
        {"level": "bronze", "achieved": true, "date": "2026-01-15"},
        {"level": "silver", "achieved": true, "date": "2026-03-20"},
        {"level": "gold", "achieved": true, "date": "2026-06-01"}
    ],
    "next_level": {
        "level": "platinum",
        "records_required": 1000,
        "accuracy_required": 0.95
    }
}

GET /badges/{level}.svg
```

---

## 5. v0 Folder Structure

```
enosis-v0/
├── src/
│   ├── main.py                  # FastAPI app entry
│   ├── config.py                # Environment variables
│   ├── database.py              # SQLite connection
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic models
│   ├── api/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── ingest.py
│   │   ├── translate.py
│   │   ├── upload.py
│   │   └── certification.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── scrape.py            # Playwright
│   │   ├── ocr.py               # Tesseract
│   │   ├── translate.py         # DeepSeek
│   │   ├── fhir.py              # FHIR R5
│   │   └── ehealth.py           # Mock
│   ├── utils/
│   │   ├── __init__.py
│   │   └── logger.py
│   └── badges/
│       ├── bronze.svg
│       ├── silver.svg
│       ├── gold.svg
│       ├── platinum.svg
│       └── diamond.svg
├── mock_cms/
│   ├── index.html
│   ├── dashboard.html
│   ├── patient.html
│   └── data/
│       ├── patients.json
│       └── diagnoses.json
├── tests/
│   ├── test_api.py
│   └── test_services.py
├── scripts/
│   ├── seed_database.py
│   └── run_demo.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 6. v0 Environment Variables

```env
# API Configuration
API_KEY="dev-api-key-123456"

# DeepSeek API
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-v4-flash"

# Database
DATABASE_URL="sqlite:///./enosis.db"

# Tesseract OCR
TESSERACT_CMD="/usr/bin/tesseract"

# Mock eHealth+
MOCK_EHEALTH_URL="http://localhost:8000/mock/ehealth"

# Logging
LOG_LEVEL="INFO"
```

---

## 7. v0 Docker Setup

### Dockerfile
```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -y \
    google-chrome-stable \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-chi-sim \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install chromium

COPY src/ src/
COPY mock_cms/ mock_cms/

EXPOSE 8000 8080

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    container_name: enosis-api
    ports:
      - "8000:8000"
    volumes:
      - ./src:/app/src
      - ./mock_cms:/app/mock_cms
      - ./badges:/app/src/badges
      - ./enosis.db:/app/enosis.db
    env_file:
      - .env
    environment:
      - TESSERACT_CMD=/usr/bin/tesseract
    command: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mock-cms:
    image: nginx:alpine
    container_name: mock-cms
    ports:
      - "8080:80"
    volumes:
      - ./mock_cms:/usr/share/nginx/html
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 8. v0 Demo Script

```python
# scripts/run_demo.py
import httpx
import json
import time
import uuid

BASE_URL = "http://localhost:8000"
API_KEY = "dev-api-key-123456"

def demo():
    print("\n" + "="*60)
    print("ENOSIS v0 DEMO")
    print("="*60 + "\n")

    headers = {"X-API-Key": API_KEY}

    # Step 1: Health Check
    print("Step 1: Health Check")
    response = httpx.get(f"{BASE_URL}/health", headers=headers)
    print(f"  ✓ Health: {response.json()}\n")

    # Step 2: Ingest Data
    print("Step 2: Ingest Data")
    ingest_payload = {
        "clinic_id": str(uuid.uuid4()),
        "clinic_name": "Central Clinic",
        "cms_type": "mock",
        "cms_url": "http://localhost:8080/patients.html"
    }
    response = httpx.post(f"{BASE_URL}/api/v1/ingest", json=ingest_payload, headers=headers)
    job_id = response.json()["job_id"]
    print(f"  ✓ Job started: {job_id}")

    time.sleep(3)

    response = httpx.get(f"{BASE_URL}/api/v1/ingest/{job_id}/status", headers=headers)
    ingest_status = response.json()
    print(f"  ✓ Status: {ingest_status['status']}")
    print(f"  ✓ Patients found: {ingest_status['patients_found']}\n")

    # Step 3: Translate Data
    print("Step 3: Translate Data")
    translate_payload = {
        "clinic_id": ingest_payload["clinic_id"],
        "patient_id": ingest_status["data"][0]["patient_id"],
        "patient_data": ingest_status["data"][0],
        "diagnoses": ingest_status["data"][0].get("diagnoses", []),
        "medications": ingest_status["data"][0].get("medications", [])
    }
    response = httpx.post(f"{BASE_URL}/api/v1/translate", json=translate_payload, headers=headers)
    translate_result = response.json()
    print(f"  ✓ Translation complete")
    print(f"  ✓ FHIR resources: {len(translate_result['fhir_bundle']['entry'])}")
    print(f"  ✓ Avg confidence: {sum(t['confidence'] for t in translate_result['translations']) / len(translate_result['translations']):.2f}\n")

    # Step 4: Upload to eHealth+
    print("Step 4: Upload to eHealth+")
    upload_payload = {
        "clinic_id": ingest_payload["clinic_id"],
        "patient_id": ingest_status["data"][0]["patient_id"],
        "fhir_bundle": translate_result["fhir_bundle"],
        "patient_consent": True
    }
    response = httpx.post(f"{BASE_URL}/api/v1/upload", json=upload_payload, headers=headers)
    upload_result = response.json()
    print(f"  ✓ Upload submitted: {upload_result['upload_id']}")
    print(f"  ✓ eHealth+ reference: {upload_result['ehealth_reference']}\n")

    # Step 5: Certification
    print("Step 5: Smart Clinic Certification")
    response = httpx.get(f"{BASE_URL}/api/v1/certification/{ingest_payload['clinic_id']}", headers=headers)
    cert = response.json()
    print(f"  ✓ Clinic: {cert['clinic_name']}")
    print(f"  ✓ Certification Level: {cert['current_level'].upper()}")
    print(f"  ✓ Records uploaded: {cert['records_uploaded']}")
    print(f"  ✓ Badge URL: {cert['badge_url']}\n")

    print("="*60)
    print("✓ DEMO COMPLETE")
    print("="*60)

if __name__ == "__main__":
    demo()
```

---

## 9. v0 Cost Estimation

### One-Time Costs

| Item | Estimated Cost | Notes |
|---|---|---|
| Domain name | $50-100/year | enosis.ai or similar |
| Cloud hosting (demo) | $0-200/month | Single VM or Docker host |
| SSL certificate | $0 (Let's Encrypt) | Free |
| DeepSeek API credits | $50-100 | Pay-as-you-go for demo |
| **Total one-time** | **$100-400** | |

### Monthly Costs (Demo Scale)

| Service | Estimated Cost | Notes |
|---|---|---|
| Single VM / App Service | $50-150 | 1 vCPU, 2GB RAM |
| SQLite (local) | $0 | Included |
| DeepSeek API | $50-200 | ~100K tokens/day demo usage |
| Total | **$100-350/month** | |

---

# PHASE 1: PRODUCTION MVP (v1)

## 9. v1 Overview

### Goal
Deploy to 10-20 pilot clinics with real eHealth+ integration

### Timeline: Months 2-4

| Month | Focus |
|---|---|
| Month 1 | PostgreSQL migration, Redis, Celery setup |
| Month 2 | OAuth2 + JWT, real eHealth+ Bronze integration |
| Month 3 | Human-in-the-loop validation, React frontend |
| Month 4 | Kubernetes deployment, 10+ pilot clinics |

### v1 Success Criteria

| Criterion | Measurement |
|---|---|
| Real eHealth+ integration | Bronze accreditation achieved |
| Pilot clinics | 10-20 clinics actively using |
| Zero work validated | Clinics report no additional effort |
| Revenue | First paying clinics (government subsidy) |

---

## 10. v1 eHealth+ Connectivity Accreditation

### Accreditation Levels

| Level | Requirement | Data Types |
|---|---|---|
| **Bronze Mark** | Deposit at least 1 type of eHR | Any 1 of 11 types |
| **Silver Mark** | Deposit 5 essential types | Allergies, encounters, medications, immunizations, lab/radiology |
| **Gold Mark** | Deposit more than 5 types | All 11 types |

### Technical Requirements

Enosis must satisfy all of the following to connect to eHealth+:

| Requirement | Implementation |
|---|---|
| Registered HCP | Enosis clinics must be registered healthcare providers in Hong Kong's eHealth System |
| Accredited EMRS | Enosis must be accredited as an Electronic Medical Record System |
| HL7 Interface | Comply with HL7 interface specifications for data exchange |
| AES-256 Encryption | Patient data encrypted at rest and in transit |
| Multi-Factor Auth | All clinic staff accounts require MFA |
| Role-Based Access | Granular RBAC — doctors, nurses, admin, read-only |
| Internet Reliability | Secure, reliable internet connection at clinic |
| Audit Logging | All access and modifications logged |
| Patient Consent | Explicit consent before any data upload |

### eHealth+ Connectivity Support Scheme

| Detail | Value |
|---|---|
| Monthly sponsorship | **HK$500 per eligible registered doctor** |
| Duration | Up to 12 months |
| Application deadline | **March 31, 2026** |
| Support provided | Dedicated government technical support |

### Enosis Path to Accreditation

```
v0: Mock eHealth+ (demo only)
v1: Bronze Mark — 1+ eHR types submitted
v2: Silver Mark — 5 essential types
v3: Gold Mark — All 11 types
```

---

## 11. v1 Technology Stack Additions

| Component | Technology | Purpose |
|---|---|---|
| Database | PostgreSQL 15+ | Production-ready, ACID, pgvector |
| Cache | Redis 7+ | Rate limiting, session storage |
| Async | Celery 5.4+ | Background tasks |
| Message Broker | RabbitMQ 3.13+ | Task distribution |
| Auth | OAuth2 + JWT | Secure clinic access |
| eHealth+ | Real API | Bronze accreditation |
| Frontend | React 18+ | Clinic dashboard |
| Deployment | Kubernetes (AKS) | Scalable production |
| Monitoring | Prometheus + Grafana | Production metrics |
| Logging | ELK Stack | Centralized logging |
| Tracing | Jaeger (OpenTelemetry) | Distributed tracing |
| Edge Agent | Lightweight Python daemon | Offline-first clinic scraping |

---

## 11. v1 Database Schema (PostgreSQL + pgvector)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Clinics
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    cms_type VARCHAR(100),
    cms_config JSONB,
    ehealth_credentials JSONB,
    accreditation_level VARCHAR(20) DEFAULT 'none',
    certification_level VARCHAR(20) DEFAULT 'none',
    certification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    hkid VARCHAR(20) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    dob DATE,
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(clinic_id, hkid)
);

-- Patient Records (raw data from CMS)
CREATE TABLE patient_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    record_type VARCHAR(50),
    raw_data JSONB NOT NULL,
    extracted_data JSONB,
    extraction_status VARCHAR(20) DEFAULT 'pending',
    extracted_at TIMESTAMP,
    source_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Translations (with embeddings for RAG)
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    record_id UUID REFERENCES patient_records(id) ON DELETE SET NULL,
    source_type VARCHAR(50),
    source_language VARCHAR(10) DEFAULT 'zh',
    original_text TEXT,
    original_code VARCHAR(50),
    translated_text TEXT,
    translated_code VARCHAR(50),
    mapped_standard VARCHAR(50),
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    needs_review BOOLEAN DEFAULT FALSE,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    correction TEXT,
    embedding vector(384),
    model_used VARCHAR(50),
    fhir_resource_type VARCHAR(50),
    fhir_resource JSONB,
    ehealth_status VARCHAR(20) DEFAULT 'pending',
    ehealth_reference VARCHAR(255),
    ehealth_uploaded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_translations_clinic ON translations(clinic_id);
CREATE INDEX idx_translations_patient ON translations(patient_id);
CREATE INDEX idx_translations_embedding ON translations
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- FHIR Bundles
CREATE TABLE fhir_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    bundle JSONB NOT NULL,
    bundle_type VARCHAR(50) DEFAULT 'transaction',
    patient_consent BOOLEAN DEFAULT FALSE,
    consent_proof TEXT,
    upload_status VARCHAR(20) DEFAULT 'pending',
    upload_attempts INT DEFAULT 0,
    last_upload_at TIMESTAMP,
    ehealth_reference VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sync Queue (Edge Agent)
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    action VARCHAR(50),
    payload JSONB NOT NULL,
    priority INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 5,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Certification Tracking
CREATE TABLE certification_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    current_level VARCHAR(20) DEFAULT 'none',
    records_uploaded INT DEFAULT 0,
    accuracy_rate FLOAT DEFAULT 0,
    patient_rating FLOAT,
    months_continuous INT DEFAULT 0,
    last_level_up_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Corpus (Training data for RLHF)
CREATE TABLE corpus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(50),
    original_text TEXT,
    translated_text TEXT,
    correction TEXT,
    confidence FLOAT,
    embedding vector(384),
    used_for_training BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 12. v1 API Additions

### Authentication
```yaml
POST /auth/login
Request: { "email": "string", "password": "string" }
Response: { "access_token": "string", "token_type": "bearer", "expires_in": 3600 }

POST /auth/refresh
Request: { "refresh_token": "string" }
Response: { "access_token": "string", "expires_in": 3600 }

POST /auth/logout
Request: { "refresh_token": "string" }
Response: { "status": "logged_out" }
```

### Enhanced Translation (with Async)
```yaml
POST /translate
Request: Same as v0 with additional options
Response: { "job_id": "uuid", "status": "queued" }

GET /translate/{job_id}/status
Response: { "status": "completed|processing|failed", "result": {...} }
```

### Enhanced Upload (Real eHealth+)
```yaml
POST /upload
Request: Same as v0
Response: { "upload_id": "uuid", "status": "submitted" }

GET /upload/{upload_id}/status
Response: {
    "status": "completed|processing|failed",
    "ehealth_reference": "string",
    "accreditation_level": "bronze"
}
```

### Clinic Management
```yaml
GET /clinics
Response: { "clinics": [...] }

GET /clinics/{clinic_id}/status
Response: {
    "clinic_id": "uuid",
    "name": "string",
    "accreditation_level": "bronze",
    "certification_level": "silver",
    "records_uploaded": 1234,
    "accuracy_rate": 0.94,
    "last_sync": "timestamp"
}
```

---

## 13. v1 Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enosis-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: enosis-api
  template:
    metadata:
      labels:
        app: enosis-api
    spec:
      containers:
      - name: api
        image: enosis/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: enosis-secrets
              key: database-url
        - name: DEEPSEEK_API_KEY
          valueFrom:
            secretKeyRef:
              name: enosis-secrets
              key: deepseek-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: enosis-api
spec:
  selector:
    app: enosis-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: enosis-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: enosis-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 14. v1 Edge Agent Architecture

### Overview
The Edge Agent is a lightweight Python daemon that runs on the clinic's local server. It operates silently in the background, extracting data from the clinic's CMS without requiring any changes to the clinic's workflow.

### Architecture

```python
# edge_agent/main.py
class EnosisEdgeAgent:
    def __init__(self, clinic_id: str, config: dict):
        self.clinic_id = clinic_id
        self.config = config
        self.db = sqlite3.connect("edge_agent.db")
        self.sync_queue = []
        self.is_online = self._check_connectivity()

    def run(self):
        """Main loop — runs every 15 minutes"""
        while True:
            new_data = self.scrape_cms()
            for patient in new_data:
                self.process_patient(patient)
            if self.is_online:
                self.sync_to_cloud()
            time.sleep(900)  # 15 minutes

    def scrape_cms(self):
        """Extract data from clinic CMS via Playwright"""
        pass

    def process_patient(self, patient_data):
        """Validate, anonymize, encrypt, store, queue"""
        pass

    def sync_to_cloud(self):
        """Sync queued data to cloud backend"""
        for item in self.sync_queue:
            response = self._send_to_cloud(item)
            if response.success:
                self.sync_queue.remove(item)
            else:
                self._retry(item)

    def _check_connectivity(self):
        """Ping cloud health endpoint"""
        try:
            requests.get(f"{self.cloud_url}/health", timeout=5)
            return True
        except:
            return False
```

### Offline-First Data Flow

```
Clinic CMS → Edge Agent → Local SQLite (encrypted)
                               ↓ (when online)
                        Cloud Backend → eHealth+
```

### Local Storage

| Data Type | Storage | Encryption | Retention |
|---|---|---|---|
| Patient demographics | SQLite | AES-256 | Until synced |
| Diagnosis codes | SQLite | AES-256 | Until synced |
| Medication records | SQLite | AES-256 | Until synced |
| Lab results | SQLite | AES-256 | Until synced |
| Scanned documents | Filesystem | AES-256 | Until synced |
| Screenshots (debug) | Filesystem | None | 7 days |

### Security

| Feature | Implementation |
|---|---|
| Tamper-proof logging | All actions logged with HMAC signature |
| Secure boot | Verify agent binary integrity on startup |
| Remote wipe | API endpoint to wipe agent data if clinic disconnects |
| Auto-update | Signed updates from cloud backend |
| Network isolation | Outbound HTTPS only to whitelisted endpoints |

---

## 15. v1 Data Privacy & Security

### Data Classification

| Classification | Definition | Handling |
|---|---|---|
| **Public** | Non-sensitive, non-personal | No encryption required |
| **Internal** | Clinic operational data | Standard encryption |
| **Confidential** | Patient data, diagnoses, medications | AES-256 encryption |
| **Restricted** | HKID numbers, sensitive health info | AES-256 + access controls + full audit |

### Data Retention Policy

| Data Type | Retention Period | Deletion Method |
|---|---|---|
| Patient records | 10 years (HK legal requirement) | Secure deletion (overwrite + verify) |
| Translations | 5 years | Anonymization (remove PII) |
| Audit logs | 7 years | Archive to cold storage |
| Training data | Anonymized, indefinite | N/A (no PII retained) |
| Edge agent cache | Until confirmed synced | Automatic deletion |
| Debug screenshots | 7 days | Automatic deletion |

### Data Breach Response Plan

```python
# services/security/breach.py
class BreachResponse:
    def __init__(self):
        self.incident_id = None
        self.timeline = []

    def detect(self, alert: dict):
        self.incident_id = str(uuid.uuid4())
        self.timeline.append({"event": "detected", "time": datetime.now()})
        self._notify_team(alert)

    def investigate(self):
        """Determine scope, cause, and impact"""
        self.timeline.append({"event": "investigating", "time": datetime.now()})

    def notify_regulator(self):
        """Notify PCPD within 72 hours (PDPO requirement)"""
        self.timeline.append({"event": "regulator_notified", "time": datetime.now()})

    def notify_patients(self):
        """Notify affected patients"""
        self.timeline.append({"event": "patients_notified", "time": datetime.now()})

    def remediate(self):
        """Implement fixes"""
        self.timeline.append({"event": "remediated", "time": datetime.now()})

    def review(self):
        """Post-incident review"""
        self.timeline.append({"event": "reviewed", "time": datetime.now()})
```

### Breach Response Timeline

| Step | Timeframe | Action |
|---|---|---|
| Detection | Immediate | Automated alert, identify scope |
| Containment | < 1 hour | Isolate affected systems, block access |
| Investigation | < 4 hours | Determine cause, data affected |
| Regulator notification | < 72 hours | Notify PCPD per PDPO requirements |
| Patient notification | < 7 days | Notify affected individuals |
| Remediation | < 30 days | Fix root cause |
| Post-incident review | < 60 days | Update policies, train staff |

---

## 16. v1 PDPO & AI Compliance

### Hong Kong PDPO Requirements

Hong Kong's Privacy Commissioner for Personal Data (PCPD) requires all organizations using AI to implement:

| Requirement | Enosis Implementation |
|---|---|
| **AI governance structures** | Define roles: Chief AI Ethics Officer, Compliance Committee |
| **Risk assessments** | Quarterly AI-specific risk assessments for translation models |
| **Privacy Impact Assessments (PIA)** | Conduct PIA before deploying DeepSeek or any new AI system |
| **Incident response plans** | AI-tailored incident response (hallucinations, data leaks, bias) |
| **Continuous monitoring** | Real-time confidence scoring, drift detection, bias monitoring |
| **Employee training** | Mandatory annual training on AI and data privacy for all clinic staff |
| **Transparency** | Patient-facing disclosure: "This clinic uses Enosis AI for data translation" |

### Healthcare AI Compliance (PCPD Specific)

The PCPD has emphasized that healthcare organizations using AI must have:
- **AI governance structures** with defined roles and responsibilities
- **Risk assessments** tailored to AI-specific risks (hallucination, bias, privacy)
- **Privacy Impact Assessments** before deployment
- **Incident response plans** for AI-related incidents
- **Continuous monitoring** of AI system performance
- **Employee training** on AI usage and limitations
- **Transparency** in patient communication about AI involvement

### Compliance Module

```python
# services/compliance/pdpo.py
class PDPOCompliance:
    def __init__(self, clinic_id: str):
        self.clinic_id = clinic_id
        self.pia_status = "not_started"
        self.risk_assessments = []
        self.incident_log = []

    def conduct_pia(self, ai_system: dict) -> dict:
        """Privacy Impact Assessment"""
        return {
            "system": ai_system["name"],
            "data_processed": ai_system["data_types"],
            "risk_level": self._assess_risk(ai_system),
            "mitigations": self._recommend_mitigations(ai_system),
            "approved": False,
            "review_date": datetime.now() + timedelta(days=365)
        }

    def log_ai_incident(self, incident: dict):
        """Log and escalate AI-related incidents"""
        self.incident_log.append({
            "timestamp": datetime.now(),
            "type": incident["type"],
            "severity": incident["severity"],
            "description": incident["description"],
            "resolution": incident.get("resolution"),
            "notified_pcpd": incident["severity"] in ["high", "critical"]
        })

    def generate_transparency_notice(self) -> str:
        """Patient-facing AI disclosure"""
        return (
            "This clinic uses Enosis, an AI-powered data translation platform, "
            "to securely translate and upload your health records to eHealth+. "
            "Your data is encrypted at all times. You have the right to opt out "
            "by informing your doctor."
        )
```

---

## 17. v1 Monitoring & Observability

### Key Metrics

| Category | Metrics | Target |
|---|---|---|
| **API Performance** | Latency (p50/p95/p99), throughput, error rate | p99 < 2s, error < 1% |
| **Translation** | Volume, confidence distribution, accuracy trend | Avg confidence > 0.90 |
| **Ingestion** | Scrape success rate, OCR accuracy, parse success | Success > 99% |
| **Upload (eHealth+)** | Upload success rate, latency, retry count | Success > 99.5% |
| **Edge Agent** | Sync success rate, offline duration, queue depth | Queue < 100 |
| **Security** | Failed logins, unusual access, API key usage | Zero breaches |
| **Business** | Active clinics, patients processed, certification levels | Per-clinic dashboard |

### Alerting Thresholds

| Alert | Threshold | Action |
|---|---|---|
| High error rate | > 5% in 5 minutes | Page on-call engineer |
| High latency | p95 > 10 seconds | Investigate + scale |
| eHealth+ upload failure | Any failure | Retry, escalate if persistent |
| Low confidence | > 10% below threshold | Review model + retrain |
| Sync queue overflow | > 100 items | Investigate connectivity |
| Security incident | Any | Immediate response + PCPD |
| Translation drift | Confidence drop > 5% in 24h | Model evaluation |

### Dashboards

```yaml
# Grafana dashboards
dashboards:
  overview:
    - Active clinics
    - Total patients processed
    - Translation volume (24h)
    - Upload success rate
  clinic_detail:
    - Per-clinic metrics
    - Certification status
    - Translation accuracy
    - Sync health
  technical:
    - API latency heatmap
    - Error rate by endpoint
    - Database performance
    - Queue depth
```

### Cost Estimation (v1 — 50 Clinics)

| Service | Estimated Cost | Notes |
|---|---|---|
| Kubernetes cluster (AKS) | $500-1,000/month | 3 nodes |
| PostgreSQL (Azure DB) | $200-400/month | Managed, HA |
| Redis Cache | $50-150/month | Standard tier |
| Object storage (Blob) | $50-200/month | FHIR bundles, logs |
| Load balancer | $50-150/month | |
| Monitoring + Logging | $50-100/month | Prometheus, Grafana, ELK |
| DeepSeek API | $500-1,000/month | ~1M tokens/day |
| Edge agent hosting | $200-500/month | 50 clinic servers |
| **Total** | **$1,600-3,500/month** | |

---

# PHASE 2: SCALE & CERTIFICATION (v2)

## 14. v2 Overview

### Goal
50+ clinics, full Smart Clinic Certified program, Silver accreditation

### Timeline: Months 5-8

| Month | Focus |
|---|---|
| Month 5 | Qwen2.5-VL OCR upgrade, ZVec RAG |
| Month 6 | RLHF loop, certification program launch |
| Month 7 | Public clinic directory, Silver accreditation |
| Month 8 | Analytics dashboard, 50+ clinics |

### v2 Success Criteria

| Criterion | Measurement |
|---|---|
| Smart Clinic Certified | 10+ clinics certified |
| Silver accreditation | Achieved |
| Patient directory | Live and searchable |
| Revenue | HK$15M+ annual run rate |

---

## 15. v2 Technology Stack Additions

| Component | Technology | Purpose |
|---|---|---|
| OCR | Qwen2.5-VL | Replaces Tesseract for higher accuracy |
| RAG | ZVec (Alibaba) | Embedded vector database for local RAG |
| RLHF | Custom pipeline | Learn from human corrections |
| Directory | React + Next.js | Public-facing clinic directory |
| Analytics | Superset / Metabase | Translation accuracy dashboard |
| Auto-Scaling | Kubernetes HPA | Handle 50+ clinics |

---

## 16. v2 ZVec Integration

### What is ZVec?
- Open-source embedded vector database from Alibaba's Tongyi Lab
- "SQLite for vectors" — runs in-process, no separate server
- Built on Proxima (Alibaba's production vector search engine)
- Up to 2x faster than cloud-based vector DBs

### Why ZVec for Enosis

| Advantage | Benefit |
|---|---|
| Zero network latency | Faster RAG responses |
| No separate service | Simpler deployment |
| True offline operation | Privacy-first, data stays local |
| Hybrid search | Vector + full-text + scalar filters |
| Embedded | Perfect for edge agent |

### Healthcare RAG Requirements

| Requirement | Implementation |
|---|---|
| **Encryption** | All RAG data encrypted at rest (AES-256) and in transit (TLS 1.3) |
| **Provenance tagging** | Every retrieved result tagged with source document, timestamp, model version |
| **Audit trails** | All RAG queries logged: who, what, when, which results returned |
| **Clinician feedback** | Clinicians can rate/correct results → fed back into RLHF pipeline |
| **Multimodal inputs** | Support text diagnoses, medication names, lab values, clinical notes |
| **Hallucination mitigation** | Confidence scoring < 0.85 → flag for human review; uncertainty detection via output entropy |

### Integration Code

```python
# services/rag.py
import zvec
import hashlib
import hmac
from sentence_transformers import SentenceTransformer
from datetime import datetime

class EnosisRAG:
    def __init__(self, db_path: str, encryption_key: str = None):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.encryption_key = encryption_key
        self.db = zvec.Zvec(db_path, encryption_key=encryption_key)
        self.collection = self._init_collection()
        self.audit_log = []

    def _init_collection(self):
        schema = zvec.CollectionSchema(
            name="clinic_knowledge",
            fields=[
                zvec.Field(name="id", dtype=zvec.DataType.STRING, is_primary=True),
                zvec.Field(name="content", dtype=zvec.DataType.TEXT),
                zvec.Field(name="embedding", dtype=zvec.DataType.FLOAT_VECTOR, dim=384),
                zvec.Field(name="metadata", dtype=zvec.DataType.JSON),
            ]
        )
        return self.db.create_or_open_collection(schema)

    def add_document(self, doc_id: str, content: str, metadata: dict):
        embedding = self.model.encode(content).tolist()
        self.collection.insert([{
            "id": doc_id,
            "content": content,
            "embedding": embedding,
            "metadata": {
                **metadata,
                "indexed_at": datetime.now().isoformat(),
                "content_hash": hashlib.sha256(content.encode()).hexdigest()
            }
        }])

    def search(self, query: str, top_k: int = 5, filter: str = None,
               clinician_id: str = None) -> list:
        query_embedding = self.model.encode(query).tolist()
        results = self.collection.search(
            vector=query_embedding,
            top_k=top_k,
            filter=filter,
            full_text_query=query
        )

        # Provenance tagging
        for r in results:
            r["provenance"] = {
                "source": "clinic_knowledge_base",
                "retrieved_at": datetime.now().isoformat(),
                "model": "all-MiniLM-L6-v2",
                "confidence": self._calculate_confidence(query_embedding, r["embedding"])
            }

        # Audit trail
        self.audit_log.append({
            "query": query,
            "clinician_id": clinician_id,
            "timestamp": datetime.now().isoformat(),
            "result_ids": [r["id"] for r in results],
            "result_count": len(results)
        })

        return results

    def incorporate_feedback(self, query_id: str, feedback: dict):
        """Clinician feedback → RLHF pipeline"""
        # Store feedback for model retraining
        pass

    def _calculate_confidence(self, query_emb: list, result_emb: list) -> float:
        """Cosine similarity-based confidence"""
        import numpy as np
        q = np.array(query_emb)
        r = np.array(result_emb)
        return float(np.dot(q, r) / (np.linalg.norm(q) * np.linalg.norm(r)))

    def _check_hallucination(self, result: dict, query: str) -> bool:
        """Flag potentially hallucinated results"""
        if result.get("provenance", {}).get("confidence", 0) < 0.85:
            return True
        return False
```

---

## 17. v2 Certification Program

### Certification Levels (Full)

| Level | Records | Accuracy | Badge Color | Benefits |
|---|---|---|---|---|
| **Bronze** | 50+ | 80%+ | Bronze | Basic badge, directory listing |
| **Silver** | 200+ | 85%+ | Silver | Priority listing, marketing support |
| **Gold** | 500+ | 90%+ | Gold | Featured listing, co-marketing |
| **Platinum** | 1,000+ | 95%+ | Platinum | Case study, referral program |
| **Diamond** | 5,000+ | 97%+ | Diamond | Flagship status, VIP support |

### Benefits Matrix

| Level | Badge | Directory Listing | Marketing Support | Patient Leads | Revenue Share |
|---|---|---|---|---|---|
| Bronze | ✓ | Basic | No | No | No |
| Silver | ✓ | Priority | Yes (templates) | No | No |
| Gold | ✓ | Featured | Yes (co-marketing) | Yes | 5% |
| Platinum | ✓ | Exclusive | Yes (dedicated) | Yes (priority) | 10% |
| Diamond | ✓ | Flagship | Yes (full campaign) | Yes (exclusive) | 15% |

### Certification Auditing

| Audit Type | Frequency | Method | Consequence |
|---|---|---|---|
| **Automated accuracy check** | Continuous | Real-time confidence monitoring | Alert if below threshold |
| **Quarterly compliance audit** | Every 3 months | Sample 10% of records | Warning if discrepancies found |
| **Random spot check** | Monthly | 5 random records verified | Immediate remediation if failing |
| **Full annual audit** | Yearly | All records, all clinics | Recertification required |

### Certification Revocation

| Grounds | Warning | Remediation Period | Action |
|---|---|---|---|
| Accuracy drop > 10% below threshold | Immediate | 30 days to improve | Downgrade if not resolved |
| Security breach (data leak) | None (immediate) | N/A | Suspension + investigation |
| Patient privacy complaint (validated) | Warning letter | 14 days to respond | Revocation if pattern continues |
| Fraudulent data submission | None (immediate) | N/A | Permanent revocation |
| Inactivity > 90 days | Reminder at 60 days | 30 days | Voluntary downgrade |

### Revocation Process

```
1. Detection/Report → 2. Investigation (48h) → 
3. Decision → 4a. Warning + remediation period (14-30 days)
           → 4b. Immediate revocation (security/ fraud)
5. Appeal period (14 days) → 6. Final decision
```

### Certification Logic

```python
# services/certification.py
class CertificationService:
    LEVELS = {
        "none": {"min_records": 0, "min_accuracy": 0, "name": "Not Certified"},
        "bronze": {"min_records": 50, "min_accuracy": 0.80, "name": "Bronze Clinic"},
        "silver": {"min_records": 200, "min_accuracy": 0.85, "name": "Silver Clinic"},
        "gold": {"min_records": 500, "min_accuracy": 0.90, "name": "Gold Clinic"},
        "platinum": {"min_records": 1000, "min_accuracy": 0.95, "name": "Platinum Clinic"},
        "diamond": {"min_records": 5000, "min_accuracy": 0.97, "name": "Diamond Clinic"}
    }

    def __init__(self):
        self.audit_log = []
        self.revocation_queue = []

    def calculate_level(self, records: int, accuracy: float) -> str:
        if records >= 5000 and accuracy >= 0.97:
            return "diamond"
        elif records >= 1000 and accuracy >= 0.95:
            return "platinum"
        elif records >= 500 and accuracy >= 0.90:
            return "gold"
        elif records >= 200 and accuracy >= 0.85:
            return "silver"
        elif records >= 50 and accuracy >= 0.80:
            return "bronze"
        return "none"

    def schedule_audit(self, clinic_id: str, audit_type: str):
        """Schedule a compliance audit"""
        self.audit_log.append({
            "clinic_id": clinic_id,
            "type": audit_type,
            "scheduled_at": datetime.now(),
            "status": "pending"
        })

    def begin_revocation(self, clinic_id: str, grounds: str):
        """Begin certification revocation process"""
        self.revocation_queue.append({
            "clinic_id": clinic_id,
            "grounds": grounds,
            "initiated_at": datetime.now(),
            "status": "investigating",
            "appeal_deadline": datetime.now() + timedelta(days=14)
        })

    def get_badge_url(self, level: str) -> str:
        return f"/badges/{level}.svg"
```

---

# PHASE 3: ENTERPRISE & CROSS-BORDER (v3)

## 18. v3 Overview

### Goal
Hospital groups, GBA expansion, Gold accreditation

### Timeline: Months 9-12

| Month | Focus |
|---|---|
| Month 9 | eHealth+ Gold accreditation, enterprise features |
| Month 10 | PIPL compliance, GBA Standard Contract |
| Month 11 | Multi-clinic admin, advanced reporting |
| Month 12 | Insurer API integration, 100+ clinics |

### v3 Success Criteria

| Criterion | Measurement |
|---|---|
| Gold accreditation | Achieved |
| Cross-border | First mainland clinic connected |
| Enterprise | 2+ hospital groups |
| Revenue | HK$54M+ annual run rate |

---

## 19. v3 Technology Stack Additions

| Component | Technology | Purpose |
|---|---|---|
| Cross-Border | GBA Standard Contract | Legal framework |
| Compliance | PIPL | Mainland data protection |
| Enterprise | RBAC, Multi-tenant | Hospital group management |
| Insurance | API Gateway | Insurer integration |

---

## 20. v3 Cross-Border Compliance

### PIPL (Mainland) vs PDPO (Hong Kong)

| Aspect | PIPL | PDPO |
|---|---|---|
| Scope | Mainland China | Hong Kong |
| Consent | Explicit required | Explicit required |
| Data Export | Strict restrictions — security assessment or SCC required | Reasonable measures |
| Penalties | Up to 5% of annual revenue | Fines + imprisonment |
| Cross-border mechanism | CN SCC or CAC assessment | GBA Standard Contract |

### GBA Cross-Border Data Requirements

| Requirement | Description | Enosis Implementation |
|---|---|---|
| **PIPIA** | Personal Information Privacy Impact Assessment before any cross-border transfer | Automated PIPIA generator in compliance module |
| **GBA SCC** | Use GBA Standard Contract (less stringent than mainland SCC) | Pre-loaded template with clinic data auto-filled |
| **Explicit consent** | Obtain explicit patient consent for cross-border data transfer | Consent capture in patient onboarding flow |
| **Data localization** | High-risk information may require data localization in mainland | Configurable storage zones per clinic |
| **CN SCC or CAC** | Alternative legal mechanisms for cross-border transfers | Fallback option for non-GBA transfers |
| **DPIA** | Data Protection Impact Assessment (new PIPL requirement) | DPIA template + automated risk scoring |

### Compliance Implementation

```python
# services/compliance/cross_border.py
class CrossBorderCompliance:
    def __init__(self):
        self.regulatory_framework = "pdpo"  # or "pipl"
        self.gba_scc_template = self._load_gba_scc_template()

    def validate_transfer(self, data: dict, jurisdiction: str) -> dict:
        """Validate cross-border data transfer compliance"""
        result = {
            "approved": False,
            "requirements": [],
            "risk_level": "low"
        }

        if jurisdiction == "mainland":
            result["requirements"].extend([
                "PIPIA required",
                "GBA SCC or CN SCC required",
                "Explicit patient consent required"
            ])
            result["risk_level"] = self._assess_risk(data)

            if result["risk_level"] in ["medium", "high"]:
                result["requirements"].append("Data localization may be required")

        elif jurisdiction == "hk":
            result["requirements"].append("PDPO compliance")
            result["risk_level"] = "low"

        result["approved"] = len(result["requirements"]) == 0 or self._check_waiver(data)
        return result

    def conduct_pipia(self, data_flow: dict) -> dict:
        """Personal Information Privacy Impact Assessment"""
        return {
            "assessment_id": str(uuid.uuid4()),
            "data_categories": data_flow.get("data_types", []),
            "transfer_purpose": data_flow.get("purpose", ""),
            "risk_level": self._assess_risk(data_flow),
            "recommendations": self._recommend_mitigations(data_flow),
            "approval_status": "pending"
        }

    def generate_gba_scc(self, data_flow: dict) -> dict:
        """Generate GBA Standard Contract"""
        return {
            "contract_id": str(uuid.uuid4()),
            "data_exporter": data_flow.get("exporter", {}),
            "data_importer": data_flow.get("importer", {}),
            "data_categories": data_flow.get("data_types", []),
            "purpose": data_flow.get("purpose", ""),
            "valid_from": datetime.now().isoformat(),
            "valid_until": (datetime.now() + timedelta(days=365)).isoformat(),
            "signed_by_exporter": False,
            "signed_by_importer": False
        }

    def conduct_dpia(self, system: dict) -> dict:
        """Data Protection Impact Assessment"""
        return {
            "system_name": system.get("name"),
            "data_processed": system.get("data_types", []),
            "processing_purpose": system.get("purpose", ""),
            "risk_score": self._dpia_risk_score(system),
            "mitigations": self._recommend_dpia_mitigations(system),
            "approval_status": "pending_review"
        }

    def _assess_risk(self, data: dict) -> str:
        """Assess risk level of data transfer"""
        sensitive_types = ["hkid", "diagnosis", "genetic", "biometric"]
        data_types = data.get("data_types", [data.get("type", "")])
        if any(t in sensitive_types for t in data_types):
            return "high"
        elif "name" in data_types or "contact" in data_types:
            return "medium"
        return "low"

    def _recommend_mitigations(self, data_flow: dict) -> list:
        mitigations = ["Encrypt data in transit (TLS 1.3)"]
        if self._assess_risk(data_flow) in ["medium", "high"]:
            mitigations.extend([
                "Anonymize before transfer",
                "Limited data access (need-to-know basis)",
                "Automated data deletion after transfer confirmed"
            ])
        return mitigations
```

---

# PHASE 4: CROSS-INDUSTRY (v4)

## 21. v4 Overview

### Goal
Manufacturing, Finance, Logistics

### Timeline: Years 2-3

| Quarter | Focus |
|---|---|
| Q1 | Manufacturing — OPC-UA translation, MES integration |
| Q2 | Manufacturing — Real-time sensor data, 600,000+ SMEs |
| Q3 | Finance — ISO 20022 translation, cross-border credit |
| Q4 | Logistics — Port Community System, supply chain data |

### v4 Success Criteria

| Criterion | Measurement |
|---|---|
| Manufacturing | 10+ factories using |
| Finance | 5+ banks using |
| Logistics | Port Community System integration |
| Revenue | HK$180M+ annual run rate |

---

## 22. v4 Manufacturing Architecture

### OPC-UA Translation

```python
# services/manufacturing/opcua.py
import opcua
from opcua import Client

class OPCUATranslator:
    def __init__(self, endpoint: str):
        self.client = Client(endpoint)

    async def connect(self):
        await self.client.connect()

    async def read_machine_data(self, node_id: str):
        node = self.client.get_node(node_id)
        value = await node.read_value()
        return self._translate_sensor_data(value)

    def _translate_sensor_data(self, raw_data: dict) -> dict:
        return {
            "timestamp": raw_data.get("timestamp"),
            "machine_id": raw_data.get("id"),
            "temperature": raw_data.get("temp"),
            "pressure": raw_data.get("press"),
            "status": raw_data.get("status"),
            "unit": "celsius|bar|standard"
        }
```

### MES Integration

```python
# services/manufacturing/mes.py
class MESIntegrator:
    def __init__(self, mes_config: dict):
        self.config = mes_config
        self.api_key = mes_config.get("api_key")
        self.base_url = mes_config.get("base_url")

    async def fetch_production_data(self, factory_id: str):
        pass
```

---

## 23. v4 Finance Architecture

### ISO 20022 Translation

```python
# services/finance/iso20022.py
class ISO20022Translator:
    def __init__(self):
        self.mapping = self._load_mapping()

    def translate_credit_data(self, mainland_data: dict) -> dict:
        return {
            "credit_score": self._map_credit_score(mainland_data.get("score")),
            "revenue": self._convert_currency(mainland_data.get("revenue")),
            "risk_category": self._map_risk_category(mainland_data.get("risk")),
            "operating_history": self._convert_timeline(mainland_data.get("history"))
        }

    def _map_credit_score(self, mainland_score: int) -> int:
        pass
```

---

# PHASE 5: UNIVERSAL DATA OS (v5)

## 24. v5 Overview

### Goal
Full GBA smart economy platform

### Timeline: Years 3-5

| Quarter | Focus |
|---|---|
| Year 3 | Unified cross-industry data model |
| Year 4 | GBA Data Space integration, AI Marketplace |
| Year 5 | Global expansion (Singapore, UAE, UK) |

### v5 Success Criteria

| Criterion | Measurement |
|---|---|
| Unified Schema | 5+ industry schemas |
| GBA Data Space | Full interoperability |
| AI Marketplace | 50+ third-party apps |
| Global | 3+ countries |

---

## 25. v5 Architecture

### Unified Data Model

```python
# schemas/unified.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UnifiedEntity(BaseModel):
    """Base entity for all industries"""
    id: str
    type: str  # patient, machine, transaction, shipment
    attributes: dict
    relationships: List[dict]
    created_at: datetime
    updated_at: datetime

class UnifiedPatient(UnifiedEntity):
    type: str = "patient"
    attributes: {
        "hkid": str,
        "name": dict,
        "dob": str,
        "gender": str,
        "diagnoses": List[dict],
        "medications": List[dict]
    }

class UnifiedMachine(UnifiedEntity):
    type: str = "machine"
    attributes: {
        "machine_id": str,
        "status": str,
        "temperature": float,
        "pressure": float,
        "production_rate": float
    }

class UnifiedTransaction(UnifiedEntity):
    type: str = "transaction"
    attributes: {
        "transaction_id": str,
        "amount": float,
        "currency": str,
        "party_a": str,
        "party_b": str,
        "timestamp": datetime
    }
```

### GBA Data Space Integration

```python
# services/gba/dataspaces.py
class GBADataSpaceConnector:
    def __init__(self, dataspace_url: str, credentials: dict):
        self.dataspace_url = dataspace_url
        self.credentials = credentials

    async def publish_health_data(self, data: dict):
        pass

    async def subscribe_to_logistics_data(self, callback):
        pass

    async def query_financial_data(self, query: dict):
        pass
```

---

# APPENDIX: SUMMARY TABLE

## 26. Complete Phase Summary

| Phase | Goal | Timeline | Key Deliverable | Tech Stack Additions |
|---|---|---|---|---|
| **v0** | Hackathon Demo | Month 1 | Working demo for PolyU IFC 2026 | FastAPI, SQLite, DeepSeek, Tesseract, Playwright |
| **v1** | Production MVP | Months 2-4 | 10-20 pilot clinics, Bronze accreditation | PostgreSQL, Redis, Celery, OAuth2, Kubernetes, React |
| **v2** | Scale & Certification | Months 5-8 | 50+ clinics, Smart Clinic Certified | Qwen2.5-VL, ZVec, RLHF, Certification, Directory |
| **v3** | Enterprise & Cross-Border | Months 9-12 | Hospital groups, GBA expansion, Gold accreditation | PIPL, GBA Standard Contract, Multi-tenant, Insurer API |
| **v4** | Cross-Industry | Years 2-3 | Manufacturing, Finance, Logistics | OPC-UA, ISO 20022, Port Community System |
| **v5** | Universal Data OS | Years 3-5 | Full GBA smart economy platform | Unified Schema, GBA Data Space, AI Marketplace |

---

## 27. What's Missing — Complete Gaps Checklist

| Area | Status | Priority | Target Phase |
|---|---|---|---|
| eHealth+ accreditation requirements | ✅ Added | High | v1 |
| PDPO AI compliance framework | ✅ Added | High | v1 |
| RAG implementation (encryption, provenance, audit) | ✅ Added | High | v2 |
| Cross-border compliance (PIPIA, GBA SCC, DPIA) | ✅ Added | Medium | v3 |
| Certification auditing & revocation | ✅ Added | Medium | v2 |
| Edge agent architecture | ✅ Added | High | v1 |
| Data privacy & security (classification, retention, breach) | ✅ Added | High | v1 |
| Monitoring & observability (metrics, alerts, dashboards) | ✅ Added | High | v1 |
| Testing strategy pyramid | ✅ Added | Medium | v0 |
| Cost estimation tables | ✅ Added | Medium | v0/v1 |
| Disaster recovery plan (RPO < 1h, RTO < 4h) | ❌ Not yet | Medium | v1 |
| Business continuity plan | ❌ Not yet | Medium | v2 |
| User onboarding flow | ❌ Not yet | Low | v1 |
| Support & maintenance plan | ❌ Not yet | Low | v1 |
| Clinician training materials | ❌ Not yet | Low | v1 |
| Patient-facing transparency portal | ❌ Not yet | Low | v2 |

## 28. Key Differentiators by Phase

| Aspect | v0 | v1 | v2 | v3 | v4 | v5 |
|---|---|---|---|---|---|---|
| **Focus** | Demo | Healthcare | Healthcare | Healthcare | Cross-Industry | All Industries |
| **Clinics** | 1 (mock) | 10-20 | 50+ | 100+ | 500+ | 5,000+ |
| **Revenue** | $0 | < $1M | $15M | $54M | $180M | $500M+ |
| **eHealth+** | Mock | Bronze | Silver | Gold | Gold | Gold |
| **Certification** | Mock | None | Full | Full | Full | Full |
| **Deployment** | Docker | K8s | K8s | K8s | K8s | K8s |
| **Regions** | HK | HK | HK | HK+GBA | HK+GBA | Global |

---

## 29. Principles That Don't Change

| Principle | Description |
|---|---|
| **Zero Work** | Clinic never knows Enosis exists |
| **Privacy-First** | Data stays local, consent required |
| **Edge-Native** | Works offline, syncs when online |
| **AI-Native** | Learns from every translation |
| **Certification** | Viral adoption through status |
| **Cross-Industry** | One engine, many translations |

---

---

## 31. Test Data Strategy — Synthea Integration

For generating realistic Hong Kong patient cohorts, use **Synthea** (open-source synthetic patient generator):

```bash
pip install synthea
synthea --population 100 --module hong_kong
```

Or configure Synthea's module to match HK eHealth content standards from the guidebook:

```properties
# synthea.properties overrides for HK
exporter.fhir.use_shr_extensions = false
exporter.fhir.bulk_data = true
population.default.city = Hong Kong
population.default.state = HK
```

See [`ehr-content-standards-guidebook.md`](./ehr-content-standards-guidebook.md) for the full FHIR profile requirements.

---

**End of Complete PRD — v0 to v5**

---

*Team: Enosis*
*Date: July 2026*
*Version: 2.0*
