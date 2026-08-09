import type { DocType, DocumentClassification, ParsedDocument } from "./types";

interface TypeSignals {
  doc_type: DocType;
  patterns: RegExp[];
  weight: number;
}

// Deterministic signal table. Each pattern is matched case-insensitively
// against the extracted raw text; scores are summed per type and normalized.
const TYPE_SIGNALS: TypeSignals[] = [
  {
    doc_type: "commercial_invoice",
    patterns: [
      /\binvoice\b/i,
      /\binv\.?\s*#/i,
      /invoice\s*(?:number|no\.?|#)/i,
      /发\s*票|發\s*票|发票/,
      /發票|发票號/i,
      /commercial\s+invoice/i,
      /bill\s+to/i,
      /tax\s+invoice/i,
      /incoterms/i,
      /\btotal\s+(?:declared\s+)?value/i,
    ],
    weight: 1,
  },
  {
    doc_type: "packing_list",
    patterns: [
      /packing\s+list/i,
      /pack(?:ing)?\s+list/i,
      /裝箱單|装箱单/i,
      /packed\s+goods/i,
      /\bnet\s+weight\b/i,
      /\bgross\s+weight\b/i,
      /number\s+of\s+packages/i,
      /cartons?/i,
      /\bpcs\b|\bctn\b|\bunits\b/i,
    ],
    weight: 1,
  },
  {
    doc_type: "bill_of_lading",
    patterns: [
      /bill\s+of\s+lading/i,
      /\bB\/?L\b/i,
      /提單|提单/i,
      /\bvessel\s*[:\s]/i,
      /\bvoyage\b/i,
      /port\s+of\s+loading/i,
      /port\s+of\s+discharge/i,
      /carrier\s*[:\s]/i,
      /\bmaster\s+bill/i,
      /shipped\s+on\s+board/i,
      /air\s+waybill/i,
      /\b(?:HAWB|MAWB|AWB)\b/i,
      /waybill/i,
      /\bmanifest\b/i,
      /舱单|艙單|装货清单|裝貨清單/i,
    ],
    weight: 1.15,
  },
  {
    doc_type: "certificate_of_origin",
    patterns: [
      /certificate\s+of\s+origin/i,
      /cert\.?\s+of\s+origin/i,
      /\bCoO\b/i,
      /原產地證書|原产地证书|產地來源證/i,
      /origin\s+certificate/i,
      /preferential\s+tariff/i,
      /exporter\s+certificate/i,
      /origin\s*[:\s]+[A-Za-z]/i,
    ],
    weight: 1.3,
  },
  {
    doc_type: "purchase_order",
    patterns: [
      /purchase\s+order/i,
      /\bPO\s*#?[:#\s]/i,
      /order\s+number/i,
      /採購訂單|采购订单|訂單號/i,
      /\bquotation\b/i,
      /\bbuyer\s*[:\s]/i,
      /delivery\s+date/i,
      /terms?\s+of\s+payment/i,
    ],
    weight: 1,
  },
  {
    doc_type: "customs_declaration",
    patterns: [
      /customs\s+declaration/i,
      /\bTSW\b/i,
      /trade\s+(?:single\s+)?window/i,
      /報關單|报关单|海关申报/i,
      /declaration\s+form/i,
      /customs\s+(?:code|house)/i,
      /entry\s+summary/i,
      /\bDGD\b/i,
      /freight\s+forwarder\s+declaration/i,
    ],
    weight: 1.25,
  },
  {
    doc_type: "bank_statement",
    patterns: [
      /bank\s+statement/i,
      /account\s+statement/i,
      /銀行對帳單|银行对账单|銀行月結單/i,
      /\btransactions?\b/i,
      /opening\s+balance/i,
      /closing\s+balance/i,
      /\bSWIFT\b/i,
      /account\s+number/i,
      /\bIBAN\b/i,
      /statement\s+period/i,
    ],
    weight: 1.3,
  },
  {
    doc_type: "receipt",
    patterns: [
      /\breceipt\b/i,
      /收據|收据|收条/i,
      /\bnota\b/i,
      /\bstruk\b/i,
      /received\s+from/i,
      /paid\s+by\s+wechat|wechat\s+(?:pay|transfer)/i,
      /微信支付|微信轉帳|转账/i,
      /payment\s+received/i,
      /\bRct\b/i,
      /transfer\s+receipt/i,
    ],
    weight: 1,
  },
];

const TITLE_SIGNALS: Partial<Record<DocType, RegExp[]>> = {
  commercial_invoice: [/^\s*(?:commercial\s+)?invoice/i, /^發票|^发票/i],
  packing_list: [/^\s*packing\s+list/i, /^裝箱單|^装箱单/i],
  bill_of_lading: [
    /^\s*bill\s+of\s+lading/i,
    /^\s*air\s+waybill/i,
    /^提單|^提单/i,
  ],
  certificate_of_origin: [/^\s*(?:certificate\s+of\s+)?origin/i, /^原產地證書|^原产地证书/i],
  purchase_order: [/^\s*purchase\s+order/i, /^採購訂單|^采购订单/i],
  customs_declaration: [
    /^\s*customs\s+declaration/i,
    /^報關單|^报关单|报关清单/i,
  ],
  bank_statement: [/^\s*bank\s+statement/i, /^銀行對帳單|^银行对账单/i],
  receipt: [/^\s*receipt\b/i, /^收據|^收据|^nota/i],
};

// A document that declares its type in its title is decisive unless the
// body evidence for another type is dominant.
const TITLE_PRIORITY_RATIO = 0.5;

function scoreSignals(text: string, filename = ""): Record<DocType, number> {
  const scores: Record<DocType, number> = {
    commercial_invoice: 0,
    packing_list: 0,
    bill_of_lading: 0,
    certificate_of_origin: 0,
    purchase_order: 0,
    customs_declaration: 0,
    bank_statement: 0,
    receipt: 0,
    other: 0,
  };
  const titleScores: Partial<Record<DocType, number>> = {};

  if (!text || text.trim().length === 0) {
    scores.other = 1;
    return scores;
  }

  const head = text.slice(0, 400);
  for (const t of TYPE_SIGNALS) {
    for (const pattern of t.patterns) {
      if (pattern.test(text)) scores[t.doc_type] += t.weight;
    }
  }

  for (const [docType, patterns] of Object.entries(TITLE_SIGNALS) as [
    DocType,
    RegExp[],
  ][]) {
    for (const pattern of patterns) {
      if (pattern.test(head)) {
        scores[docType] += 2;
        titleScores[docType] = (titleScores[docType] || 0) + 1;
      }
    }
  }

  if (filename) {
    for (const [docType, patterns] of Object.entries(FILENAME_HINTS) as [
      DocType,
      RegExp[],
    ][]) {
      for (const pattern of patterns) {
        if (pattern.test(filename)) scores[docType] += 1.5;
      }
    }
  }

  // Title priority: a title that names the document type wins unless the
  // leading type has more than double its score from body evidence.
  const titleEntries = Object.entries(titleScores).filter(
    ([, v]) => v > 0,
  ) as [DocType, number][];
  if (titleEntries.length === 1) {
    const [titleType, titleHits] = titleEntries[0];
    const leader = Math.max(...Object.values(scores));
    if (leader <= 0 || scores[titleType] >= leader * TITLE_PRIORITY_RATIO) {
      scores[titleType] = leader + titleHits * 0.5;
    }
  }

  return scores;
}

const FALLBACK_CONFIDENCE = 0.32;
const LLM_TRIGGER_THRESHOLD = 0.6;

const FILENAME_HINTS: Partial<Record<DocType, RegExp[]>> = {
  commercial_invoice: [/(invoice|inv_?|发票|發票)/i],
  packing_list: [/(pack(?:ing)?[_-\s]?list|装箱单|裝箱單)/i],
  bill_of_lading: [/(bill[_-\s]?of[_-\s]?lading|bl_?|提单|提單)/i],
  certificate_of_origin: [/(cert[_-\s]?of[_-\s]?origin|coo_?|原产地证|原產地證)/i],
  purchase_order: [/(purchase[_-\s]?order|po[_-\s]?\d|採購訂單|采购订单)/i],
  customs_declaration: [/(customs[_-\s]?declaration|报关单|報關單)/i],
  bank_statement: [/(bank[_-\s]?statement|银行对账|銀行對帳)/i],
  receipt: [/(receipt|nota|收据|收據)/i],
};

export function classifyDeterministic(
  text: string,
  filename = "",
): DocumentClassification {
  const scores = scoreSignals(text, filename);
  const entries = Object.entries(scores) as [DocType, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const [topType, topScore] = entries[0];
  const secondScore = entries[1]?.[1] ?? 0;

  if (topScore <= 0 || (topType === "other" && !text.trim())) {
    return {
      doc_type: "other",
      confidence: FALLBACK_CONFIDENCE,
      method: "fallback",
      signals: [],
    };
  }

  const confidence = Math.min(
    0.97,
    Math.max(FALLBACK_CONFIDENCE, 0.42 + topScore * 0.08 - secondScore * 0.03),
  );

  return {
    doc_type: topType,
    confidence,
    method: "deterministic",
    signals: Object.entries(scores)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t),
  };
}

const CLASSIFY_MODEL =
  process.env.ENOSIS_CLASSIFY_MODEL || "openai/gpt-4o-mini";

const CLASSIFY_SYSTEM_PROMPT = `You classify trade documents. Read the text and return ONLY valid JSON, no markdown, no commentary:
{
  "doc_type": "commercial_invoice|packing_list|bill_of_lading|certificate_of_origin|purchase_order|customs_declaration|bank_statement|receipt|other",
  "confidence": 0.0-1.0,
  "reason": "one short sentence"
}

Pick the single best category. If the document does not match any category, return "other" with low confidence. "other" means the category is genuinely unclear — do not use it as a lazy default.`;

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

function isDocType(value: unknown): value is DocType {
  return (
    typeof value === "string" &&
    [
      "commercial_invoice",
      "packing_list",
      "bill_of_lading",
      "certificate_of_origin",
      "purchase_order",
      "customs_declaration",
      "bank_statement",
      "receipt",
      "other",
    ].includes(value)
  );
}

export async function classifyWithLlm(
  text: string,
  opts?: { signal?: AbortSignal }
): Promise<DocumentClassification | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const excerpt = text.slice(0, 6000);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const onOuterAbort = () => controller.abort();
    opts?.signal?.addEventListener("abort", onOuterAbort, { once: true });
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://enosis.jonathansimpson.co",
        "X-Title": "Enosis Demo",
      },
      body: JSON.stringify({
        model: CLASSIFY_MODEL,
        messages: [
          { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
          { role: "user", content: excerpt },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timer);
      opts?.signal?.removeEventListener("abort", onOuterAbort);
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[enosis-classify] API error:", res.status, body.slice(0, 300));
      return null;
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content || "";
    const parsed = parseJsonFromContent(content);
    if (!parsed || !isDocType(parsed.doc_type)) return null;

    const confidence =
      typeof parsed.confidence === "number"
        ? Math.min(0.97, Math.max(0.3, parsed.confidence))
        : 0.7;

    return {
      doc_type: parsed.doc_type,
      confidence,
      method: "llm",
      signals: [typeof parsed.reason === "string" ? parsed.reason : "llm"],
    };
  } catch (err) {
    console.error("[enosis-classify] failed:", err);
    return null;
  }
}

export async function classifyDocument(
  parsed: ParsedDocument,
  opts?: { signal?: AbortSignal },
): Promise<DocumentClassification> {
  const rawText = parsed.raw_text || "";
  const deterministic = classifyDeterministic(rawText, parsed.filename);

  // Images carry no extractable text (OCR is removed), so an LLM call on an
  // empty excerpt can only stall on a classification that can never be made.
  if (!rawText.trim()) return deterministic;

  if (
    deterministic.method === "fallback" ||
    (deterministic.doc_type === "other" && deterministic.confidence < LLM_TRIGGER_THRESHOLD)
  ) {
    const llm = await classifyWithLlm(rawText, { signal: opts?.signal });
    if (llm) return llm;
  }

  return deterministic;
}
