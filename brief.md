# Enosis — Complete Product & Technical Brief

---

## 1. PRODUCT IDENTITY

| Element | Value |
|---|---|
| **Name** | Enosis |
| **Meaning** | Greek for "union" or "unity" |
| **Tagline** | "The Universal Data Translation Layer" |
| **Mission** | Unlock data so every AI application can work |
| **Core Principle** | "Zero additional work. Zero friction. Just automatic translation." |

---

## 2. THE PROBLEM

> *"Every industry has data, but it speaks different dialects. Healthcare data is fragmented across legacy systems. Manufacturing data is locked in incompatible protocols. Financial data cannot cross borders."*

### The Insight That Changes Everything

> *"Most clinics are well equipped nowadays but too lazy. CMS input itself is quite a lot of work by itself."*

| Before | After |
|---|---|
| Build a tool that *can* upload | Build a tool that requires **zero additional work** |
| Focus on technical capability | Focus on **friction reduction** |
| Target "can't" upload | Target **"won't" upload** |

---

## 3. SOLUTION: ENOSIS

### One AI Agent. One Job.

> *"Ingest data from ANY source, in ANY format — electronic CMS, handwritten notes, scanned documents, lab photos, or direct text input → Output in a unified, machine-readable schema."*

| What We Do | What We Don't Do |
|---|---|
| Translate data | Analytics |
| Extract from any source | Dashboards |
| Convert to standards | Workflow automation |
| Auto-upload | Predictive maintenance |

**Just translation. One job. Done perfectly.**

---

## 4. COMPETITIVE LANDSCAPE

| Competitor | What They Do | Why We Win |
|---|---|---|
| **MedLink (UK)** | Healthcare data integration; integrated with EMIS Web | Healthcare-only, UK-centric, assumes structured data |
| **Accredited CMS Vendors** | Sell full clinical management systems | We work with **existing** systems — no migration |
| **UA Edge Translator** | Protocol translation for manufacturing | Manufacturing-only; protocol-level, not semantic |
| **superglue (YC)** | Generic data transformation | No industry context; no unstructured data handling |
| **CData / MuleSoft** | Enterprise data connectors | Require pre-built connectors; no AI; too expensive for SMEs |
| **Mainland AI Health** (Alibaba, Tencent) | AI health platforms | Don't understand HK's regulatory context |

**No one occupies the center:** cross-industry, AI-native, semantic, any data source, continuous learning.

---

## 5. THE MOAT

| Layer | Why It's Defensible |
|---|---|
| **Data Moat** | Proprietary translation corpus grows with every customer; cross-industry learning creates exponential value |
| **Network Effects** | More customers = more translations = better agent = more customers |
| **Technical Complexity** | Hybrid AI (ontology + knowledge graph + LLM) + edge deployment + multi-industry schema mapping |
| **Regulatory First-Mover** | First to eHealth+ accreditation; first to build cross-border compliance (PDPO + PIPL) |
| **Neutral Positioning** | "Switzerland of data" — no hardware, no cloud lock-in, trusted by all |

---

## 6. MARKET OPPORTUNITY

| Segment | Size |
|---|---|
| HK Private Clinics | 3,000+ |
| HK Public Hospitals | 40+ |
| GBA Hospitals | 1,000+ |
| GBA Manufacturers | 600,000+ |
| **Total Addressable Market** | **HK$100B+/year** |

### Revenue Model
- Per-transaction: HK$5-20 per patient record
- Subscription: HK$500-2,000/month per clinic (unlimited)
- Government-funded: HK$500/month subsidy per doctor via eHealth+ Connectivity Support Scheme

### Projections

| Year | Customers | Revenue |
|---|---|---|
| Year 1 | 100 clinics | HK$2.4M |
| Year 2 | 500 clinics | HK$15M |
| Year 3 | 1,500 clinics | HK$54M |
| Year 4+ | 3,000+ (cross-industry) | HK$180M+ |

**Unit Economics:** LTV:CAC = 12:1 (CAC ~HK$5,000, LTV ~HK$60,000)

