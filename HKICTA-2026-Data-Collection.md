# HKICTA 2026 Student Innovation Award — Ordered Data Collection

> Raw material organized by section. No slide scaffolding — just source pointers and content.
> Pull what you need from each section and drop it into your PPT.

---

## A. Competition Metadata

**Source:** https://icta.itda.hk/ (browser snapshot, July 2026)

- Stream: Higher Education (大學/大專組)
- Level: University / Post-secondary
- Team: 1–5 members. Teacher advisor optional for Higher Education.
- Prototype: Compulsory
- Eligibility: Full-time students at UGC-funded institutions, self-financing post-secondary institutions, or VTC
- Enrolment deadline: 20 July 2026
- Adjudication: 17 Aug – 25 Sep 2026
- Awards ceremony: 19 Nov 2026 (tentative)
- Awards: Gold, Silver, Bronze, Certificate of Merit per stream. One Grand Award across all streams. Best Use of AI special award.
- Contact: icta.so@itda.hk / +852 5140 2387
- Application portal: https://icta-apply.itda.hk/

### Judging Criteria for Higher Education

| # | Criterion |
|---|---|
| 1 | Innovation & Creativity in ICT |
| 2 | Functionality |
| 3 | Market Potential / Public Acceptance |
| 4 | Benefits & Impact |
| 5 | Quality |

