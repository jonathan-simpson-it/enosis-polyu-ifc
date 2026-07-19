# HKICTA 2026 Student Innovation Award — Delivery Checklist

## Deadlines

| Milestone | Date | Status |
|---|---|---|
| **Enrolment** | 20 July 2026 | ☐ ENROL TODAY at https://icta-apply.itda.hk/ |
| Adjudication begins | 17 Aug 2026 | — |
| Adjudication ends | 25 Sep 2026 | — |
| Category Awards Ceremony | 19 Nov 2026 (tentative) | — |
| Grand Ceremony + Dinner | 19 Nov 2026 (tentative) | — |

## Submission Components

| Component | Required | Status |
|---|---|---|
| Online enrolment | Yes | ☐ |
| PPT proposal (all required sections) | Yes | ☐ |
| Cover slide bilingual (EN + CN) | Yes | ☐ |
| Project name + school on every slide | Yes | ☐ |
| At least 1 page of diagrams/photos | Yes | ☐ |
| Video (YouTube, unlisted, max 3 min) | Optional | ☐ |
| Prototype (compulsory for Higher Ed) | Yes | ☐ |

## Required Sections Covered

| Section | Source data ready? | In PPT? |
|---|---|---|
| Cover Slide (bilingual) | Yes — Section A | ☐ |
| Existing Problem(s) | Yes — Section B of data file | ☐ |
| Project Introduction & Objectives | Yes — Section C | ☐ |
| Technology Applied & AI in Proposal | Yes — Section D | ☐ |
| Proposed Solution & Proof of Concept | Yes — Sections C, D, E | ☐ |
| Prototype | Yes — Section E + screenshots | ☐ |
| Project Vision: Market & Social Impact | Yes — Sections F, G, H | ☐ |
| Design Diagrams / Visuals | Yes — Section L (8 PNGs, ASCII to redraw) | ☐ |
| Video (optional) | Not started | ☐ |

## Thematic Focus Coverage

| Theme | Coverage | Needs writing? |
|---|---|---|
| **AI & Data Literacy** (primary) | Strong — 5 novel AI contributions, AI+ initiative alignment | No — pull from Sections C, D |
| **Open Data** | Good — TradeBench, open architecture, dual-license | No — pull from Section K |
| **Cultivating Nationalism** | Weak — not in existing PRD. Options in Section I | **YES** — write from scratch |
| **Wellness** | Weak — indirect connections. Options in Section J | **YES** — write from scratch |

## Judging Criteria Check

| Criterion | How we score | Source |
|---|---|---|
| **Innovation & Creativity in ICT** | 5 novel research contributions (DocFormer-Trade, HierarchicalHS, UncertaintyGuard, MetaSchema, TradeBench). Not off-the-shelf AI. Target 5 publications at ACL/NeurIPS/ICML. 3+ patent applications pending. | Sections C, D |
| **Functionality** | Production MVP: FastAPI backend + Next.js dashboard. 25 tests. Docker Compose. End-to-end pipeline from PDF upload to WCO JSON export. 6-page web UI with HITL editing. Real API — 12 documented endpoints. | Section E |
| **Market Potential / Public Acceptance** | HK$5.8B TAM. TSW Phase 3 mandate creates urgent demand (May 2026). VASP partnership strategy — enable, don't compete. Tiered SaaS with realistic unit economics. Market validated by 10+ competitors. Go-to-market via 6 channels. | Sections F, H |
| **Benefits & Impact** | 10,000+ GBA SMEs served. HK$2M-4M daily labor savings. SME inclusion via free WeChat/WhatsApp tier. Data sovereignty (Zero-Copy PII redaction). Open science (TradeBench). Construction safety (4S). Green finance (GHG/Scope 3). | Section G |
| **Quality** | Well-architected codebase. 25 passing tests. Comprehensive documentation (1,159-line PRD, build plan, research architecture doc). Docker Compose reproducible deployment. 2 language OCR (chi_sim+eng). | Sections D, E |

## New Content to Write (from scratch)

| Item | Priority | Notes |
|---|---|---|
| Bilingual cover slide (EN + CN) | High | Required by template rules |
| Nationalism angle — GBA integration / AI+ initiative | High | Options in Section I of data file. PICK ONE framing |
| Wellness angle — construction safety / worker wellbeing | Medium | Options in Section J of data file |
| Architecture diagrams (redraw from ASCII) | High | UDIE platform + pipeline flow + DocFormer-Trade |
| Video script + screen recording (3 min) | Medium | Demo walkthrough: upload → extract → export |

## Visual Assets to Prepare

| Asset | Source |
|---|---|
| UDIE Platform Architecture diagram | Redraw from `prd.md:283-348` |
| End-to-End Pipeline diagram | Redraw from `prd.md:448-506` |
| DocFormer-Trade Architecture | Redraw from `research-architecture.md:10-30` |
| Dashboard screenshots (2-3) | `/screenshots/dashboard*.png` |
| Demo workflow screenshot | `/screenshots/demo*.png` |
| Landing page screenshot (optional) | `/screenshots/landing*.png` |

## Format Rules Checklist

| Rule | Status |
|---|---|
| Project name on EVERY slide | ☐ |
| School name on EVERY slide | ☐ |
| Cover slide: English + Chinese | ☐ |
| Body slides: English or Chinese | ☐ |
| At least 1 page of diagrams/images | ☐ |
| Reference Award Prospectus / Judging Criteria | ☐ |
| Optional video: YouTube unlisted, max 3 min | ☐ |
| Can use own PPT format (template is reference only) | ☐ |

## Contact

| Channel | Detail |
|---|---|
| Email | icta.so@itda.hk |
| Phone | +852 5140 2387 |
| Website | https://icta.itda.hk/ |
| Application | https://icta-apply.itda.hk/ |
| Proposal template | https://docs.google.com/presentation/d/1LZIfIjazvqnCbuBdA59Q87d6opDsdVq8/edit |

---

## File Reference

| File | Purpose |
|---|---|
| `HKICTA-2026-Data-Collection.md` | Complete ordered data by section — pull content from here |
| `HKICTA-2026-Checklist.md` | This file — track progress |

## Key Files in Project

| File | What's in it |
|---|---|
| `prd.md` | Full 1,159-line PolyU IFC 2026 submission — primary source |
| `plan.md` | Build plan — Phase 0-1 MVP status, completeness checklist |
| `README.md` | Project overview, API docs, tech stack |
| `PolyU IFC 2026 Pitch Prep.md` | Earlier PRD draft with different revenue model and GTM details |
| `research-architecture.md` | Technical deep dive on 5 research contributions with diagrams |
| `Enosis Pitch Deck 15.pdf` | Existing PolyU IFC pitch deck — can reuse slides |
| `/screenshots/` | 8 PNG screenshots of deployed app |
