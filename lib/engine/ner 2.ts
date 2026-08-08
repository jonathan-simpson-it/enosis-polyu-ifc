import type { Commodity, ExtractionEntities } from "./types";

const COUNTRY_MAP: Record<string, string> = {
  CHINA: "CN",
  "HONG KONG": "HK",
  MACAU: "MO",
  TAIWAN: "TW",
  JAPAN: "JP",
  KOREA: "KR",
  "SOUTH KOREA": "KR",
  "UNITED STATES": "US",
  USA: "US",
  GERMANY: "DE",
  SINGAPORE: "SG",
  VIETNAM: "VN",
  THAILAND: "TH",
  INDIA: "IN",
  "UNITED KINGDOM": "UK",
  FRANCE: "FR",
};

const COUNTRY_NAMES = Object.keys(COUNTRY_MAP);
const COUNTRY_REVERSE = new RegExp(
  `\\b(${COUNTRY_NAMES.map(escapeRegex).join("|")})\\b`,
  "gi"
);

const HS_CODE_PATTERN = /\b(\d{4}\.\d{2}(?:\.\d{2,4})?)\b/g;
const CONTAINER_PATTERN = /\b([A-Z]{4}\d{7})\b/g;
const WEIGHT_PATTERN = /(\d+[\d,.]*(?:\.\d+)?)\s*(?:KG|KGS|KILO|TON|TONNE|LB|LBS)/gi;
const VALUE_PATTERN = /(?:HKD|USD|CNY|EUR)\s*([\d,]+(?:\.\d{2})?)/g;
const QUANTITY_PATTERN = /(\d+[\d,]*)\s*(?:PCS|PCE|CTN|BOX|SET|PRS|UNITS?|KGS|KGM)/gi;
const DATE_PATTERN = /\b(\d{4}[-/]\d{2}[-/]\d{2})\b/g;
const DATE_ALT_PATTERN = /\b(\d{2}-[A-Z]{3}-\d{4})\b/gi;
const COUNTRY_CODE_PATTERN = /\b(CN|HK|MO|TW|JP|KR|US|DE|SG|VN|TH|IN|GB|FR)\b/g;

const LABEL_PATTERNS: Record<string, RegExp> = {
  consignor_name: /CONSIGNOR:\s*(.+)$/im,
  consignee_name: /CONSIGNEE:\s*(.+)$/im,
  port_of_loading: /Port of Loading:\s*(.+)$/im,
  port_of_discharge: /Port of Discharge:\s*(.+)$/im,
  incoterms: /Incoterms:\s*(\S+)/i,
  vessel: /Vessel:\s*(.+)$/im,
  container_number: /(?:Container|CTNR?):\s*(\S+)/i,
  invoice_number: /INVOICE\s*#:\s*(\S+)/i,
  declaration_date: /DATE:\s*(.+)$/im,
  total_value:
    /TOTAL\s+(?:DECLARED\s+)?VALUE:\s*(?:USD|HKD|CNY|EUR)\s*([\d,]+(?:\.\d{2})?)/im,
  gross_weight:
    /TOTAL\s+(?:GROSS\s+)?WEIGHT:\s*(\d+[\d,.]*(?:\.\d+)?)\s*(?:KG|KGS)/im,
  net_weight: /TOTAL\s+NET\s+WEIGHT:\s*(\d+[\d,.]*(?:\.\d+)?)\s*(?:KG|KGS)/im,
  number_of_packages: /NUMBER\s+OF\s+PACKAGES?:\s*(\d+)/i,
};

const COMMODITY_LINE_ITEM = new RegExp(
  [
    "(\\d+)\\.\\s*\"?([^\"]+)\"?\\s*\\n",
    ".*?HS\\s*Code:\\s*(\\d{4}\\.\\d{2}(?:\\.\\d{2,4})?)\\s*\\n",
    ".*?Quantity:\\s*(\\d+[\\d,]*)\\s*(UNITS?|PCS|PCE|BOX|SET|KG|KGS)?\\s*\\n",
    ".*?Unit\\s+Price:\\s*(?:USD|HKD|CNY|EUR)\\s*([\\d,]+(?:\\.\\d{2})?)\\s*\\n",
    ".*?Total\\s+Value:\\s*(?:USD|HKD|CNY|EUR)\\s*([\\d,]+(?:\\.\\d{2})?)\\s*\\n",
    ".*?Gross\\s+Weight:\\s*(\\d+[\\d,.]*(?:\\.\\d+)?)\\s*(?:KG|KGS)?\\s*\\n",
    ".*?Net\\s+Weight:\\s*(\\d+[\\d,.]*(?:\\.\\d+)?)\\s*(?:KG|KGS)?\\s*\\n",
    ".*?Country\\s+of\\s+Origin:\\s*(.+?)$",
  ].join(""),
  "im"
);

