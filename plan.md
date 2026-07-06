# Enosis — Build Plan

## v0 · v1 · v2 · v3 · v4 · v5

---

## Context

Build a universal data translation layer that automatically extracts data from ANY clinic system, translates it to FHIR R5, and uploads it to eHealth+ — with **zero additional work from the clinic**.

**Core Principle:** *"The clinic should never know Enosis exists. Zero additional work. Zero friction. Just automatic translation."*

**The Insight:** Clinics are well-equipped but lazy. The problem isn't "can't" upload — it's "won't" upload. Focus on friction reduction, not technical capability.

> Full PRD: [`prd.md`](./prd.md) — complete specs for all 6 phases
> Product Brief: [`brief.md`](./brief.md) — quick reference

---

## 1. SETUP — MCP & SKILLS

### MCP Servers (`.claude/settings.local.json`)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### QA Skills (from qaskills.sh)

```bash
npx @qaskills/cli add playwright-e2e
npx @qaskills/cli add fastapi-testing
npx @qaskills/cli add pytest-patterns
npx @qaskills/cli add python-testing-patterns
npx @qaskills/cli add docker-testcontainers
npx @qaskills/cli add cicd-pipeline
npx @qaskills/cli add playwright-api
npx @qaskills/cli add visual-regression
npx @qaskills/cli add playwright-multi-tab-handling
npx @qaskills/cli add playwright-test-step
npx @qaskills/cli add screenshot-testing-ci
npx @qaskills/cli add code-coverage
npx @qaskills/cli add production-smoke-suite
npx @qaskills/cli add api-test-suite-generator
npx @qaskills/cli add prompt-testing
```

### Design Skills (from GitHub)

```bash
npx skills add nextlevelbuilder/ui-ux-pro-max-skill
npx skills add Leonxlnx/taste-skill
```

---

## 2. v0 — HACKATHON DEMO (Weeks 1-4)

### v0 Build Order

| Week | Focus | Deliverables |
|---|---|---|
| **Week 1** | Setup | Project structure, Docker, SQLite, FastAPI skeleton, CI |
| **Week 2** | Core Translation | DeepSeek integration, FHIR R5 conversion, confidence scoring |
| **Week 3** | Data Ingestion | Playwright scraping, OCR, file upload, async support |
| **Week 4** | Polish | Certification logic, SVG badges, demo script, README, pitch deck |

### v0 Tech Stack

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

### v0 What's Built (Complete)

| Directory | Files | Status |
|---|---|---|
| `src/` | main, config, database, models, schemas | ✅ Done |
| `src/api/` | health, ingest, translate, upload, certification | ✅ Done |
| `src/services/` | scrape, ocr, translate, fhir, ehealth, certification | ✅ Done |
| `src/utils/` | logger | ✅ Done |
| `src/badges/` | bronze, silver, gold, platinum, diamond | ✅ Done |
| `mock_cms/` | index, dashboard, patient, patients, data/ | ✅ Done |
| `tests/` | test_api.py (12 tests) | ✅ Done (12/12 passing) |
| `scripts/` | seed_database, run_demo | ✅ Done |
| Root | Dockerfile, docker-compose, requirements, .env.example, README | ✅ Done |

### v0 Verification

```bash
# Run tests
pytest tests/ -v

# Start server (background)
uvicorn src.main:app --host 0.0.0.0 --port 8000 &

# Seed database
python scripts/seed_database.py

# Run demo
python scripts/run_demo.py

# Or with Docker
docker-compose up --build
docker-compose exec api python scripts/seed_database.py
docker-compose exec api python scripts/run_demo.py
```

---

## 3. v1 — PRODUCTION MVP (Months 2-4)

### v1 Build Order

| Month | Focus | Deliverables |
|---|---|---|
| **Month 1** | Backend Infrastructure | PostgreSQL + pgvector migration, Redis cache, Celery + RabbitMQ |
| **Month 2** | Auth & eHealth+ | OAuth2 + JWT, real eHealth+ Bronze integration, API gateway |
| **Month 3** | Frontend & Validation | React clinic dashboard, human-in-the-loop validation UI |
| **Month 4** | Deploy & Pilot | Kubernetes deployment, 10-20 pilot clinics, monitoring |

### v1 Tech Stack Additions