Weightings vary by stream (exact percentages displayed as graphical bars on the judging page — hover reveals values; Hover over bars on https://icta.itda.hk/judging with Higher Education selected to capture exact weightings).

### Thematic Focus (address one or more)

| # | Theme |
|---|---|
| 1 | Information, Media, AI & Data Literacy |
| 2 | Open Data |
| 3 | Cultivating Nationalism |
| 4 | Wellness |

### Format Requirements (from proposal template)

- Project name and school name on EVERY slide
- Cover slide must be bilingual (English + Chinese)
- Body slides can be English or Chinese
- At least 1 page of design diagrams / pictures / photos / blueprints
- Can use own PPT format as long as required content is included
- Reference the Award Prospectus and Judging Criteria on the official site
- Video: Optional, max 3 minutes, YouTube unlisted link only
- Proposal template: https://docs.google.com/presentation/d/1LZIfIjazvqnCbuBdA59Q87d6opDsdVq8/edit

---

## B. Problem Statement / Pain Points

**Source:** `prd.md:185-219` (Part 3: Problem Statement), `PolyU IFC 2026 Pitch Prep.md:46-52`

### Pain Point 1: 80% of enterprise data is unstructured
> "AI cannot process data that isn't structured. 80% of enterprise data is unstructured. Trade data lives in PDFs, Excel, WeChat, and paper. Construction IoT data comes in dozens of proprietary formats. ESG data is buried in utility bills and manual logs."

**Source:** `prd.md:188-197`

### Pain Point 2: TSW Phase 3 is mandatory — SMEs cannot comply
> "TSW Phase 3 launched May 1, 2026. ROCARS ceased operation from midnight on that date. 10,000+ GBA logistics SMEs lack S2S capability. Manual data entry takes 45 minutes to 2 hours per declaration. Error rates exceed 5%. Custom API integrations cost HK$200,000+ — prohibitive for SMEs."

**Source:** `prd.md:199-207`

### Pain Point 3: Human cost — HK$2M-4M wasted daily
> "A logistics clerk spends 2-4 hours daily on manual data entry. With HK$100/hour labor costs, that's HK$200-400 per SME per day. Across 10,000 SMEs, that's HK$2M-4M in wasted labor daily."

**Source:** `prd.md:209`

### Pain Point 4: Existing tools don't understand trade documents
> "Existing OCR tools don't understand trade documents or HS codes. They treat trade documents as generic text — no awareness of customs-specific fields, no HS code classification, no schema validation."

**Source:** `prd.md:207`

### Pain Point 5: Cross-border data sovereignty
> "Deploying LLMs directly on raw data leads to PII leakage, Critical Data exposure, and violations of the GBA Standard Contract and China's Data Security Law. No existing solution handles this with provable guarantees."

**Source:** `prd.md:437-444`, `Pitch Prep.md:48`

### Additional Context: TSW Rollout Schedule
> "Batch 1 (May 1, 2026): Road cargo advance information (replacing ROCARS). Batch 2 (Mid-2027): Import/export declarations, cargo manifests (sea, air). Batch 3 (Mid-2027): Certificate of Origin, Dutiable Commodities permits. GETS — legacy system — to be replaced by mid-2027."

**Source:** `prd.md:114-123`

---

## C. Project Description / Solution Overview

**Source:** `prd.md:14-91` (Executive Summary + Part 1), `README.md:1-25`

### Project Name
**Enosis UDIE** — Universal AI-Ready Data Ingestion Engine
"From the Greek _enosis_ (ἕνωσις), meaning 'union' or 'bringing together' — reflecting the mission of bringing fragmented, unstructured data together into unified, structured, AI-ready formats."

**Source:** `prd.md:48-49`

### Elevator Pitch
> "We propose Enosis UDIE — a novel research platform for domain-adaptive document understanding. We're not just applying AI — we're advancing it. And we're publishing at ACL, EMNLP, ICML, and NeurIPS."

**Source:** `prd.md:1135-1148`

### Tagline
"The Universal AI-Ready Data Ingestion Engine — advancing the frontier of domain-adaptive document understanding through novel architectures, algorithms, and theoretical guarantees."

**Source:** `prd.md:16`

### Core Thesis
> "The bottleneck in AI adoption is not algorithms — it's data ingestion. Most organizations cannot deploy AI because their data is unusable. UDIE solves this at the infrastructure layer."

**Source:** `prd.md:189-197`

### What It Does
A horizontal middleware platform that:
1. Ingests any unstructured data source (PDFs, Excel, WeChat screenshots, IoT sensors, paper)
2. Sanitizes it for cross-border GBA compliance (PII redaction, Critical Data detection)
3. Standardizes it into structured schemas (WCO JSON, TSW JSON, CMP API, GHG Protocol)
4. Exports AI-ready data via API or web dashboard

### Five Novel Research Contributions

| # | Contribution | What It Does | Key Innovation | Target Venue |
|---|---|---|---|---|
| 1 | **DocFormer-Trade** | Multi-modal transformer for regulatory documents | First architecture for trade docs with complex tables, +3.2% F1 over LayoutLMv3 | ACL / EMNLP |
| 2 | **HierarchicalHS** | Contrastive learning for HS code classification | Novel hierarchical loss respecting HS taxonomy, 96.2% top-3 accuracy, 10× less data | NAACL / EACL |
| 3 | **UncertaintyGuard** | Conformal prediction for regulatory data | First provable coverage guarantees (p<0.05) for high-stakes document translation | ICML / NeurIPS |
| 4 | **MetaSchema** | Meta-learning for zero-shot schema transfer | 95% less labeled data for new verticals via MAML transfer strategies | ICLR / NeurIPS |
| 5 | **TradeBench** | Open-source benchmark for regulatory docs | First benchmark: 5 verticals, 50+ doc types, 100K+ labeled docs, CC-BY-4.0 | ACL / EMNLP datasets |

**Source:** `prd.md:18-26`, `prd.md:352-410`, `research-architecture.md:1-173`

### Beachhead: Trade & Logistics
> "TSW Phase 3 mandate creates immediate, urgent demand for data standardization. This is the largest, most urgent, and most addressable data ingestion problem in the GBA today."

**Source:** `prd.md:28`

### Expansion Verticals (via MetaSchema zero-shot transfer)
1. **Construction Tech:** 4S Smart Site Safety System → Centralized Management Platform (CMP) payloads. Mandatory for projects > HK$30M. 500+ firms.
2. **Supply Chain ESG:** HKEX Scope 3 Climate Disclosures → GHG Protocol schemas. 200+ listed companies. Effective 2025-2026.

**Source:** `prd.md:246-279`

### Mission & Vision

**Mission:** "To advance the frontier of domain-adaptive document understanding through novel architectures, algorithms, and theoretical contributions — making all GBA enterprise data AI-ready starting with trade, expanding to construction, ESG, and beyond."

**Vision:** "To become the standard research platform for domain-adaptive document understanding — advancing AI research while solving real-world compliance problems across the GBA economy."

**Source:** `prd.md:62-69`

### Key Differentiators vs Competitors

| Dimension | Enosis UDIE | Tradelink T+ | TradeDoc.AI | Deep Cognition |
|---|---|---|---|---|
| Scope | Research platform | Trade product | Trade product | Trade product |
| Novelty | 5 novel architectures | Off-the-shelf AI | Off-the-shelf AI | Off-the-shelf AI |
| Publications | 5+ target (ACL/NeurIPS) | None | None | None |
| Multi-Vertical | Zero-shot via MetaSchema | Trade only | Trade only | Trade only |
| Provable Guarantees | Conformal prediction | No | No | No |
| Partner Strategy | Enable VASPs | Compete with VASPs | Compete | Compete |
| GBA Focus | Yes | Yes | No | No |
| IP | Patent-pending | None | None | None |

**Source:** `prd.md:80-91`

---

## D. Technology & AI Application

**Source:** `prd.md:352-506` (Part 5: Technical Architecture), `research-architecture.md:1-173`, `plan.md:7-38`

### Production Technology Stack

| Component | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy (async) |
| Database | PostgreSQL 16 + pgvector (vector similarity search) |
| Auth | JWT (python-jose) + bcrypt + API keys |
| AI / LLM | DeepSeek v4-flash API + sentence-transformers |
| ML Framework | PyTorch (for research models) |
| OCR | Tesseract (chi_sim+eng language support) |
| PDF Parsing | pdfplumber + PyPDF2 |
| Excel Parsing | openpyxl + pandas |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| UI | @phosphor-icons/react, motion (animation) |
| Testing | Pytest (25 unit tests), Playwright (E2E) |
| Deployment | Docker Compose (3 services: API + PostgreSQL + Frontend) |

**Source:** `prd.md:412-425`, `README.md:88-103`, `plan.md:10-25`

### DocFormer-Trade — Technical Detail

> "First transformer architecture designed specifically for regulatory documents with complex layouts, tables, and nested fields. Input: text tokens + layout coordinates + visual patch embeddings. Architecture: multi-modal encoder with cross-attention between text, layout, and visual streams. Key innovation: layout-aware self-attention that captures spatial relationships between fields (e.g., 'HS code' header above '8471.30' value). Baseline: LayoutLMv3 achieves 92.1% F1 on CORD; DocFormer-Trade achieves 95.3% F1. Improvement: +3.2% F1 over SOTA, +8.5% over text-only models."

**Source:** `prd.md:356-366`

### HierarchicalHS — Technical Detail

> "Novel hierarchical loss function that respects the 6-digit HS code taxonomy structure. Architecture: BERT encoder + hierarchical classification head with contrastive learning. Key innovation: contrastive loss enforces that similar products map to nearby codes in the HS hierarchy. Achieves 96.2% top-3 accuracy with only 500 labeled examples per class (10× less than SOTA). Hierarchical loss splits 6-digit codes into chapter (2-digit), heading (4-digit), subheading (6-digit) with cumulative penalties."

**Source:** `prd.md:368-377`

### UncertaintyGuard — Technical Detail

> "First application of conformal prediction to high-stakes regulatory document translation. Method: split conformal prediction with non-conformity score based on model uncertainty + semantic distance. Guarantee: provable coverage — P(correct value ∈ prediction set) ≥ 1-α with α=0.05. Key innovation: adaptive prediction sets that expand for ambiguous fields and contract for clear ones. Simple threshold methods have no statistical guarantees."

**Source:** `prd.md:379-388`

### MetaSchema — Technical Detail

> "First meta-learning framework for cross-vertical regulatory schema transfer. Architecture: Model-agnostic meta-learning (MAML) with schema-specific adaptation layers. Key innovation: learns transfer strategies across regulatory domains — not just feature representations. Reduces labeled data for new verticals by 95% vs. training from scratch. Verticals tested: Trade → Construction (4S CMP), Trade → ESG (GHG Protocol)."

**Source:** `prd.md:390-399`

### TradeBench — Technical Detail

> "First open-source benchmark for regulatory document understanding. Coverage: 5 verticals (trade, construction, ESG, finance, healthcare), 50+ document types. Size: 100,000+ labeled documents with expert annotations. Annotations: text, layout, entity-level labels with schema mappings. License: CC-BY-4.0."

**Source:** `prd.md:401-410`

### End-to-End Pipeline

```
1. DATA INGESTION
   Web Portal: drag-and-drop PDF/Excel/Image
   API: POST /documents with file attachment
   IoT: POST /telemetry with sensor data

2. DOCUMENT PROCESSING
   OCR (if scanned) → Text extraction
   PDF parsing → Structured data
   Excel parsing → Tabular data

3. SEMANTIC EXTRACTION
   NER: Extract entities (HS codes, weights, dates)
   HS Code Mapping: pgvector similarity search
   Confidence Scoring: 0-100% per field

4. SCHEMA MAPPING & VALIDATION
   Schema validation against target standard
   Business rule validation
   Confidence threshold: ≥95% = auto-approved, <95% = flagged for review

5. EXPORT
   Web Dashboard: Review and export
   API: GET /documents/{id}/export
   Formats: WCO XML, TSW JSON, CMP API, GHG Protocol

6. SUBMISSION (via Partner)
   Trade: Customer or VASP submits to TSW
   Enosis does NOT submit directly — liability stays with submitting party
```

**Source:** `prd.md:448-506`

### Current MVP Implementation (Production)

The current production pipeline uses deterministic methods that the research stubs will replace:
- Regex-based NER (`extraction/ner.py`) → Will be replaced by DocFormer-Trade (Phase 2)
- pgvector cosine similarity (`extraction/vector.py`) → Will be replaced by HierarchicalHS (Phase 2)
- Heuristic confidence thresholds (`extraction/confidence.py`) → Will be enhanced by UncertaintyGuard (Phase 2)
- Not applicable (trade-only) → Will be extended by MetaSchema (Phase 3)

The stubs are designed as "drop-in replacements" — same interfaces, enhanced capability.

**Source:** `research-architecture.md:164-173`

### Data Sovereignty Architecture

Two-instance deployment:
- Hong Kong Instance: AWS/GCP Hong Kong — data stays in HK
- Mainland Instance: Alibaba Cloud / Tencent Cloud — data stays in mainland

**No cross-border data transfer. Period.**

Legal compliance: GBA Standard Contract, China DSL, PIPL, local counsel in both jurisdictions.

**Source:** `prd.md:430-444`

### Human-in-the-Loop (HITL)

Review page with full editable header fields and commodities table. Low-confidence extractions flagged for manual correction. Corrections stored as active learning feedback for model improvement.

**Source:** `plan.md:13`

---

## E. Proof of Concept / Current Status

**Source:** `plan.md:7-38` (Phase 0-1 complete items)

### Production MVP — Complete

- FastAPI + PostgreSQL + pgvector async backend
- Multi-tenant auth (JWT + API keys, org accounts, user roles)
- Document processing pipeline (PDF, Excel, OCR, CSV, JSON) — end-to-end fixed and running
- PII redaction and file validation wired into upload path. Passport regex tightened to avoid container number collision
- Regex-based NER: HS codes, containers, weights, values, dates, consignor/consignee, ports, incoterms. Labeled-field parsing. Numbered commodity-block parsing. Full country-name mapping. DD-MMM-YYYY date recognition. CSV structured-data support
- pgvector similarity search for HS code matching
- Deterministic confidence scoring (accounts for commodity count, header field coverage)
- DeepSeek API fallback for WCO JSON generation
- WCO Data Model v3.11 JSON builder
- TSW Phase 3 export format
- Schema validation (HS code format, business rules)
- Export API: WCO JSON, TSW JSON, WCO XML (real XML, not JSON masquerading)
- Mock TSW submission client (lenient with missing header fields; in-memory mock returns reference)
- Next.js + TypeScript dashboard: 6 pages (Dashboard, Upload, Documents, Review with HITL editing, Exports, Settings) — all wired to real API
- Docker Compose: 3 services (PostgreSQL + API + Frontend)
- 25 passing unit tests
- 28 HS codes in knowledge base with embedding support

### Research Stubs — Complete

- All 5 contributions have architecture design stubs at `backend/src/research/`
- API endpoint: `GET /api/v1/research` lists all 5 with metadata
- Architecture design doc: `backend/docs/research-architecture.md`

**Source:** `plan.md:28-38`

### API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account + organization |
| POST | `/api/v1/auth/login` | JWT login |
| GET | `/api/v1/auth/me` | Current user info |
| POST | `/api/v1/documents/upload` | Upload file (PDF/Excel/Image/JSON/CSV) |
| GET | `/api/v1/documents` | List documents |
| GET | `/api/v1/documents/{id}` | Get document detail |
| POST | `/api/v1/extraction/process/{id}` | Run NER extraction |
| POST | `/api/v1/extraction/approve/{id}` | Approve extraction |
| POST | `/api/v1/export/{id}` | Export as WCO JSON / TSW JSON |
| POST | `/api/v1/export/{id}/submit` | Submit to TSW |
| GET | `/api/v1/research` | List research contributions |
| GET | `/health` | Health check |

**Source:** `README.md:41-55`

---

## F. Market Data & Revenue Model

**Source:** `prd.md:95-183` (Part 2: Market Background), `prd.md:692-764` (Part 8: Business Model), `Pitch Prep.md:246-263`

### GBA Economic Context

| Metric | Value |
|---|---|
| GBA Economic Volume (2025) | >15 trillion yuan |
| GBA GDP (2024) | 14.79 trillion yuan |
| GBA Airport Cargo (2025) | 9.72 million tonnes |
| Hong Kong External Trade | Over HK$8 trillion annually |
| Hong Kong SMEs | ~360,000 (98% of enterprises) |
| GBA Logistics SMEs | 10,000-12,000 (estimated) |

**Source:** `prd.md:100-108`

### Market Size

| Metric | Value | Source |
|---|---|---|
| HK Freight & Logistics Market (2025) | USD 22.37B | Research & Markets |
| GBA Trade Tech TAM | HK$5.8B | Industry estimate |
| GBA Logistics SMEs | 10,000-12,000 | Industry estimate |
| Annual SME spend on manual data entry | HK$30,000-50,000 | Industry estimate |
| Total addressable pain | HK$500M+ | Calculated |

**Source:** `prd.md:172-182`

### TSW Phase 3 Timeline

| Batch | Date | Coverage |
|---|---|---|
| Batch 1 | May 1, 2026 | Road cargo advance information (replacing ROCARS) |
| Batch 2 | Mid-2027 | Import/export declarations, cargo manifests (sea, air) |
| Batch 3 | Mid-2027 | Certificate of Origin, Dutiable Commodities permits |

**Source:** `prd.md:117-120`

### VASP Framework

> "TSW Phase 3 introduces Value-Added Service Providers (VASPs) — accredited entities that can submit documents and pay government fees on behalf of trading firms. VASP applications are now open. Briefing session August 6, 2026. Enosis's strategy: partner with existing VASPs rather than attempting to become one. We translate; they submit."

**Source:** `prd.md:135-155`

### Revenue Model — Tiered SaaS

| Tier | Price | What's Included | Target Customer |
|---|---|---|---|
| Basic | HK$1,500/month | 100 documents/month, web dashboard, CSV/JSON export | Low-volume SMEs |
| Professional | HK$3,000/month | 500 documents/month, API access, basic integrations | Growing freight forwarders |
| Enterprise | HK$5,000+/month | Unlimited documents, full API, white-label, dedicated support | Large logistics firms, VASPs |
| API Developer | HK$500/month | 1,000 API calls, basic support | Developers, integrators |

"No per-transaction fees. Predictable revenue."

**Source:** `prd.md:696-703`

### Alternative Revenue Model (from pitch)

| Tier | Price | Who Pays |
|---|---|---|
| Enterprise API | HK$0.50–2.00/GB processed | Enterprise IT departments, SIs, Big 4 |
| Active Supplier Node | HK$500/node/month | Anchor corporations |
| SME Portal | Free | SME suppliers via WeChat/WhatsApp |
| Open Source SDK | Free | Individual developers |
| Audit Partner License | HK$20,000+/year per firm | Big 4 / ESG consulting firms |

**Source:** `Pitch Prep.md:248-255`

### Financial Projections

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Active Accounts | 50 | 150 | 300 |
| ARR | HK$1.8M | HK$5.4M | HK$12M |
| Gross Margin | 60% | 70% | 78% |
| Operating Margin | -80% | -15% | +15% |
| CAC | HK$10,000 | HK$8,500 | HK$7,500 |
| LTV (3-year) | HK$54,000 | HK$90,000 | HK$144,000 |
| LTV/CAC Ratio | 5× | 10× | >10× |
| Profitable? | No | No | Yes (Year 4) |

**Source:** `prd.md:754-763`

### Go-to-Market Channels

1. **Logistics Associations:** HKLA, Chamber of HK Logistics Industry, Freight Forwarders Association. Pilot programs → endorsements → member referrals.
2. **VASP Partnerships:** Partner with 3-5 existing VASPs (including Tradelink). We translate; they submit. Revenue share or referral fee.
3. **Direct Sales:** Outbound to mid-tier freight forwarders. 1 salesperson Year 1 → 3 by Year 3.
4. **PolyU IFC Network:** Academic pilot with PolyU's Department of Logistics and Maritime Studies.
5. **Big 4 Auditors:** PwC, EY, Deloitte, KPMG. ESG audit teams spend thousands of hours manually cleaning supplier invoices.
6. **Open Source Developer Wedge:** Free edge-agent SDK → production enterprise API.

**Source:** `prd.md:706-733`, `Pitch Prep.md:214-241`

### Expansion Verticals Market Size

| Vertical | Mandate | TAM | Timeline |
|---|---|---|---|
| Trade | TSW Phase 3 (May 2026) | HK$5.8B | Year 1 — Beachhead |
| Construction (4S) | Mandatory for projects > HK$30M | HK$500M+ | Year 2-3 |
| ESG (GHG) | HKEX Scope 3 (2025-2026) | HK$300M+ | Year 3-4 |

**Source:** `prd.md:247-279`

---

## G. Social Impact & Benefits

**Source:** `prd.md:185-219`, `Pitch Prep.md:55-63`

### Economic Efficiency
> "HK$2M-4M in wasted labor daily across 10,000+ GBA logistics SMEs eliminated through automated document processing. A logistics clerk spends 2-4 hours daily on manual data entry — with this platform, that goes to near zero."

**Source:** `prd.md:209`

### SME Inclusion
> "Free tier via WeChat/WhatsApp for suppliers with zero IT capability. No software installation. No registration required. Immediate local value: free Green Readiness Score, automated VAT verification."

**Source:** `Pitch Prep.md:110-115`

### Regulatory Compliance
> "Helps SMEs comply with the mandatory TSW Phase 3 (effective May 1, 2026), preventing business disruption from the ROCARS system shutdown. Extends to DSL, PIPL, and GBA Standard Contract compliance."

**Source:** `prd.md:114-123`

### Data Sovereignty
> "Zero-Copy Data Privacy model — edge agents strip PII before data ever leaves client premises. Two-instance deployment (HK + mainland) with no cross-border transfer. Critical Data quarantined locally under DSL."

**Source:** `prd.md:430-444`

### Open Science
> "TradeBench — the first open-source benchmark for regulatory document understanding. CC-BY-4.0 license. 5 verticals, 50+ document types, 100,000+ labeled documents. Advances global AI research and establishes Chinese/HK research leadership."

**Source:** `prd.md:401-410`

### Construction Safety
> "Platform extends to 4S Smart Site Safety System, potentially improving construction site safety compliance for 500+ firms. Mandatory for all construction projects exceeding HK$30 million."

**Source:** `prd.md:260-268`

### Green Finance
> "Platform extends to GHG protocol schemas for HKEX Scope 3 climate disclosures. Supports Hong Kong's green finance agenda. Enables sustainability-linked loan verification via FinTech alliances."

**Source:** `prd.md:270-279`

### Target Users / Beneficiaries
1. Enterprise Data Engineers / AI Architects — building RAG pipelines, need clean data
2. System Integrators (SIs) — spend 80% of project budgets cleaning client data
3. Compliance Officers — GBA Standard Contract, DSL, PIPL compliance
4. Sustainability Managers — accurate Scope 3 carbon data from suppliers
5. SME Supplier Clerks — 10,000+ GBA logistics SMEs needing zero-IT document submission
6. Open Source Developers — free edge-agent SDK for local PII masking and OCR
7. Big 4 Auditors (PwC, EY, Deloitte, KPMG) — ESG audit teams manually cleaning supplier invoices

**Source:** `Pitch Prep.md:57-63`

---

## H. Competitive Landscape

**Source:** `prd.md:603-689` (Part 7)

### Key Competitors

**Tradelink T+ (Hong Kong) — The Incumbent**
- Launched May 2026. ~70% of HK trade declarations. 50,000+ SMEs over 38 years.
- AI Customs Declaration Assistant, HS Code AI Classifier (>95% accuracy), 3-month free trial, 20+ partners.
- Enosis positioning: "Tradelink T+ is a trade product. We are a horizontal platform. We don't compete — we partner."

**TradeDoc.AI (Singapore)**
- Founded 2025. Pre-seed from GTR Ventures and INSEAD AI Venture Lab. AI document digitization and validation. 95%+ target accuracy.

**Deep Cognition / PaperEntry AI (USA)**
- Founded 2017. $1.2M funding (including Mark Cuban). Customs clearance document processing. 97%+ out-of-the-box accuracy. 35+ forwarders, including top-25 global firms.

**Other Global Players:** MarkIt (YC Launch), KlearNow.AI, Forto, DocUnlock, Wove, Mirage Metrics

### Three Core Unfair Moats

**Moat 1: Zero-Copy Compliance**
> "The edge agent performs local PII redaction and Critical Data quarantine before data ever hits the cloud. Competitors say: 'Trust our secure cloud.' We say: 'We don't even want your raw data.'"

**Moat 2: SME Network Effect (Data Gravity)**
> "If Supplier A uploads their utility bills to satisfy Buyer X, their profile is now clean. When Buyer Y requests Scope 3 data from Supplier A, they click 'Authorize Share.' Switching costs become prohibitively high."

**Moat 3: Automated Legal-Tech Orchestration**
> "We automatically package processed schemas, generate mandatory PIPIA, and fill out GBA Standard Contract templates for direct submission to the Digital Policy Office and local CAC offices. Competitors extract text. We deliver regulatory peace of mind."

**Source:** `Pitch Prep.md:197-212`

### Research Moat
> "Competitors use off-the-shelf OCR + NLP. We contribute novel architectures (DocFormer-Trade), algorithms (HierarchicalHS, MetaSchema), provable guarantees (UncertaintyGuard), and an open-source benchmark (TradeBench). 5+ publications at ACL/NeurIPS/ICML within 24 months. 3+ patent applications pending."

**Source:** `prd.md:678-688`

---

## I. "Cultivating Nationalism" Theme — Content Options

### Option A: "Supporting Hong Kong as International Trade Hub under One Country Two Systems"
- Enosis UDIE ensures HK's 10,000+ logistics SMEs can comply with TSW Phase 3, keeping HK competitive as a global trade hub
- TSW implementation "will promote digitalization of Hong Kong's trade processes, enhance customs clearance efficiency, and further consolidate Hong Kong's competitive advantage as an international trade and logistics hub" (quote from HK Customs Assistant Commissioner)
- Two-instance deployment (HK + mainland) respects jurisdictional boundaries of One Country Two Systems
- GBA integration — bridging HK and mainland China through trade compliance infrastructure
- Platform strengthens HK's gateway role between China and global markets

### Option B: "Contributing to China's AI+ Technological Self-Reliance"
- 5 novel AI research contributions — not applying Western AI, but advancing it from Hong Kong
- Novel architectures (DocFormer-Trade, HierarchicalHS, MetaSchema) reduce dependency on Western AI frameworks
- Publications at top global venues (ACL, NeurIPS, ICML) from Hong Kong-based researchers
- Aligned with China's 15th Five-Year Plan "AI+" initiative
- Open-source TradeBench establishes Chinese research leadership in global regulatory AI benchmarks

### Additional Nationalism Angles
- **Qianhai Expansion:** Establishing a subsidiary in Qianhai (Shenzhen) contributes to national GBA development strategy
- **Youth Innovation:** As Hong Kong university students developing AI research, we demonstrate HK youth contributing to national technological priorities
- **Data Sovereignty:** Two-instance deployment ensures Chinese data stays in mainland China, protecting national data security
- **Digital Economy:** Supporting the "Digital Economy" pillar of national strategy through trade digitization
- **PolyU IFC Context:** "PolyU IFC 2026 is strategically aligned with the Nation's 15th Five-Year Plan, specifically focusing on the Artificial Intelligence (AI+) initiative" — `prd.md:882`

**Source for alignment:** `prd.md:882-889`

---

## J. "Wellness" Theme — Content Options

### Physical Wellness: Construction Safety
- 4S Smart Site Safety System integration — mandatory for projects > HK$30M
- Improving worker safety compliance through automated CMP payload generation
- Reducing construction accidents via standardized safety data

### Mental Wellness: Eliminating Drudgery
- Logistics clerks spend 2-4 hours/day on manual data entry — "a demoralizing, error-prone grind"
- Automation frees workers for higher-value work
- Reduces stress from customs delays, demurrage charges, and compliance anxiety

### Environmental Wellness: ESG & Sustainability
- HKEX Scope 3 climate disclosures — GHG Protocol compliance
- Green finance — sustainability-linked loans verified via standardized data
- Reducing paper waste through digital document processing

### Economic Wellness: SME Inclusion
- Free tier removes financial barriers for the smallest enterprises
- Prevents business disruption from TSW Phase 3 non-compliance
- Zero-IT channels make digital economy accessible to all

---

## K. "Open Data" Theme — Content

**Source:** `prd.md:401-410`, `research-architecture.md:142-160`

### TradeBench — Open-Source Benchmark
- First open-source benchmark for regulatory document understanding
- CC-BY-4.0 license — free for research and commercial use
- 5 verticals (trade, construction, ESG, finance, healthcare)
- 50+ document types
- 100,000+ labeled documents with expert annotations
- Enables reproducible AI research globally
- Target venues: ACL / EMNLP datasets track
- Establishes Chinese/HK research leadership in the field

### Open Architecture
- API-first design — any application can plug in
- Partner-enabled — VASPs, SIs, Big 4 can white-label
- No vendor lock-in — data exportable in standard formats (WCO JSON, TSW JSON, CSV)
- Edge-agent SDK planned as open-source (product-led growth)
- Dual-licensed model weights: free for research, commercial for enterprise

**Source:** `prd.md:952-954`

---

## L. Visual Assets

**Available from the project:**

| Asset | Path | Type |
|---|---|---|
| Dashboard screenshot 1 | `/screenshots/dashboard.png` | PNG |
| Dashboard screenshot 2 | `/screenshots/dashboard-v2.png` | PNG |
| Dashboard screenshot 3 | `/screenshots/dashboard-v3.png` | PNG |
| Landing page 1 | `/screenshots/landing.png` | PNG |
| Landing page 2 | `/screenshots/landing-v2.png` | PNG |
| Landing page 3 | `/screenshots/landing-v3.png` | PNG |
| Demo page 1 | `/screenshots/demo.png` | PNG |
| Demo page 2 | `/screenshots/demo-v2.png` | PNG |
| Pitch deck | `/Enosis Pitch Deck 15.pdf` | PDF |
| UDIE Architecture (ASCII) | `prd.md:283-348` | To redraw |
| System Flow Diagram (ASCII) | `prd.md:448-506` | To redraw |
| DocFormer-Trade Architecture (ASCII) | `research-architecture.md:10-30` | To redraw |
| HierarchicalHS Architecture (ASCII) | `research-architecture.md:42-59` | To redraw |
| UncertaintyGuard Architecture (ASCII) | `research-architecture.md:77-93` | To redraw |
| MetaSchema Architecture (ASCII) | `research-architecture.md:110-126` | To redraw |

**Recommendation:** Redraw the UDIE architecture, pipeline flow, and DocFormer-Trade diagrams as clean PPT/SVG graphics. Use at least 2 dashboard screenshots.

---

## M. Quick-Access Source Map

| HKICTA Section | Primary Source | Lines |
|---|---|---|
| Problem statement | `prd.md` Part 3 | 185-219 |
| Project intro / objectives | `prd.md` Executive Summary + Part 1 | 14-91 |
| Technology / AI applied | `prd.md` Part 5 + `research-architecture.md` | 352-506 / full file |
| Solution / proof of concept | `prd.md` Part 4 + `plan.md` Phase 0-1 | 222-348 / 7-38 |
| Market potential | `prd.md` Part 2 + Part 8 | 95-183 / 692-764 |
| Benefits / social impact | `prd.md` Part 3 + `Pitch Prep.md` | 185-219 / 55-63 |
| Competitive landscape | `prd.md` Part 7 | 603-689 |
| Business model / revenue | `prd.md` Part 8 + `Pitch Prep.md` Part 11 | 692-764 / 246-263 |
| Technical architecture | `prd.md` Part 5 + `README.md` | 352-506 / 27-55 |
| API endpoints | `README.md` | 41-55 |
| Research contributions | `prd.md` Part 5 + `research-architecture.md` | 356-410 / 1-173 |
| Build status / proof of concept | `plan.md` Phase 0-1 | 7-38 |
| Nationalism angle | Write from scratch — options in Section I above | — |
| Wellness angle | Write from scratch — options in Section J above | — |
| Open data angle | `prd.md` lines 401-410 | — |
| Screenshots | `/screenshots/` | 8 PNGs |
| Pitch deck | `Enosis Pitch Deck 15.pdf` | Binary |

---

## N. Deployment & Quick Start

```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env   # Edit DEEPSEEK_API_KEY
docker compose -f docker/docker-compose.yml up db -d
uvicorn backend.src.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev

# Access
# API: http://localhost:8000  |  Docs: http://localhost:8000/docs
# Frontend: http://localhost:3000
```

**Source:** `README.md:106-128`

---

## O. Glossary

| Term | Definition |
|---|---|
| TSW | Trade Single Window — HK's one-stop electronic trade declaration platform |
| ROCARS | Road Cargo System — Legacy system replaced by TSW Phase 3 (May 1, 2026) |
| GETS | Government Electronic Trading Services — Legacy system to be replaced by mid-2027 |
| VASP | Value-Added Service Provider — Accredited entities that submit declarations on behalf of traders |
| WCO | World Customs Organization — Sets global customs data standards |
| HS Code | Harmonized System Code — International product classification for customs |
| UDIE | Universal AI-Ready Data Ingestion Engine — Core platform architecture |
| GBA | Greater Bay Area — 86-million-person economic region |
| DSL | Data Security Law — Mainland China's data protection legislation |
| PIPL | Personal Information Protection Law — Mainland China's privacy law |
| PII | Personally Identifiable Information |
| S2S | System-to-System — Automated API-based integration |
| 4S | Smart Site Safety System — Mandatory for construction projects > HK$30M |
| CMP | Centralized Management Platform — Required platform for 4S compliance |
| GHG | Greenhouse Gas — Emissions reporting protocol |
| HKEX | Hong Kong Exchanges and Clearing Limited |
| PIPIA | Personal Information Protection Impact Assessment |

**Source:** `prd.md:1030-1051`
