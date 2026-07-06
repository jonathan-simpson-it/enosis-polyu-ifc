# Enosis — The Universal Data Translation Layer

> **Tagline:** Unlocking data so every AI application can work. Starting with healthcare, expanding to the entire smart economy.

PolyU IFC 2026 Hackathon Demo.

---

## Overview

### One AI Agent. One Job.

> *"Ingest data from ANY source, in ANY format → Output in a unified, machine-readable schema."*

| What We Do | What We Don't Do |
|---|---|
| Translate data | Analytics |
| Extract from any source | Dashboards |
| Convert to standards | Workflow automation |
| Auto-upload | Predictive maintenance |

**Just translation. One job. Done perfectly.**

### The Insight

> *"Most clinics are well equipped nowadays but too lazy. CMS input itself is quite a lot of work by itself."*

| Before | After |
|---|---|
| Build a tool that *can* upload | Build a tool that requires **zero additional work** |
| Focus on technical capability | Focus on **friction reduction** |
| Target "can't" upload | Target **"won't" upload** |

### Core Principle

> *"The clinic should never know Enosis exists. Zero additional work. Zero friction. Just automatic translation."*

### What It Does

| Step | Action | Technology |
|---|---|---|
| **Ingest** | Scrape patient data from clinic CMS | Playwright |
| **Translate** | Map diagnoses → ICD-10, medications → SNOMED-CT, generate FHIR R5 | DeepSeek API |
| **Upload** | Send FHIR bundle to eHealth+ | Mock API |
| **Certify** | Award Smart Clinic Certified badge | In-app logic |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Docker Desktop (optional, for containerized deployment)
- DeepSeek API key ([platform.deepseek.com](https://platform.deepseek.com))

### One-Click Run

```bash
# Local (creates venv, installs deps, starts all services, runs demo)
make dev

# Or directly:
./scripts/run.sh

# Docker (builds containers, starts services, runs demo)
./scripts/run-docker.sh
```

| Command | What it does |
|---|---|
| `make dev` | Start everything + run demo |
| `make demo` | Run demo (servers already running) |
| `make seed` | Seed database |
| `make stop` | Kill servers |

### Manual Setup

```bash
# Clone and enter
cd enosis

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium

# Configure environment
cp .env.example .env
# Edit .env — add your DEEPSEEK_API_KEY

# Run the server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker (Manual)

```bash
# Build and start
docker-compose up --build

# Run the demo script
docker-compose exec api python scripts/seed_database.py
docker-compose exec api python scripts/run_demo.py
```

### The Zero-Work Pipeline

```
1. Doctor sees patient → Updates CMS (normal workflow)
                                    ↓
2. Edge Agent (silent, invisible)
   - Runs on clinic server
   - Scheduled scraping (every 15 min)
   - Detects new/changed patient records
   - Extracts data (screen scraping / API)
   - Stores locally (offline-first)
   - Queues for cloud sync
                                    ↓
3. Cloud Backend (auto)
   - Receive raw data
   - Translate to FHIR R5
   - Upload to eHealth+
   - Track certification
   - Log everything
                                    ↓
4. Outcome (clinic never knew)
   - Patient records automatically in eHealth+
   - Clinic receives Smart Clinic Certification
   - Patients see badge in "Doctor Search"
```

### Access

| Service | URL |
|---|---|
| API Docs (Swagger) | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/health |
| Mock CMS | http://localhost:8080 |

---

## Run the Demo

```bash
# Seed the database
python scripts/seed_database.py

# Run end-to-end demo
python scripts/run_demo.py
```

The demo walks through all 5 steps:
1. Health check
2. Scrape 3 patients from mock CMS
3. Translate diagnoses/medications to standard codes + FHIR R5
4. Upload FHIR bundle to mock eHealth+
5. View Smart Clinic Certification badge

---

## Project Structure

```
enosis/
├── src/
│   ├── main.py                  # FastAPI app entry
│   ├── config.py                # Environment variables
│   ├── database.py              # SQLite connection
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic request/response models
│   ├── api/
│   │   ├── health.py            # GET /health
│   │   ├── ingest.py            # POST /ingest, GET /ingest/{job}/status
│   │   ├── translate.py         # POST /translate
│   │   ├── upload.py            # POST /upload, GET /upload/{id}/status
│   │   └── certification.py     # GET /certification/{clinic_id}
│   ├── services/
│   │   ├── scrape.py            # Playwright screen scraping
│   │   ├── ocr.py               # Tesseract OCR
│   │   ├── translate.py         # DeepSeek API integration
│   │   ├── fhir.py              # FHIR R5 conversion
│   │   ├── ehealth.py           # Mock eHealth+ upload
│   │   └── certification.py     # Smart Clinic Certification logic
│   ├── utils/
│   │   └── logger.py            # Structured logging
│   └── badges/                  # SVG certification badges
│       ├── bronze.svg
│       ├── silver.svg
│       ├── gold.svg
│       ├── platinum.svg
│       └── diamond.svg
├── mock_cms/                    # Mock clinic CMS
│   ├── index.html
│   ├── dashboard.html
│   ├── patients.html
│   ├── patient.html
│   └── data/
│       ├── patients.json
│       └── diagnoses.json
├── tests/
│   └── test_api.py
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

## API Endpoints

### Auth (v0 — Simple API Key)

All `/api/v1/*` endpoints require:
```
X-API-Key: dev-api-key-123456
```

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check (public) |
| `POST` | `/api/v1/ingest` | Scrape patient data from CMS |
| `GET` | `/api/v1/ingest/{job_id}/status` | Poll ingest job |
| `POST` | `/api/v1/translate` | Translate to FHIR R5 via DeepSeek |
| `POST` | `/api/v1/upload` | Upload FHIR bundle to eHealth+ |
| `GET` | `/api/v1/upload/{upload_id}/status` | Poll upload status |
| `GET` | `/api/v1/certification/{clinic_id}` | View certification |
| `GET` | `/badges/{level}.svg` | Badge SVG (static) |

---

## Smart Clinic Certification

### The "Gold Play Button" for Healthcare

> *"You do not get premium patients without trust, and you do not earn trust without proof of expertise."*

### Why Patients Care

- **85% of consumers trust third-party certifications**
- **Patients can't verify clinic quality themselves** — need a signal
- **Certifications reduce decision anxiety** — replace uncertainty with confidence

### The Flywheel

```
Clinic earns certification → Displays badge → Patients recognize + choose →
More patients → More clinics want certification → Industry standard
```

### What Clinics Receive

- Physical plaque for waiting room
- Window decal
- Digital badges for website + email
- Priority listing in "Doctor Search"
- Co-marketing support
- Patient leads

### Certification Levels

| Level | Records | Accuracy | Badge |
|---|---|---|---|
| Bronze | 50+ | 80%+ | 🥉 |
| Silver | 200+ | 85%+ | 🥈 |
| Gold | 500+ | 90%+ | 🥇 |
| Platinum | 1,000+ | 95%+ | 💎 |
| Diamond | 5,000+ | 97%+ | 👑 |

---

## Tech Stack (v0)

| Layer | Technology |
|---|---|
| Language | Python 3.11+ |
| Web Framework | FastAPI 0.115+ |
| Database | SQLite |
| LLM | DeepSeek API (v4-flash) |
| Browser Automation | Playwright 1.40+ |
| OCR | Tesseract 5.0+ |
| FHIR | fhir.resources 7.0+ (R5) |
| Container | Docker + Docker Compose |

---

## Environment Variables

| Variable | Required | Default |
|---|---|---|
| `API_KEY` | Yes | `dev-api-key-123456` |
| `DEEPSEEK_API_KEY` | Yes | — |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | No | `deepseek-v4-flash` |
| `DATABASE_URL` | No | `sqlite:///./enosis.db` |
| `TESSERACT_CMD` | No | `/usr/bin/tesseract` |

---

## Running Tests

```bash
pip install pytest
pytest tests/ -v
```

---

## Future Phases

| Phase | Goal | Timeline | Key Deliverable |
|---|---|---|---|
| **v0** | Hackathon Demo | Month 1 | Working demo for PolyU IFC 2026 |
| **v1** | Production MVP | Months 2-4 | 10-20 pilot clinics, Bronze accreditation |
| **v2** | Scale & Certification | Months 5-8 | 50+ clinics, Smart Clinic Certified |
| **v3** | Enterprise & Cross-Border | Months 9-12 | Hospital groups, GBA expansion |
| **v4** | Cross-Industry | Years 2-3 | Manufacturing, Finance, Logistics |
| **v5** | Universal Data OS | Years 3-5 | Full GBA smart economy platform |

### Phase Details

| Phase | What We Add |
|---|---|
| **v1** | PostgreSQL + pgvector, Redis, Celery + RabbitMQ, OAuth2 + JWT, real eHealth+ integration, human-in-the-loop validation, Kubernetes, React frontend |
| **v2** | Qwen2.5-VL OCR (replace Tesseract), ZVec embedded vector DB, RLHF, full certification program (Bronze→Diamond), public clinic directory, eHealth+ Silver accreditation |
| **v3** | eHealth+ Gold accreditation, PIPL compliance + GBA Standard Contract, multi-clinic admin, insurer API integration |
| **v4** | OPC-UA + MES for manufacturing, ISO 20022 for finance, supply chain for logistics, government data translation |
| **v5** | Unified cross-industry schema, GBA Data Space interoperability, AI marketplace, global expansion (Singapore, UAE, UK) |

---

## Team

Built for **PolyU IFC 2026** by Team Enosis.

**Enosis** (Greek: ἕνωσις) — "union, unity." Bringing together disparate data sources into one unified, readable format.

> *"We don't build AI applications. We unlock the data so every other AI application can work."*
