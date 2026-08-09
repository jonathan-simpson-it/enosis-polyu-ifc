import type { Commodity } from "./types";
import sharp from "sharp";

// Primary model is FREE: gemma-4-26b is the fastest and highest-quality free
// vision model verified against the demo fixture (measured 2-26s, complete
// 15-item extractions). The OpenRouter Free Models Router (`openrouter/free`)
// was the old default but it does NOT liveness-check: it can pick a stalled
// or content-safety model that accepts images and never answers, hanging
// every request for the full budget. `ENOSIS_VISION_MODEL` overrides this
// default — e.g. pin a paid model like "google/gemini-2.5-flash" if you have
// credits and want faster, more reliable reads.
const VISION_MODEL =
  process.env.ENOSIS_VISION_MODEL || "google/gemma-4-26b-a4b-it:free";

// Second chance when the primary stalls or returns junk: a pinned free vision
// model that has produced real extractions in testing. It is slow (measured
// 19-50s) but it does answer given enough time — hence the generous budget.
const VISION_FALLBACK_MODEL =
  process.env.ENOSIS_VISION_FALLBACK_MODEL || "nvidia/nemotron-nano-12b-v2-vl:free";

// Total budget for vision. The free fallback is slow-but-working, so the
// budget must give it room to finish (measured up to ~45s). Attempts run in
// parallel (first success wins) so the budget bounds the whole call. Must
// stay under the route-level race (58s) and Vercel's maxDuration (60s).
const VISION_BUDGET_MS = 55000;

interface VisionOptions {
  signal?: AbortSignal;
}

export interface VisionExtraction {
  source: "vision";
  model_confidence: number;
  // Which model actually served the request (the router reports the real one
  // in the response `model` field).
  model_used?: string;
  commodities: Commodity[];
  labeled_fields: Record<string, string | number | null>;
  entities: {
    hs_codes: string[];
    container_numbers: string[];
    weights: string[];
    values: string[];
    quantities: string[];
    dates: string[];
    countries: string[];
    invoice_numbers: string[];
  };
  notes: string;
}

const SYSTEM_PROMPT = `You are a trade document extraction engine. Read the invoice or receipt image and extract every data point into the exact JSON shape below. Handwriting may be messy; transcribe what is legible and set unknown fields to null.

Return ONLY valid JSON, no markdown, no commentary. Shape:
{
  "invoice_number": string|null,
  "date": string|null,
  "currency": string|null,
  "total": number|null,
  "consignor": string|null,
  "consignee": string|null,
  "container_number": string|null,
  "port_of_loading": string|null,
  "port_of_discharge": string|null,
  "incoterms": string|null,
  "gross_weight": number|null,
  "net_weight": number|null,
  "number_of_packages": number|null,
  "confidence": number,
  "items": [
    { "description": string, "quantity": number|null, "unit": string|null, "unit_price": number|null, "total_value": number|null, "weight": number|null }
  ],
  "notes": string
}

Rules:
- Prices and totals are numbers without currency symbols or commas.
- Dates written as dd.mm.yy, dd/mm/yy, or dd-mm-yy are DAY.MONTH.YEAR in Indonesian documents. Convert to YYYY-MM-DD. Example: 06.08.26 becomes 2026-08-06.
- Weights and package counts are numbers only (e.g. gross_weight 662.5, number_of_packages 28).
- "confidence" is your estimate (0 to 1) of how legible and accurately you read this document.
- If the document is a shop nota, treat the nota number as invoice_number.
- If text is illegible, still include the item with null values rather than dropping it.`;

interface ChatMessage {
  role: "system" | "user";
  content:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

interface VisionAttempt {
  extraction: VisionExtraction | null;
  timedOut: boolean;
  model: string;
}

// Errors that are constant per key (e.g. 403 "Key limit exceeded") repeat on
// every request; log them once per model+status so the server console stays
// readable instead of spamming the same rejection every upload.
const loggedApiErrors = new Set<string>();

// One model, one deadline. The whole operation — headers AND body read —
// lives inside `work` so the deadline bounds every step: free-tier providers
// return headers quickly then stream an empty body forever, so racing only
// the fetch would let res.json() hang past the deadline.
async function attemptVision(
  apiKey: string,
  messages: ChatMessage[],
  model: string,
  timeoutMs: number,
  outerSignal?: AbortSignal
): Promise<VisionAttempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  outerSignal?.addEventListener("abort", onOuterAbort, { once: true });

  const work = (async () => {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://enosis.jonathansimpson.co",
          "X-Title": "Enosis Demo",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const logKey = `${model}:${res.status}`;
        if (!loggedApiErrors.has(logKey)) {
          loggedApiErrors.add(logKey);
          console.error("[enosis-vision] API error:", model, res.status, body.slice(0, 300));
        }
        return null;
      }

      const data = await res.json();
      const content: string =
        data?.choices?.[0]?.message?.content || "";
      const parsed = parseJsonFromContent(content);
      if (!parsed) return null;

      // The router reports which free model actually served the request;
      // surface it so the UI can say "Read via <model>".
      return toVisionExtraction(
        parsed,
        typeof data?.model === "string" ? data.model : model
      );
    } finally {
      clearTimeout(timer);
      outerSignal?.removeEventListener("abort", onOuterAbort);
    }
  })();

  // AbortController alone is not a hard bound: on stalled connections undici
  // may never settle the promise after abort. The deadline race guarantees
  // control returns at timeoutMs; the abandoned work's late settlement is
  // swallowed below.
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    deadlineTimer = setTimeout(
      () => reject(new DOMException("Vision timed out", "AbortError")),
      timeoutMs
    );
  });

  try {
    const result = await Promise.race([work, deadline]).finally(() =>
      clearTimeout(deadlineTimer)
    );
    work.catch(() => {});
    return { extraction: result, timedOut: false, model };
  } catch (err) {
    work.catch(() => {});
    if (err instanceof Error && err.name === "AbortError") {
      if (outerSignal?.aborted) throw err;
      return { extraction: null, timedOut: true, model };
    }
    console.error("[enosis-vision] failed:", model, err);
    return { extraction: null, timedOut: false, model };
  }
}

