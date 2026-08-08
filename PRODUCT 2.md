# ENOSIS

## Register

Brand-primary. This site is the award submission and the sales surface: judges read it before they touch the product. The dashboard and interactive demo are product-register sub-surfaces inside a brand-register shell.

## Users

- **HKICTA 2026 judges.** Decide in minutes whether the work is novel, functional, and market-relevant. They see the landing page, the demo, the video, and the architecture. The site must make the innovation legible at a glance.
- **91,000 GBA trade & logistics SMEs** facing the HK TSW Phase 3 mandate (Batch 1 live May 2026). No technical background, no budget for consultants, drowning in paper and WeChat receipts.
- **Bank credit underwriters** (21 banks in the CargoX pilot) who want risk-quantified, machine-readable SME trade data without changing their own systems.

## Purpose

Turn trapped, unstructured trade data (paper invoices, photos, WeChat screenshots, messy PDFs) into verified machine-readable standards (WCO v3.11, TSW Phase 3 JSON) with zero added work for the user. Prove the pipeline live in a browser: upload, extract with per-field confidence, review, export. The site must demonstrate the product, not describe it.

## Personality

Precise. Human. Editorial.

- Precise: numbers anchor every claim. 95% confidence guarantee (p<0.05), sub-120-second processing, HK$349/month.
- Human: the product starts with one accountant's mother. The paper mountain is real. No corporate distance.
- Editorial: the JS&C design language, cream and sage and Georgia, quiet confidence. Nothing shouts.

## Anti-references

- Generic AI-SaaS: gradient blobs, purple-on-black, "unlock the power of AI" copy, rocket emojis, identical card grids.
- Corporate fintech: navy-and-gold, photo-of-handshake heroes, "solutions" language, jargon density.
- Hype benchmarks: fake comparison tables. We do not publish numbers we cannot reproduce live.

## Design Principles

1. The paper is the villain, the JSON is the hero. Every screen should make that transformation visible.
2. Zero added work is the promise. The UI must never make the user feel like setup.
3. Confidence is the product. Show the uncertainty, flag what needs a human, never hide it.
4. One accent colour. Sage does the pointing; cream and ink do the talking.

## Accessibility

- WCAG AA minimum on all text (muted-on-surface passes AA per DESIGN.md).
- prefers-reduced-motion respected site-wide; demo theater collapses to instant states.
- Keyboard-navigable demo flow; every interactive element has focus-visible style.

## Tech Constraints

- Next.js only. No FastAPI, no Docker, no Postgres. In-memory store, seeded demo data, OCR and parsing run in Next.js route handlers. Deployable to Vercel as-is.
