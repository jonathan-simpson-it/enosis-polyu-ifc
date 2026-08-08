import { extractEntities, type StructuredRow } from "./ner";
import { scoreExtractionConfidence, needsHumanReview, scoreHsCodeConfidence } from "./confidence";
import { parseDocument } from "./parser";
import { extractWithVision, type VisionExtraction } from "./vision";
import type { ExtractionResult, ParsedDocument } from "./types";

export interface ProcessOutcome {
  extraction: ExtractionResult;
  parsed: ParsedDocument;
}

function buildExtraction(
  entities: ReturnType<typeof extractEntities>,
  rawText: string
): ExtractionResult {
  const confidenceScores = scoreExtractionConfidence(entities, rawText);
  const overall = confidenceScores.overall ?? 0.3;
  const labeled = entities.labeled_fields;

  const commodities = entities.commodities.map((c) => {
    const hsConf = c.hs_code
      ? scoreHsCodeConfidence(c.hs_code, c.description)
      : 0;
    const country = c.country_of_origin || entities.countries[0] || null;
    return {
      ...c,
      id: `c-${Math.random().toString(36).slice(2, 10)}`,
      hs_code_confidence: hsConf,
      country_of_origin: country,
      reviewed: false,
    };
  });

  return {
    declaration_id: `decl-${Math.random().toString(36).slice(2, 10)}`,
    status: "extracted",
    confidence_avg: overall,
    entities: { ...entities, commodities },
    confidence_scores: confidenceScores,
    needs_review: needsHumanReview(overall),
    commodities,
    labeled_fields: labeled,
  };
}

function mergeVision(
  base: ExtractionResult,
  vision: VisionExtraction
): ExtractionResult {
  const entities = {
    ...base.entities,
    commodities: vision.commodities,
    values: vision.entities.values,
    quantities: vision.entities.quantities,
    weights: vision.entities.weights,
    dates: vision.entities.dates,
    invoice_numbers: vision.entities.invoice_numbers,
    labeled_fields: vision.labeled_fields,
  };

  const rawText = [
    vision.labeled_fields.consignor_name || "",
    vision.labeled_fields.consignee_name || "",
    vision.labeled_fields.invoice_number || "",
    vision.labeled_fields.declaration_date || "",
    ...vision.commodities.map((c) =>
      [c.description, c.quantity, c.unit, c.declared_value, c.weight]
        .filter((v) => v != null && v !== "")
        .join(" ")
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const confidenceScores = scoreExtractionConfidence(entities, rawText);
  const overall = confidenceScores.overall ?? 0.3;
  const finalConfidence =
    vision.model_confidence >= 0.8
      ? Math.min(0.95, Math.max(overall, vision.model_confidence))
      : overall;
  const commodities = vision.commodities.map((c) => ({
    ...c,
    hs_code_confidence: c.hs_code ? scoreHsCodeConfidence(c.hs_code, c.description) : 0,
    country_of_origin: c.country_of_origin || null,
  }));

  return {
    ...base,
    confidence_avg: finalConfidence,
    entities: { ...entities, commodities },
    confidence_scores: {
      ...confidenceScores,
      overall: finalConfidence,
    },
    needs_review: needsHumanReview(finalConfidence),
    commodities,
    labeled_fields: {
      ...vision.labeled_fields,
      vision_confidence: vision.model_confidence,
    },
  };
}

export async function processBuffer(
  fileBytes: Buffer,
  filename: string,
  contentType?: string | null
): Promise<ProcessOutcome> {
  const parsed = await parseDocument(fileBytes, filename, contentType);
  const structuredRows = (parsed.structured_data?.rows as StructuredRow[] | undefined) || null;
  let entities = extractEntities(parsed.raw_text, structuredRows ? { rows: structuredRows } : null);
  let extraction = buildExtraction(entities, parsed.raw_text);

  // Vision fallback: when OCR produced little usable data, route the image to
  // the vision model. Only for image uploads, and only when confidence is low.
  const isImage = parsed.file_type === "image";
  const textTooThin = parsed.raw_text.trim().length < 200;
  const nothingExtracted =
    extraction.commodities.length === 0 &&
    extraction.entities.values.length === 0 &&
    extraction.entities.dates.length === 0 &&
    extraction.entities.invoice_numbers.length === 0;
  if (isImage && (extraction.confidence_avg < 0.65 || textTooThin || nothingExtracted)) {
    const vision = await extractWithVision(fileBytes, filename);
    if (vision && vision.commodities.length > 0) {
      extraction = mergeVision(extraction, vision);
      entities = extraction.entities;
    }
  }

  return { extraction, parsed };
}
