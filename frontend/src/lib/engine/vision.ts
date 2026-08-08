import type { Commodity } from "./types";
import sharp from "sharp";

const VISION_MODEL =
  process.env.ENOSIS_VISION_MODEL ||
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

export interface VisionExtraction {
  source: "vision";
  model_confidence: number;
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
  "confidence": number,
  "items": [
    { "description": string, "quantity": number|null, "unit": string|null, "unit_price": number|null, "total_value": number|null, "weight": number|null }
  ],
  "notes": string
}

Rules:
- Prices and totals are numbers without currency symbols or commas.
- Dates written as dd.mm.yy, dd/mm/yy, or dd-mm-yy are DAY.MONTH.YEAR in Indonesian documents. Convert to YYYY-MM-DD. Example: 06.08.26 becomes 2026-08-06.
- "confidence" is your estimate (0 to 1) of how legible and accurately you read this document.
- If the document is a shop nota, treat the nota number as invoice_number.
- If text is illegible, still include the item with null values rather than dropping it.`;

interface ChatMessage {
  role: "system" | "user";
  content:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

export async function extractWithVision(
  buffer: Buffer,
  filename: string
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

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://enosis.jonathansimpson.co",
        "X-Title": "Enosis Demo",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages,
        temperature: 0,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[enosis-vision] API error:", res.status, body.slice(0, 300));
      return null;
    }

    const data = await res.json();
    const content: string =
      data?.choices?.[0]?.message?.content || "";
    const parsed = parseJsonFromContent(content);
    if (!parsed) return null;

    return toVisionExtraction(parsed);
  } catch (err) {
    console.error("[enosis-vision] failed:", err);
    return null;
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

function toVisionExtraction(raw: Record<string, unknown>): VisionExtraction {
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
    commodities,
    labeled_fields: {
      consignor_name: raw.consignor ? String(raw.consignor) : null,
      consignee_name: raw.consignee ? String(raw.consignee) : null,
      invoice_number: raw.invoice_number ? String(raw.invoice_number) : null,
      declaration_date: raw.date ? String(raw.date) : null,
      total_value: total,
      currency: raw.currency ? String(raw.currency) : null,
      vision_source: "vision",
    },
    entities: {
      hs_codes: [],
      container_numbers: [],
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