export async function extractWithVision(
  buffer: Buffer,
  filename: string,
  opts?: VisionOptions
): Promise<VisionExtraction | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  // Downscale before sending: free-tier endpoints reject or stall on large
  // payloads, and 1000px is plenty of resolution for a page of handwriting.
  let image = buffer;
  try {
    image = await sharp(buffer)
      .resize({ width: 1000, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    // keep original
  }

  const base64 = image.toString("base64");
  const mime = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:${mime};base64,${base64}` },
        },
      ],
    },
  ];

  // Attempt 1: the free router. It may pick a stalled model — that is exactly
  // why attempt 2 runs in parallel with it.
  // Attempt 2: a pinned free vision model that has produced real extractions
  // in testing (measured ~37s response). Parallel, first success wins: the
  // slow-but-working model is not sacrificed to the router's fast failures.
  const first = attemptVision(apiKey, messages, VISION_MODEL, VISION_BUDGET_MS, opts?.signal);
  const second = attemptVision(apiKey, messages, VISION_FALLBACK_MODEL, VISION_BUDGET_MS, opts?.signal);
  const attempts = [first, second];

  // Resolve with the first non-null extraction; resolve null only when every
  // attempt has finished without one. The overall deadline below bounds the
  // whole call regardless of what the stalls do.
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    deadlineTimer = setTimeout(
      () => reject(new DOMException("Vision timed out", "AbortError")),
      VISION_BUDGET_MS
    );
  });

  const firstSuccess = new Promise<VisionExtraction | null>((resolve) => {
    let remaining = attempts.length;
    const settle = (extraction: VisionExtraction | null) => {
      if (extraction) resolve(extraction);
      else if (--remaining === 0) resolve(null);
    };
    for (const attempt of attempts) {
      attempt.then((att) => settle(att.extraction)).catch(() => settle(null));
    }
  });

  try {
    return await Promise.race([firstSuccess, deadline]).finally(() =>
      clearTimeout(deadlineTimer)
    );
  } finally {
    for (const attempt of attempts) attempt.catch(() => {});
  }
}

function parseJsonFromContent(content: string): Record<string, unknown> | null {
  const cleaned = content.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toVisionExtraction(
  raw: Record<string, unknown>,
  modelUsed?: string
): VisionExtraction {
  const items = Array.isArray(raw.items) ? raw.items : [];
  const commodities: Commodity[] = items.map((item) => {
    const it = (item || {}) as Record<string, unknown>;
    return {
      id: `v-${Math.random().toString(36).slice(2, 10)}`,
      description: String(it.description ?? ""),
      hs_code: "",
      hs_code_confidence: 0,
      quantity: typeof it.quantity === "number" ? it.quantity : null,
      unit: String(it.unit ?? "UNITS").toUpperCase() || "UNITS",
      declared_value: typeof it.total_value === "number" ? it.total_value : null,
      weight: typeof it.weight === "number" ? it.weight : null,
      country_of_origin: null,
      reviewed: false,
    };
  });

  const total = typeof raw.total === "number" ? raw.total : null;
  const modelConfidence =
    typeof raw.confidence === "number"
      ? Math.min(0.99, Math.max(0, raw.confidence))
      : 0.7;

  return {
    source: "vision",
    model_confidence: modelConfidence,
    model_used: modelUsed,
    commodities,
    labeled_fields: {
      consignor_name: raw.consignor ? String(raw.consignor) : null,
      consignee_name: raw.consignee ? String(raw.consignee) : null,
      invoice_number: raw.invoice_number ? String(raw.invoice_number) : null,
      declaration_date: raw.date ? String(raw.date) : null,
      total_value: total,
      currency: raw.currency ? String(raw.currency) : null,
      container_number: raw.container_number ? String(raw.container_number) : null,
      port_of_loading: raw.port_of_loading ? String(raw.port_of_loading) : null,
      port_of_discharge: raw.port_of_discharge ? String(raw.port_of_discharge) : null,
      incoterms: raw.incoterms ? String(raw.incoterms).toUpperCase() : null,
      gross_weight: typeof raw.gross_weight === "number" ? raw.gross_weight : null,
      net_weight: typeof raw.net_weight === "number" ? raw.net_weight : null,
      number_of_packages:
        typeof raw.number_of_packages === "number" ? raw.number_of_packages : null,
      vision_source: "vision",
    },
    entities: {
      hs_codes: [],
      container_numbers: raw.container_number ? [String(raw.container_number)] : [],
      weights: commodities.map((c) => (c.weight != null ? String(c.weight) : "")).filter(Boolean),
      values: commodities.map((c) => (c.declared_value != null ? String(c.declared_value) : "")).filter(Boolean),
      quantities: commodities.map((c) => (c.quantity != null ? String(c.quantity) : "")).filter(Boolean),
      dates: raw.date ? [String(raw.date)] : [],
      countries: [],
      invoice_numbers: raw.invoice_number ? [String(raw.invoice_number)] : [],
    },
    notes: raw.notes ? String(raw.notes) : "",
  };
}