const COMMODITY_SIMPLE = new RegExp(
  [
    "(\\d+)\\.\\s*\"?([^\"]+)\"?\\s*\\n",
    ".*?HS\\s*Code:\\s*(\\d{4}\\.\\d{2}(?:\\.\\d{2,4})?)\\s*\\n",
    ".*?Quantity:\\s*(\\d+[\\d,]*)\\s*(UNITS?|PCS|PCE|BOX|SET|KG|KGS)?\\s*\\n",
    ".*?Total\\s+Value:\\s*(?:USD|HKD|CNY|EUR)\\s*([\\d,]+(?:\\.\\d{2})?)",
  ].join(""),
  "i"
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// PDF text extraction flattens documents into long single lines. Split on
// double spaces and before known field labels so line-anchored label regexes
// behave the same as on newline-delimited text.
function normalizeForLabels(text: string): string {
  return text
    .replace(/\s{2,}/g, "\n")
    .replace(
      /\s+(?=(?:CONSIGNEE|CONSIGNOR|INVOICE\s*#|DATE|Container|Port of Loading|Port of Discharge|Vessel|Incoterms|TOTAL|NUMBER OF PACKAGES)\b)/g,
      "\n"
    );
}

function parseNumber(s: string | undefined | null): number | null {
  if (!s) return null;
  const cleaned = s.trim().replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function resolveCountry(name: string): string | null {
  const upper = name.trim().toUpperCase();
  if (COUNTRY_MAP[upper]) return COUNTRY_MAP[upper];
  if (/^(CN|HK|MO|TW|JP|KR|US|DE|SG|VN|TH|IN|GB|FR)$/.test(name.trim())) {
    return name.trim().toUpperCase();
  }
  return null;
}

export function extractLabeledFields(
  rawText: string
): Record<string, string | number | null> {
  const text = normalizeForLabels(rawText);
  const fields: Record<string, string | number | null> = {};
  for (const [key, pattern] of Object.entries(LABEL_PATTERNS)) {
    const m = pattern.exec(text);
    if (!m || !m[1]) continue;
    const val = m[1].trim();
    if (!val) continue;
    if (key === "total_value" || key === "gross_weight" || key === "net_weight") {
      fields[key] = parseNumber(val);
    } else if (key === "number_of_packages") {
      const n = parseInt(val.replace(/,/g, ""), 10);
      fields[key] = Number.isFinite(n) ? n : 1;
    } else {
      fields[key] = val;
    }
  }
  return fields;
}

function parseCommodityBlocks(text: string): Commodity[] {
  const commodities: Commodity[] = [];
  const full = new RegExp(COMMODITY_LINE_ITEM.source, "img");
  let m: RegExpExecArray | null;
  while ((m = full.exec(text))) {
    commodities.push({
      id: "",
      description: m[2].trim(),
      hs_code: m[3],
      quantity: parseNumber(m[4]),
      unit: (m[5] || "units").replace(/s$/i, "").toUpperCase() || "UNITS",
      declared_value: parseNumber(m[7]),
      weight: parseNumber(m[8]),
      country_of_origin: resolveCountry(m[10].trim()),
      hs_code_confidence: 0,
      reviewed: false,
    });
  }
  if (commodities.length) return commodities;

  const simple = new RegExp(COMMODITY_SIMPLE.source, "ig");
  while ((m = simple.exec(text))) {
    commodities.push({
      id: "",
      description: m[2].trim(),
      hs_code: m[3],
      quantity: parseNumber(m[4]),
      unit: (m[5] || "units").replace(/s$/i, "").toUpperCase() || "UNITS",
      declared_value: parseNumber(m[6]),
      weight: null,
      country_of_origin: null,
      hs_code_confidence: 0,
      reviewed: false,
    });
  }
  if (commodities.length) return commodities;

  // Fallback: flattened table rows from PDF text extraction, e.g.
  // "1   Portable laptop computers, Lenovo ThinkPad X1   8471.30.00   500   USD 850.00   USD 425,000.00   750.0"
  const row = new RegExp(
    [
      "(?:^|\\s)(\\d{1,3})\\s{2,}",
      "(.+?)\\s+",
      "(\\d{4}\\.\\d{2}(?:\\.\\d{2,4})?)\\s{2,}",
      "(\\d+[\\d,]*)\\s{2,}",
      "(?:USD|HKD|CNY|EUR)\\s*([\\d,]+(?:\\.\\d{2})?)\\s{2,}",
      "(?:USD|HKD|CNY|EUR)\\s*([\\d,]+(?:\\.\\d{2})?)\\s{2,}",
      "([\\d.,]+)",
    ].join(""),
    "g"
  );
  while ((m = row.exec(text))) {
    const desc = m[2].trim();
    if (!/^[A-Za-z]/.test(desc) || /(USD|HKD|CNY|EUR)\s/.test(desc)) {
      continue;
    }
    commodities.push({
      id: "",
      description: desc,
      hs_code: m[3],
      quantity: parseNumber(m[4]),
      unit: "UNITS",
      declared_value: parseNumber(m[6]),
      weight: parseNumber(m[7]),
      country_of_origin: null,
      hs_code_confidence: 0,
      reviewed: false,
    });
  }
  return commodities;
}

export interface StructuredRow {
  hs_code?: string;
  description?: string;
  quantity?: string | number;
  unit?: string;
  total_value_usd?: string | number;
  declared_value?: string | number;
  gross_weight_kg?: string | number;
  weight?: string | number;
  country_of_origin?: string;
}

export function extractEntities(
  text: string,
  structuredData?: { rows?: StructuredRow[] } | null
): ExtractionEntities {
  const entities: ExtractionEntities = {
    hs_codes: [],
    container_numbers: [],
    weights: [],
    values: [],
    quantities: [],
    dates: [],
    countries: [],
    commodity_descriptions: [],
    invoice_numbers: [],
    labeled_fields: extractLabeledFields(text),
    commodities: [],
  };

  for (const match of text.matchAll(HS_CODE_PATTERN)) {
    if (!entities.hs_codes.includes(match[1])) entities.hs_codes.push(match[1]);
  }
  for (const match of text.matchAll(CONTAINER_PATTERN)) {
    if (!entities.container_numbers.includes(match[1])) entities.container_numbers.push(match[1]);
  }
  for (const match of text.matchAll(WEIGHT_PATTERN)) {
    entities.weights.push(match[1]);
  }
  for (const match of text.matchAll(VALUE_PATTERN)) {
    entities.values.push(match[1]);
  }
  for (const match of text.matchAll(QUANTITY_PATTERN)) {
    entities.quantities.push(match[1]);
  }
  for (const match of text.matchAll(DATE_PATTERN)) {
    entities.dates.push(match[1]);
  }
  for (const match of text.matchAll(DATE_ALT_PATTERN)) {
    entities.dates.push(match[1]);
  }
  if (entities.labeled_fields.invoice_number) {
    entities.invoice_numbers.push(String(entities.labeled_fields.invoice_number));
  }
  for (const match of text.matchAll(COUNTRY_REVERSE)) {
    const code = COUNTRY_MAP[match[1].toUpperCase()];
    if (!entities.countries.includes(code)) entities.countries.push(code);
  }
  for (const match of text.matchAll(COUNTRY_CODE_PATTERN)) {
    if (!entities.countries.includes(match[1])) entities.countries.push(match[1]);
  }

  entities.commodities = parseCommodityBlocks(text);

  if (structuredData?.rows) {
    const seenHs = entities.commodities.map((c) => c.hs_code);
    for (const row of structuredData.rows) {
      const hs = (row.hs_code || "").trim();
      if (!hs || seenHs.includes(hs)) continue;
      seenHs.push(hs);
      const unitRaw = row.unit || "PCS";
      entities.commodities.push({
        id: "",
        description: row.description || "",
        hs_code: hs,
        quantity: parseNumber(String(row.quantity ?? "")),
        unit: unitRaw.toUpperCase().replace(/s$/i, "") || "PCS",
        declared_value: parseNumber(String(row.total_value_usd ?? row.declared_value ?? "")),
        weight: parseNumber(String(row.gross_weight_kg ?? row.weight ?? "")),
        country_of_origin: resolveCountry(row.country_of_origin || ""),
        hs_code_confidence: 0,
        reviewed: false,
      });
    }
  }

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/(item|commodity|product|goods|desc)/i.test(line)) {
      const next = lines[i + 1]?.trim();
      if (next && !entities.commodity_descriptions.includes(next)) {
        entities.commodity_descriptions.push(next);
      }
    }
  }

  return entities;
}