---

## 7. PHASE 0: HACKATHON DEMO (v0)

### Goal
Win PolyU IFC 2026 by demonstrating:
1. Technical capability — Extract, translate, format healthcare data
2. Friction reduction — Automatic, zero clinic effort
3. Certification vision — Smart Clinic Certified badges

### What We Build

| Layer | Technology | Version |
|---|---|---|
| Language | Python | 3.11+ |
| Web Framework | FastAPI | 0.115+ |
| Database | SQLite | 3.40+ |
| LLM | DeepSeek API | v4-flash |
| Browser Automation | Playwright | 1.40+ |
| OCR | Tesseract | 5.0+ |
| FHIR | fhir.resources | 7.0+ |
| HTTP Client | httpx | 0.28+ |
| Container | Docker + Docker Compose | Latest |

### What We Skip

| Skip | Why |
|---|---|
| PostgreSQL | SQLite is fine for demo |
| Redis | Not needed for demo scale |
| Celery + RabbitMQ | Use asyncio instead |
| Kubernetes | Docker Compose is enough |
| OAuth2 | Simple API key for demo |
| Real eHealth+ | Mock it |
| Qwen2.5-VL | Tesseract sufficient for MVP |
| RLHF | Manual validation for demo |

---

## 8. CORE USE CASE

### The Zero-Work Pipeline

```
1. Doctor sees patient → Updates CMS (normal workflow)
                                    ↓
2. Edge Agent (silent, invisible)
   - Runs on clinic server
   - Scheduled scraping (every 15 min)
   - Detects new/changed patient records
   - Extracts data (screen scraping / API / OCR)
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

---

## 9. DATABASE SCHEMA (v0 — SQLite)

```python
class Clinic(Base):
    id = Column(UUID, primary_key=True)
    name = Column(String(255), nullable=False)
    cms_type = Column(String(100), default="mock")
    certification_level = Column(String(20), default="none")
    created_at = Column(DateTime, default=datetime.now)

