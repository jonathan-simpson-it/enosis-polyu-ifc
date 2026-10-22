# Deep Bridge: trading and logistics B2B intelligence

An explainable, two-stage recommendation engine that matches 100 Canton Fair factory products to 65
overseas buyers who already sell pet products. Built as a case-study implementation inside the Enosis
repo: content-based ML (no deep learning in the scoring path), a pluggable learning-to-rank scaffold,
a business policy layer, and an explanation UI where every score is decomposed into features,
weights and matched evidence. Mounted at `/deepbridge` in the Enosis Next.js app.

## Quick start

```bash
# 1. Python env for the ML service (python3.12, core deps only, no torch needed)
npm run trading:setup

# 2. Build the SQLite store and pair features from data/trading/raw
npm run trading:ingest

# 3. Run the ML service (FastAPI on :8000)
npm run trading:ml

# 4. In another terminal: run the Next.js app (Enosis plus /deepbridge on :3000)
npm run dev
```

Open http://localhost:3000/deepbridge

Presentation mode: http://localhost:3000/deepbridge/tour is a 12-step guided tour of the
explainability story with LaTeX equations, live data and keyboard navigation (arrows or Space).

Optional extras:

```bash
npm run trading:vision      # re-run CLIP image precompute (needs torch + open_clip_torch + pillow)
npm run trading:train       # train the LightGBM LambdaMART scaffold (needs lightgbm)
npm run trading:regression  # refit the ridge regression on weak labels
```

Committed artifacts under `data/trading/artifacts/` (CLIP embeddings, visual similarity, fitted
models, metadata; under 1MB total) mean the full demo runs without torch and without network
downloads. `data/trading/img_cache/` and `data/trading/artifacts/clip_cache/` are gitignored and
only needed to regenerate them.

## Tests

```bash
npm run test:trading        # pytest: pipeline determinism, API contracts, policy invariants, rankers
npm run test:trading:e2e    # Playwright: all pages, tour, interactions (starts ML on :8100, Next on :3100)
npm run typecheck           # tsc across the whole repo, including /deepbridge
```

Note: `npm run lint` on the repo currently reports pre-existing errors in `tests/e2e` (Enosis test
helpers) that also exist on `main`; this branch adds none. Trading paths lint clean:
`npx eslint app/deepbridge components/trading lib/trading tests/trading`.

## Architecture

```
Next.js (App Router)                          FastAPI (Python 3.12, ml/)
app/deepbridge/*         pages                Stage 1  candidates: BM25 + TF-IDF (word+char)
components/trading/*     UI components        Stage 2  rank: weighted linear (exact
lib/trading/*            api client, types     |       contributions), ridge regression,
                                               |       or LGBM LambdaMART scaffold
data/trading/raw         2 source JSON files    Stage 3  policy: MMR + concentration caps
data/trading/artifacts   small committed        Explain: evidence, waterfall, constraints
data/trading/deepbridge.db (generated)          ml/main.py serves all of it over HTTP
```

## What is real vs what is stubbed (honesty table)

| Capability | Status | Why |
|---|---|---|
| Content similarity (BM25, TF-IDF word+char, structured attrs) | real | rich text/specs in both datasets |
| CLIP visual similarity + zero-shot tags | real (precomputed) | 100/100 images live on both sides |
| Candidate generation, MMR, concentration caps | real | no labels needed |
| Weighted-linear scoring with exact contribution waterfall | real | linear implies weight times value is exact |
| Ridge regression re-ranker | real fit, weak target | closed-form least squares on weak grades, grouped CV reported |
| LightGBM LambdaMART re-ranker | scaffold | **no conversion labels exist**: weak/synthetic labels, falls back to linear |
| Market fit (certs, export markets) | partial | supplier export markets 40% null; certs parsed from free text |
| Margin / risk / price imputation | stub (weight 0) | only 4 of 100 supplier prices exist; no cost or credit data |
| Seasonality, repeat timing, bulk elasticity, inventory aging | deferred | no timestamps or transactions in the dataset |
| Conversion lift vs buyer baseline | deferred (pilot) | requires transaction history |

## Data findings that shaped the design

- Buyer entity is `supplier_name` in the catalog: 65 buyers, 30 singletons, at most 2 products each.
- All 100 buyer products share one category ("Pet care and supplies"), so discrimination comes from
  text, structured attributes and visual features rather than taxonomy.
- 86% of supplier prices say "Contact For Quotation" and `supplier_tags` is 85% null, so margin is
  not estimable and is shown as a flagged stub instead of an invented number.
- MOQ units are inconsistent (pcs/piece/bag/set/KG), normalized to canonical units with the raw text
  preserved; bulk units are penalized in feasibility.
- Images are live on both sides, so frozen CLIP ViT-B/32 embeddings add a visual channel and fill
  species/type/color gaps left by structured fields (hybrid tagging: keyword base, CLIP gaps only).

## Edition notes

- No Docker, SQLite in WAL mode, single writer (the ML service owns the DB), Next.js reads nothing
  directly: the web app talks to FastAPI over HTTP.
- All dash-free UI copy; equations rendered with KaTeX.
- The ML service port is 8000 in dev; E2E runs it on 8100 with the web app on 3100.