| Component | Technology |
|---|---|
| Database | PostgreSQL 15+ + pgvector |
| Cache | Redis 7+ |
| Async | Celery 5.4+ + RabbitMQ 3.13+ |
| Auth | OAuth2 + JWT |
| eHealth+ | Real API (Bronze) |
| Frontend | React 18+ |
| Deployment | Kubernetes (AKS) |
| Monitoring | Prometheus + Grafana |
| Logging | ELK Stack |
| Tracing | Jaeger (OpenTelemetry) |

---

## 4. v2 — SCALE & CERTIFICATION (Months 5-8)

| Month | Focus | Deliverables |
|---|---|---|
| **Month 5** | OCR & RAG | Qwen2.5-VL upgrade, ZVec embedded vector DB |
| **Month 6** | RLHF & Certification | RLHF pipeline, full certification program launch |
| **Month 7** | Directory & Accreditation | Public clinic directory, eHealth+ Silver |
| **Month 8** | Analytics & Scale | Superset dashboard, 50+ clinics |

### v2 Key Initiative: ZVec RAG

- "SQLite for vectors" — in-process, zero ops
- Hybrid search (vector + full-text + scalar filters)
- Per-clinic local knowledge bases for grounded translation
- See `prd.md` §16 for integration code

---

## 5. v3 — ENTERPRISE & CROSS-BORDER (Months 9-12)

| Month | Focus | Deliverables |
|---|---|---|
| **Month 9** | Enterprise | eHealth+ Gold, multi-clinic admin, RBAC |
| **Month 10** | Compliance | PIPL, GBA Standard Contract, data residency |
| **Month 11** | Reporting | Advanced analytics, insurer API integration |
| **Month 12** | Scale | 100+ clinics, 2+ hospital groups |

---

## 6. v4 — CROSS-INDUSTRY (Years 2-3)

| Quarter | Focus | Deliverables |
|---|---|---|
| **Q1** | Manufacturing | OPC-UA translation, MES integration |
| **Q2** | Manufacturing Scale | Real-time sensor data, 600K+ SMEs |
| **Q3** | Finance | ISO 20022 translation, cross-border credit |
| **Q4** | Logistics | Port Community System, supply chain data |

---

## 7. v5 — UNIVERSAL DATA OS (Years 3-5)

| Year | Focus | Deliverables |
|---|---|---|
| **Year 3** | Unified Schema | Cross-industry data model, GBA Data Space |
| **Year 4** | Marketplace | AI Marketplace, third-party app ecosystem |
| **Year 5** | Global | Singapore, UAE, UK expansion |

---

## 8. TECHNOLOGY ROADMAP

```
v0 (Now)          v1 (Months 2-4)       v2 (Months 5-8)        v3+ (Year 2+)
────────────      ───────────────       ───────────────        ──────────────
FastAPI           FastAPI                FastAPI                FastAPI
SQLite ─────────> PostgreSQL + pgvector ──> + ZVec ──────────> + GBA Data Space
Playwright        Playwright             Qwen2.5-VL (OCR)      Qwen2.5-VL
Tesseract         Tesseract              ZVec RAG              ZVec RAG
DeepSeek          DeepSeek               DeepSeek + RLHF       DeepSeek + RLHF
No Auth ────────> OAuth2 + JWT           OAuth2 + JWT          OAuth2 + JWT
Docker ─────────> Kubernetes             Kubernetes HPA        Kubernetes HPA
No Cache ───────> Redis                  Redis                  Redis
No Async ───────> Celery + RabbitMQ      Celery + RabbitMQ     Celery + RabbitMQ
Mock eHealth+ ──> Real eHealth+ (Bronze) eHealth+ (Silver)     eHealth+ (Gold)
No Frontend ────> React Dashboard        React + Next.js       React + Next.js
```

---

## 9. CERTIFICATION LEVELS

| Level | Records | Accuracy | Badge |
|---|---|---|---|
| Bronze | 50+ | 80%+ | 🥉 |
| Silver | 200+ | 85%+ | 🥈 |
| Gold | 500+ | 90%+ | 🥇 |
| Platinum | 1,000+ | 95%+ | 💎 |
| Diamond | 5,000+ | 97%+ | 👑 |

---

## 10. PRINCIPLES THAT DON'T CHANGE

| Principle | Description |
|---|---|
| **Zero Work** | Clinic never knows Enosis exists |
| **One Job** | Just translation — no analytics, dashboards, or workflow |
| **Privacy-First** | Data stays local, consent required |
| **Edge-Native** | Works offline, syncs when online |
| **AI-Native** | Learns from every translation |
| **Certification** | Viral adoption through status |
| **Cross-Industry** | One engine, many translations |

---

*Team: Enosis*
*Date: July 2026*