class Patient(Base):
    id = Column(UUID, primary_key=True)
    clinic_id = Column(UUID, nullable=False)
    hkid = Column(String(20), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    dob = Column(String(10))
    gender = Column(String(1))

class Translation(Base):
    id = Column(UUID, primary_key=True)
    clinic_id = Column(UUID, nullable=False)
    patient_id = Column(UUID, nullable=False)
    original_text = Column(String)
    translated_text = Column(String)
    confidence = Column(Float)
    mapped_code = Column(String(50))
    mapping_standard = Column(String(50))  # ICD-10, SNOMED-CT
    fhir_resource = Column(JSON)
    ehealth_status = Column(String(20), default="pending")

class FHIRBundle(Base):
    id = Column(UUID, primary_key=True)
    clinic_id = Column(UUID, nullable=False)
    patient_id = Column(UUID, nullable=False)
    bundle = Column(JSON, nullable=False)
    upload_status = Column(String(20), default="pending")
    ehealth_reference = Column(String(255))

class CertificationTracking(Base):
    id = Column(UUID, primary_key=True)
    clinic_id = Column(UUID, nullable=False, unique=True)
    records_uploaded = Column(Integer, default=0)
    accuracy_rate = Column(Float, default=0.0)
    current_level = Column(String(20), default="none")
```

---

## 10. API ENDPOINTS (v0)

```
GET /health

POST /api/v1/ingest
Request: { clinic_id, clinic_name, cms_type, cms_url }
Response: { job_id, status, patients_scraped }

GET /api/v1/ingest/{job_id}/status
Response: { job_id, status, patients_found, data: [...] }

POST /api/v1/upload-data
Request: multipart/form-data — file (image/JSON/CSV) + clinic_id + clinic_name
Response: { job_id, status, records_extracted, source_type }

POST /api/v1/upload-data/direct
Request: { clinic_id, clinic_name, patient_data: { ... } }
Response: { job_id, status, records_extracted, source_type }

GET /api/v1/upload-data/{job_id}/status
Response: { job_id, status, records_extracted, data: [...] }

POST /api/v1/translate
Request: { clinic_id, patient_id, patient_data, diagnoses, medications }
Response: { job_id, fhir_bundle, translations, token_usage }

POST /api/v1/upload
Request: { clinic_id, patient_id, fhir_bundle, patient_consent }
Response: { upload_id, status, ehealth_reference }

GET /api/v1/upload/{upload_id}/status
Response: { upload_id, status, ehealth_reference }

GET /api/v1/certification/{clinic_id}
Response: { clinic_id, current_level, records_uploaded, accuracy_rate, badge_url }

GET /badges/{level}.svg
```

---

## 11. DEEPSEEK PROMPT

```
System: You are a medical data translator. Map clinical data to standard
coding systems (ICD-10, SNOMED-CT, WHO-ATC) and output FHIR R5 resources.
Return ONLY valid JSON.

User: [Patient data with diagnoses, medications, lab results]

Expected Output:
{
    "patient": {"name": {...}, "hkid": "...", "dob": "...", "gender": "..."},
    "diagnoses": [{"original_code": "...", "icd10_code": "...", "confidence": 0.95}],
    "medications": [{"original_name": "...", "snomed_code": "...", "confidence": 0.92}],
    "fhir_bundle": {"resourceType": "Bundle", "type": "transaction", "entry": [...]},
    "confidence": 0.94
}
```

---

## 12. SMART CLINIC CERTIFICATION

### The "Gold Play Button" for Healthcare

> *"You do not get premium patients without trust, and you do not earn trust without proof of expertise."*

### Certification Levels

| Level | Records | Accuracy | Badge |
|---|---|---|---|
| Bronze | 50+ | 80%+ | bronze.svg |
| Silver | 200+ | 85%+ | silver.svg |
| Gold | 500+ | 90%+ | gold.svg |
| Platinum | 1,000+ | 95%+ | platinum.svg |
| Diamond | 5,000+ | 97%+ | diamond.svg |

### What Clinics Receive

- Physical plaque for waiting room
- Window decal
- Digital badges for website + email
- Priority listing in "Doctor Search"
- Co-marketing support
- Patient leads

### Why Patients Care

- **85% of consumers trust third-party certifications**
- **Patients can't verify clinic quality themselves** — need a signal
- **Certifications reduce decision anxiety** — replace uncertainty with confidence

### The Flywheel

```
Clinic earns certification → Displays badge → Patients recognize + choose →
More patients → More clinics want certification → Industry standard
```

---

## 13. FOLDER STRUCTURE (v0)

```
enosis-v0/
├── src/
│   ├── main.py                  # FastAPI app entry
│   ├── config.py                # Environment variables
│   ├── database.py              # SQLite connection
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic models
│   ├── api/
│   │   ├── health.py
│   │   ├── ingest.py
│   │   ├── upload_data.py       # File upload + direct submission
│   │   ├── translate.py
│   │   ├── upload.py
│   │   └── certification.py
│   ├── services/
│   │   ├── scrape.py            # Playwright (CMS scraping)
│   │   ├── ocr.py               # Tesseract (handwritten + printed docs)
│   │   ├── translate.py         # DeepSeek
│   │   ├── fhir.py              # FHIR R5
│   │   └── ehealth.py           # Mock
│   ├── utils/
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
├── tests/
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

## 14. ENVIRONMENT VARIABLES

```env
API_KEY="dev-api-key-123456"

DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-v4-flash"

DATABASE_URL="sqlite:///./enosis.db"

TESSERACT_CMD="/usr/bin/tesseract"

MOCK_EHEALTH_URL="http://localhost:8000/mock/ehealth"
```

---

## 15. DEVELOPMENT ROADMAP

### v0: Hackathon Demo (Weeks 1-4)

| Week | Focus |
|---|---|
| 1 | Project setup, Docker, database, FastAPI skeleton |
| 2 | DeepSeek integration, FHIR conversion |
| 3 | Playwright scraping, Tesseract OCR |
| 4 | Mock eHealth+, certification, demo script |

### v1: Production MVP (Months 2-4)

| Component | Add |
|---|---|
| Database | PostgreSQL + pgvector |
| Cache | Redis |
| Async | Celery + RabbitMQ |
| Auth | OAuth2 + JWT |
| eHealth+ | Real integration (Bronze) |
| Validation | Human-in-the-loop |
| Deployment | Kubernetes |
| Frontend | React app |

### v2: Scale & Certification (Months 5-8)

| Component | Add |
|---|---|
| OCR | Qwen2.5-VL |
| RAG | ZVec (Alibaba) — embedded vector DB |
| RLHF | Reinforcement Learning |
| Certification | Full program (Bronze→Diamond) |
| Directory | Public clinic directory |
| Silver | eHealth+ Silver accreditation |

### v3: Enterprise & Cross-Border (Months 9-12)

| Component | Add |
|---|---|
| Gold | eHealth+ Gold |
| Cross-Border | PIPL + GBA Standard Contract |
| Enterprise | Multi-clinic admin |
| Insurance | Insurer API |

### v4: Cross-Industry (Years 2-3)

| Component | Add |
|---|---|
| Manufacturing | OPC-UA, MES |
| Finance | ISO 20022 |
| Logistics | Supply chain |
| Government | Department data |

### v5: Universal Data OS (Years 3-5)

| Component | Add |
|---|---|
| Unified Schema | Cross-industry |
| GBA Data Space | Full interoperability |
| AI Marketplace | Third-party apps |
| Global | Singapore, UAE, UK |

---

## 16. ZVEC INTEGRATION (Phase 2)

### What is ZVec?

- Open-source embedded vector database from Alibaba's Tongyi Lab
- "SQLite for vectors" — runs in-process, no separate server
- Built on Proxima (Alibaba's production vector search engine)
- Up to 2x faster than cloud-based vector DBs
- Millisecond responses even with millions of vectors

### Why ZVec for Enosis

| Advantage | Benefit |
|---|---|
| Zero network latency | Faster RAG responses |
| No separate service | Simpler deployment |
| True offline operation | Privacy-first, data stays local |
| Hybrid search | Vector + full-text + scalar filters |
| Embedded | Perfect for edge agent |

### Integration

```python
import zvec

schema = zvec.CollectionSchema(
    name="clinic_knowledge_base",
    fields=[
        zvec.Field(name="id", dtype=zvec.DataType.STRING, is_primary=True),
        zvec.Field(name="content", dtype=zvec.DataType.TEXT),
        zvec.Field(name="embedding", dtype=zvec.DataType.FLOAT_VECTOR, dim=384),
        zvec.Field(name="metadata", dtype=zvec.DataType.JSON),
    ]
)

db = zvec.Zvec("/path/to/knowledge.zvec")
collection = db.create_or_open_collection(schema)

collection.insert([
    {"id": "doc1", "content": "...", "embedding": [...], "metadata": {"category": "diabetes"}}
])

results = collection.search(
    vector=query_embedding,
    top_k=5,
    filter="metadata.category == 'diabetes'",
    full_text_query="kidney",
)
```

---

## 17. DEMO SCRIPT

```python
# scripts/run_demo.py
import httpx
import time

def demo():
    headers = {"X-API-Key": "dev-api-key-123456"}

    # 1. Health Check
    response = httpx.get("http://localhost:8000/health", headers=headers)
    print("✓ Health:", response.json())

    # 2. Ingest
    ingest = httpx.post("http://localhost:8000/api/v1/ingest",
        json={"clinic_id": "clinic-1", "clinic_name": "Central Clinic", "cms_type": "mock"},
        headers=headers
    ).json()
    print("✓ Ingest:", ingest)

    # 3. Translate
    translate = httpx.post("http://localhost:8000/api/v1/translate",
        json={"clinic_id": "clinic-1", "patient_id": "P001", "patient_data": {...}},
        headers=headers
    ).json()
    print("✓ Translate:", translate)

    # 4. Upload
    upload = httpx.post("http://localhost:8000/api/v1/upload",
        json={"clinic_id": "clinic-1", "patient_id": "P001",
              "fhir_bundle": translate["fhir_bundle"], "patient_consent": True},
        headers=headers
    ).json()
    print("✓ Upload:", upload)

    # 5. Certification
    cert = httpx.get("http://localhost:8000/api/v1/certification/clinic-1", headers=headers).json()
    print("✓ Certification:", cert["current_level"].upper(), cert["badge_url"])
```

---

## 18. THE PITCH

> *"Judges, the Smart Economy cannot be built on broken data.*
>
> *The Hong Kong government has invested HK$1.4 billion in eHealth+. But private clinics — which account for over 50% of all eHealth record views — have uploaded less than 1% of their data.*
>
> *The problem isn't technology — it's friction. Clinics won't change their systems for HK$6,000.*
>
> *Enosis is the solution. A hybrid AI platform that connects ANY clinic to eHealth+ — no changes required. Screen scraping. OCR. Multi-modal translation. FHIR R5 compliance. All powered by a proprietary translation corpus that gets smarter with every clinic.*
>
> *But that's just the beginning.*
>
> *Our Smart Clinic Certification transforms Enosis from a utility into a standard — a prestigious badge that clinics actively want to earn and display, just like a YouTube Gold Play Button.*
>
> *The same engine that translates healthcare data can translate manufacturing data. Financial data. Government data. We're building the universal data translation layer for the entire GBA smart economy.*
>
> *We don't build AI applications. We unlock the data so every other AI application can work.*
>
> *Enosis. Unlocking the data. Unlocking the future."*

---

## 19. RISK MITIGATION

| Risk | Mitigation |
|---|---|
| **Slow adoption by clinics** | Leverage government subsidy (HK$6,000/doctor); offer zero-setup service |
| **Hospital bureaucracy** | Start with small private clinics (fastest decision-makers); build case studies |
| **Competition** | Build data moat quickly; achieve accreditation first; create switching costs |
| **Clinical accuracy** | Human-in-the-loop validation; confidence scoring; PolyU clinical partnership |
| **Cross-border compliance** | Register under GBA Standard Contract; partner with mainland entity |
| **Scaling across industries** | Same core engine; add industry-specific translation modules |

---

## 20. THE ASK

| Need | Details |
|---|---|
| **Seed Funding** | HK$5-10M |
| **Team Expansion** | 2-3 additional engineers |
| **Pilot Program** | 10-20 PolyU allied health clinics |
| **Accreditation** | eHealth+ Bronze (Month 3), Silver (Month 6) |
| **First Revenue** | 100+ clinics (Year 1) |

---

## 21. SUMMARY

| Phase | Goal | Timeline | Key Deliverable |
|---|---|---|---|
| **v0** | Hackathon Demo | Month 1 | Working demo for PolyU IFC 2026 |
| **v1** | Production MVP | Months 2-4 | 10-20 pilot clinics, Bronze accreditation |
| **v2** | Scale & Certification | Months 5-8 | 50+ clinics, Smart Clinic Certified |
| **v3** | Enterprise & Cross-Border | Months 9-12 | Hospital groups, GBA expansion |
| **v4** | Cross-Industry | Years 2-3 | Manufacturing, Finance, Logistics |
| **v5** | Universal Data OS | Years 3-5 | Full GBA smart economy platform |

---

### v0 Demo Page

The AI translation pipeline is now visible at **`/demo/`** — an interactive single-page app with 3 data sources, confidence bars, FHIR tree viewer, and certification result. Zero new backend code — just static HTML+JS calling the existing API.

### Reference

- [`ehr-content-standards-guidebook.md`](./ehr-content-standards-guidebook.md) — Hong Kong eHealth content standards for realistic test data generation

---

*Team: Enosis*
*Date: July 2026*
