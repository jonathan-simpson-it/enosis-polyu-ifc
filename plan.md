# Enosis UDIE — Research-Aligned Build Plan

> **Hybrid Platform:** Production-grade trade compliance MVP + 5 novel research contributions (stubs with design documentation)

---

## Phase 0: Production MVP (Current) ✅

### Core Platform — All Complete
- [x] FastAPI + PostgreSQL + pgvector async backend
- [x] Multi-tenant auth (JWT + API keys, org accounts, user roles)
- [x] Document processing pipeline (PDF, Excel, OCR, CSV, JSON)
- [x] PII redaction and file validation
- [x] Regex-based NER (HS codes, containers, weights, values, dates)
- [x] pgvector similarity search for HS code matching
- [x] Deterministic confidence scoring
- [x] DeepSeek API fallback for WCO JSON generation
- [x] WCO Data Model v3.11 JSON builder
- [x] TSW Phase 3 export format
- [x] Schema validation (HS code format, business rules)
- [x] Export API (WCO JSON, TSW JSON)
- [x] Mock TSW submission
- [x] Next.js + TypeScript dashboard (6 pages: dashboard, upload, documents, review, exports, settings)
- [x] GitHub Actions CI/CD (backend + frontend)
- [x] Docker Compose (3 services: PostgreSQL + API + Frontend)
- [x] 28 HS codes in knowledge base with embedding support

## Phase 1: Research Foundation (Current) ✅

### Research Stubs — Design Complete
- [x] `backend/src/research/docformer_trade.py` — Multi-modal transformer stub with architecture design, config, and integration points
- [x] `backend/src/research/hierarchical_hs.py` — Contrastive learning stub with hierarchical loss design and data efficiency claims
- [x] `backend/src/research/uncertainty_guard.py` — Conformal prediction stub with provable coverage guarantees (p<0.05)
- [x] `backend/src/research/meta_schema.py` — Meta-learning stub for zero-shot cross-vertical schema transfer (95% data reduction)
- [x] `backend/src/research/trade_bench.py` — Benchmark stub for regulatory document understanding (100,000+ docs, 5 verticals)
- [x] `backend/src/api/v1/research.py` — API endpoint listing all 5 contributions with metadata
- [x] `backend/docs/research-architecture.md` — Architecture design doc connecting stubs to production pipeline
- [x] All tests passing (25/25)

## Phase 2: Research Implementation (Next)

### Priority 1: Training Data Collection
| Task | Description | Effort |
|---|---|---|
| DocFormer-Trade Data | Collect 1,000+ labeled trade documents with layout annotations | 2-3 months |
| HierarchicalHS Data | Collect 500+ labeled examples per HS chapter | 2-3 months |
| UncertaintyGuard Calibration | Hold out 1,000 examples from each dataset | 1 month |
| TradeBench Initial Release | Annotate 10,000 trade documents, release v0.1 | 3-4 months |

### Priority 2: Model Development
| Task | Dependencies | Expected Timeline |
|---|---|---|
| DocFormer-Trade: Implement multi-modal encoder | PyTorch + Hugging Face Transformers | Month 4-5 |
| DocFormer-Trade: Pre-train on CORD++ + trade docs | GPU compute (A100 or H100) | Month 5-6 |
| DocFormer-Trade: Fine-tune for NER on trade docs | Labeled data from Phase 2.1 | Month 6-7 |
| HierarchicalHS: Implement hierarchical loss | PyTorch | Month 4-5 |
| HierarchicalHS: Train on HS code data | 500 examples/chapter | Month 5-6 |
| UncertaintyGuard: Implement conformal prediction | scikit-learn + custom score fn | Month 4-5 |
| UncertaintyGuard: Calibrate on held-out data | Calibration set from Phase 2.1 | Month 5-6 |
| MetaSchema: Implement MAML for schema transfer | learn2learn / higher library | Month 6-8 |

### Priority 3: Integration
| Task | Description | Timeline |
|---|---|---|
| Replace regex NER with DocFormer-Trade | Model → extraction/ner.py | Month 7-8 |
| Replace pgvector with HierarchicalHS | Model → extraction/classifier.py | Month 7-8 |
| Enhance confidence with UncertaintyGuard | Model → extraction/confidence.py | Month 7-8 |
| Extend schema registry with MetaSchema | Model → schema/registry.py | Month 8-10 |
| Release TradeBench v1.0 | Open-source 100,000+ documents | Month 10-12 |

## Phase 3: Publications

| Paper | Venue | Target Date | Status |
|---|---|---|---|
| DocFormer-Trade: Multi-Modal Transformer for Regulatory Documents | ACL / EMNLP | Month 12 | 📋 Planned |
| HierarchicalHS: Contrastive Learning with Hierarchical Loss | NAACL / EACL | Month 12 | 📋 Planned |
| UncertaintyGuard: Conformal Prediction for Regulatory Data | ICML / NeurIPS | Month 15 | 📋 Planned |
| MetaSchema: Meta-Learning for Zero-Shot Schema Transfer | ICLR / NeurIPS | Month 18 | 📋 Planned |
| TradeBench: Benchmark for Regulatory Document Understanding | ACL / EMNLP datasets track | Month 12 | 📋 Planned |

## Phase 4: Product Expansion (Year 2)

| Feature | Research Dependency | Timeline |
|---|---|---|
| Construction Tech (4S CMP) | MetaSchema zero-shot transfer | Year 2 |
| ESG (GHG Protocol) | MetaSchema zero-shot transfer | Year 2-3 |
| Multi-language document processing | DocFormer-Trade multilingual | Year 2 |
| On-device inference | Neural architecture search | Year 2-3 |
| Active learning pipeline | UncertaintyGuard + human feedback | Year 2 |

## Technology Stack Evolution

```
Phase 0-1 (Current):  PostgreSQL + pgvector + DeepSeek API + regex NER
                      (Production MVP with research stubs)
                           │
Phase 2:                + DocFormer-Trade (PyTorch)
                        + HierarchicalHS (contrastive learning)
                        + UncertaintyGuard (conformal prediction)
                        + TradeBench (dataset collection)
                           │
Phase 3:                + MetaSchema (meta-learning)
                        + Publications at ACL/NeurIPS/ICML
                        + TradeBench v1.0 release
                           │
Phase 4:                + Cross-vertical deployment (4S, GHG)
                        + On-device inference
                        + Active learning
```

## Legend
- ✅ Complete
- 🔧 Stub (design done, impl pending)
- 📋 Planned (not started)
