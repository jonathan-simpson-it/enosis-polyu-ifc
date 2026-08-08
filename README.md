# Enosis

Universal data ingestion engine for GBA trade documents. Turns messy paper, PDFs, WeChat screenshots, and handwritten notes into verified machine-readable standards (WCO Data Model v3.11, HK TSW Phase 3 JSON). Next.js only. No Docker, no database, no external services required.

## What it does

| Step | How |
|---|---|
| Upload | Drag and drop PDF, image, Excel, CSV, or text |
| Parse | pdfjs-dist for PDFs, read-excel-file for XLSX, sharp + tesseract.js for images (eng + chi_sim + chi_tra) |
| Extract | Regex NER: HS codes, containers, weights, values, dates, countries, commodity blocks, labeled header fields |
| Verify | Deterministic confidence scoring per field, 95% review threshold (p<0.05 framing) |
| Export | WCO Data Model v3.11 JSON/XML, TSW Phase 3 JSON, mock TSW submission |

## Quick start

```bash
npm install
npm run dev
```

- Demo: http://localhost:3000/demo (interactive pipeline, live engine included)
- App: http://localhost:3000 (sign in with any email + 4+ char password)
- API docs: see the route handlers under `src/app/api/`

## Architecture

```
├── src/lib/engine/          # The ingestion engine (pure TS)
│   ├── parser.ts            # format dispatch: pdf / excel / image / csv / json / text
│   ├── pdf.ts               # pdfjs-dist text extraction (Node-safe polyfills)
│   ├── excel.ts             # read-excel-file + header-row detection
│   ├── ocr.ts               # sharp pre-process + tesseract.js
│   ├── ner.ts               # regex NER + flattened-table fallback + shop-note patterns
│   ├── vision.ts            # OpenRouter vision fallback for handwriting
│   ├── translate.ts         # zh-Hant-HK / zh-Hans-CN / en translation
│   ├── confidence.ts        # deterministic per-field scoring
│   ├── hsCodes.ts           # 101 embedded HS codes + fuzzy match
│   ├── wco.ts / validator.ts / sanitizer.ts
│   └── store.ts             # in-memory registry, seeded with demo docs
├── src/app/api/             # route handlers mirroring the old REST surface
│   ├── documents/           # upload, process (stateless), list, CRUD
│   ├── extraction/          # process/[id], commodities, approve/[id]
│   ├── export/              # formats, [id] (wco_json/wco_xml/tsw_json), [id]/submit
│   ├── translate/           # text translation endpoint
│   └── auth/                # demo-mode tokens
├── src/app/demo/            # interactive pipeline demo (theater + live engine)
├── src/app/                 # landing, dashboard, upload, review, exports, settings
├── public/data/mock/        # sample documents for the demo
├── public/data/paper/       # messy-paper OCR test fixtures
└── legacy/                  # the original FastAPI + Postgres implementation
```

Notes:

- `POST /api/documents/process` is the stateless live engine: multipart file in, extraction result out. Powers the demo's live path.
- The in-memory store is seeded per server instance. Vercel KV/Blob can be added for cross-instance persistence; not needed for the demo.
- OCR languages are configurable via `ENOSIS_OCR_LANGS` (default `eng+chi_sim+chi_tra`). First OCR call downloads traineddata, roughly 20MB.
- The original FastAPI + Postgres + Docker implementation lives on the `legacy` git branch and under `legacy/`.
