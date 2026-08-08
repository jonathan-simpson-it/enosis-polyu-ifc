import type { ExtractionEntities } from "./types";

export function scoreHsCodeConfidence(
  hsCode: string,
  description: string
): number {
  const factors: number[] = [0.85];
  if (hsCode.length >= 6 && hsCode.includes(".")) factors.push(0.1);
  if (description && description.length > 5) factors.push(0.05);
  return Math.min(Math.round(factors.reduce((a, b) => a + b, 0) * 100) / 100, 0.99);
}

export function scoreExtractionConfidence(
  entities: ExtractionEntities,
  rawText: string
): Record<string, number> {
  const scores: Record<string, number> = {};

  const hsCount = entities.hs_codes.length;
  scores.hs_codes = hsCount ? Math.min(0.95, 0.75 + hsCount * 0.05) : 0.0;
  scores.containers = entities.container_numbers.length ? 0.95 : 0.0;
  scores.weights = entities.weights.length ? 0.9 : 0.0;
  scores.dates = entities.dates.length ? 0.9 : 0.0;

  const commodities = entities.commodities;
  const labeled = entities.labeled_fields;
  const headerFieldsFound = [
    "consignor_name",
    "consignee_name",
    "port_of_loading",
    "port_of_discharge",
    "incoterms",
    "total_value",
  ].filter((k) => labeled[k]).length;

  const commodityCount = commodities.length;
  let overall: number;
  if (commodityCount >= 3 && headerFieldsFound >= 4) overall = 0.88;
  else if (commodityCount >= 2) overall = 0.8;
  else if (commodityCount >= 1) overall = 0.7;
  else if (hsCount) overall = 0.6;
  else if (rawText.length > 100) overall = 0.5;
  else if (rawText.length > 50) overall = 0.4;
  else overall = 0.3;

  if (hsCount && commodityCount) overall = Math.min(0.95, overall + 0.05);
  scores.overall = overall;

  return scores;
}

export function needsHumanReview(confidence: number, threshold = 0.85): boolean {
  return confidence < threshold;
}
