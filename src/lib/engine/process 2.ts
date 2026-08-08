import { extractEntities, type StructuredRow } from "./ner";
import { scoreExtractionConfidence, needsHumanReview, scoreHsCodeConfidence } from "./confidence";
import { parseDocument } from "./parser";
import type { ExtractionResult, ParsedDocument } from "./types";

export interface ProcessOutcome {
  extraction: ExtractionResult;
  parsed: ParsedDocument;
}

export async function processBuffer(
  fileBytes: Buffer,
  filename: string,
  contentType?: string | null
): Promise<ProcessOutcome> {
  const parsed = await parseDocument(fileBytes, filename, contentType);
  const structuredRows = (parsed.structured_data?.rows as StructuredRow[] | undefined) || null;
  const entities = extractEntities(parsed.raw_text, structuredRows ? { rows: structuredRows } : null);
  const confidenceScores = scoreExtractionConfidence(entities, parsed.raw_text);
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
    extraction: {
      declaration_id: `decl-${Math.random().toString(36).slice(2, 10)}`,
      status: "extracted",
      confidence_avg: overall,
      entities: { ...entities, commodities },
      confidence_scores: confidenceScores,
      needs_review: needsHumanReview(overall),
      commodities,
      labeled_fields: labeled,
    },
    parsed,
  };
}
