# Enosis UDIE — Research Architecture

## Five Novel Research Contributions

The Enosis UDIE platform is powered by five original research contributions spanning multi-modal document understanding, hierarchical classification, conformal prediction, meta-learning, and benchmark design.

---

## 1. DocFormer-Trade — Multi-Modal Transformer for Regulatory Documents

### Pipeline Integration

```
Raw Document (PDF/Image)
        │
        ▼
┌───────────────────────────┐
│  DocFormer-Trade          │
│  ┌─────────────────────┐  │
│  │ Text Stream (BERT)  │◄─│── Text tokens
│  │ Layout Stream       │◄─│── 2D bounding boxes
│  │ Visual Stream (ViT) │◄─│── Image patches
│  └─────────────────────┘  │
│  │ Cross-Attention Fusion │
│  │ Entity Classification  │
│  └────────────────────────┘
        │
        ▼
    Extracted Entities (HS codes, weights, dates, etc.)
```

### Current Alternative
`backend/src/extraction/ner.py` — Regex-based entity extraction (no ML)

### When DocFormer-Trade Replaces It
- Phase 2 after collecting 1,000+ labeled trade documents
- Target: +3.2% F1 improvement over LayoutLMv3

---

## 2. HierarchicalHS — Contrastive Learning for HS Code Classification

### Pipeline Integration

```
Commodity Description ("Integrated circuits 7400 series")
        │
        ▼
┌────────────────────────────┐
│  HierarchicalHS            │
│  ┌──────────────────────┐  │
│  │ Sentence-BERT        │  │── 384-dim embedding
│  │ Chapter Head (2-dig) │  │── "85" (Electrical machinery)
│  │ Heading Head (4-dig) │  │── "8542" (Electronic ICs)
│  │ Subheading (6-dig)   │  │── "8542.31" (Processors)
│  └──────────────────────┘  │
│  → Contrastive loss enforces│
│    HS taxonomy proximity   │
└────────────────────────────┘
        │
        ▼
    Predicted HS Code: 8542.31.00 (confidence: 0.96)
```

### Current Alternative
`backend/src/extraction/vector.py` — pgvector cosine similarity search (no learned model)

### When HierarchicalHS Replaces It
- Phase 2 after collecting 500+ labeled examples per HS chapter
- Target: 96.2% top-3 accuracy, 10× less labeled data

---

## 3. UncertaintyGuard — Conformal Prediction for High-Stakes Data

### Pipeline Integration

```
Model Prediction (HS code: 8542.31, confidence: 0.87)
        │
        ▼
┌────────────────────────────┐
│  UncertaintyGuard           │
│  ┌──────────────────────┐  │
│  │ Calibration Set      │  │── 1,000 held-out examples
│  │ Non-conformity Score │  │── Model conf + semantic distance
│  │ Threshold q_hat      │  │── Quantile of calibration scores
│  │ Adaptive Set Builder │  │── Expands/contracts per ambiguity
│  └──────────────────────┘  │
│  → Provable: 95% coverage  │
│    (p < 0.05)             │
└────────────────────────────┘
        │
        ▼
    Prediction Set: [8542.31.00, 8542.39.00]
    → Ambiguous → Flag for human review
```

### Current Alternative
`backend/src/extraction/confidence.py` — Heuristic thresholds (≥0.85 = auto-approved)

### When UncertaintyGuard Enhances It
- Phase 2 after calibration data collection
- Adds provable error bounds to existing confidence scores

---

## 4. MetaSchema — Meta-Learning for Zero-Shot Schema Transfer

### Pipeline Integration

```
Source Verticals (Trade, Construction, ESG, etc.)
        │
        ▼
┌────────────────────────────┐
│  MetaSchema (MAML)         │
│  ┌──────────────────────┐  │
│  │ Meta-Training        │  │── Learn transfer strategies
│  │ Inner Loop           │  │── Fast adaptation (few shots)
│  │ Outer Loop           │  │── Meta-optimization
│  │ Schema Adapter       │  │── New vertical adaptation layer
│  └──────────────────────┘  │
│  → Zero-shot: 95% less     │
│    labeled data needed     │
└────────────────────────────┘
        │
        ▼
    New Vertical Schema (e.g., CMP API, GHG Protocol)
    → Schema-compliant output with < 50 labeled examples
```

### Current Alternative
Not applicable — currently trade-only

### When MetaSchema Expands Beyond Trade
- Phase 3 after collecting cross-vertical schema mappings
- Enables zero-shot deployment to construction and ESG

---

## 5. TradeBench — Open-Source Benchmark

### Dataset Structure

```
tradebench/
├── trade/              35,000 docs  (invoices, P/L, B/L, customs declarations)
├── construction/       15,000 docs  (4S CMP reports, IoT sensor logs)
├── esg/                15,000 docs  (GHG reports, utility bills)
├── finance/            20,000 docs  (financial statements, audit reports)
├── healthcare/         15,000 docs  (eHealth records, clinical notes)
├── metadata.json
└── README.md
```

### When TradeBench Is Released
- Phase 3 after data collection and annotation
- Open-source under CC-BY-4.0
- Target venues: ACL / EMNLP datasets track

---

## Integration Summary

| Research Contribution | Production Module | Replacement Timeline | Status |
|---|---|---|---|
| DocFormer-Trade | `extraction/ner.py` | Phase 2 | 🔧 Stub |
| HierarchicalHS | `extraction/vector.py` | Phase 2 | 🔧 Stub |
| UncertaintyGuard | `extraction/confidence.py` | Phase 2 | 🔧 Stub |
| MetaSchema | `schema/registry.py` | Phase 3 | 🔧 Stub |
| TradeBench | `data/` | Phase 3 | 🔧 Stub |

**Legend:** ✅ Live | 🔧 Stub (design complete, implementation in progress) | 📋 Planned
