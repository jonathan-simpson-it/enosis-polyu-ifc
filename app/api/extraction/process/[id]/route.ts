import { NextResponse } from "next/server";
import { getDocument, upsertDocument } from "@/lib/engine/store";
import { extractEntities } from "@/lib/engine/ner";
import { scoreExtractionConfidence, needsHumanReview, scoreHsCodeConfidence } from "@/lib/engine/confidence";
import { classifyDeterministic } from "@/lib/engine/classify";
import type { ExtractionResult } from "@/lib/engine/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }

  const rawText = doc.raw_text || "";

  if (!rawText && doc.commodities.length > 0) {
    const stored: ExtractionResult = {
      declaration_id: id,
      status: "extracted",
      confidence_avg: doc.confidence_avg ?? 0.3,
      entities: {
        hs_codes: doc.commodities.map((c) => c.hs_code).filter(Boolean) as string[],
        container_numbers: doc.container_number ? [doc.container_number] : [],
        weights: [],
        values: [],
        quantities: [],
        dates: [],
        countries: doc.country_of_origin ? [doc.country_of_origin] : [],
        commodity_descriptions: doc.commodities.map((c) => c.description).filter(Boolean),
        invoice_numbers: doc.decl_number ? [doc.decl_number] : [],
        labeled_fields: {
          consignor_name: doc.consignor_name || "",
          consignee_name: doc.consignee_name || "",
          port_of_loading: doc.port_of_loading || "",
          port_of_discharge: doc.port_of_discharge || "",
          incoterms: doc.incoterms || "",
          total_value: doc.total_declared_value ?? null,
          gross_weight: doc.gross_weight ?? null,
          net_weight: doc.net_weight ?? null,
        },
        commodities: doc.commodities,
      },
      confidence_scores: { overall: doc.confidence_avg ?? 0.3 },
      needs_review: needsHumanReview(doc.confidence_avg ?? 0.3),
      classification: doc.classification ?? undefined,
      commodities: doc.commodities,
      labeled_fields: {
        consignor_name: doc.consignor_name || "",
        consignee_name: doc.consignee_name || "",
        port_of_loading: doc.port_of_loading || "",
        port_of_discharge: doc.port_of_discharge || "",
        incoterms: doc.incoterms || "",
        total_value: doc.total_declared_value ?? null,
      },
    };
    return NextResponse.json(stored);
  }

  const parsedData = (doc.parsed_data || {}) as Record<string, unknown>;
  const structuredData = (parsedData.structured_data || {}) as {
    rows?: never;
  };

  const entities = extractEntities(rawText, structuredData || null);
  const confidenceScores = scoreExtractionConfidence(entities, rawText);
  const labeled = entities.labeled_fields;

  if (labeled.consignor_name) doc.consignor_name = labeled.consignor_name as string;
  if (labeled.consignee_name) doc.consignee_name = labeled.consignee_name as string;
  if (labeled.port_of_loading) doc.port_of_loading = labeled.port_of_loading as string;
  if (labeled.port_of_discharge) doc.port_of_discharge = labeled.port_of_discharge as string;
  if (labeled.incoterms) doc.incoterms = String(labeled.incoterms).toUpperCase();
  if (labeled.container_number) doc.container_number = labeled.container_number as string;
  if (labeled.total_value) doc.total_declared_value = labeled.total_value as number;
  if (labeled.gross_weight) doc.gross_weight = labeled.gross_weight as number;
  if (labeled.net_weight) doc.net_weight = labeled.net_weight as number;
  if (labeled.number_of_packages) doc.number_of_packages = labeled.number_of_packages as number;

  const commodities = entities.commodities.map((c) => {
    const hsConf = c.hs_code ? scoreHsCodeConfidence(c.hs_code, c.description) : 0;
    const country = c.country_of_origin || entities.countries[0] || null;
    return {
      ...c,
      id: c.id || `c-${Math.random().toString(36).slice(2, 10)}`,
      hs_code_confidence: hsConf,
      country_of_origin: country,
    };
  });

  if (!commodities.length) {
    const seen = new Set<string>();
    for (const hs of entities.hs_codes) {
      if (seen.has(hs)) continue;
      seen.add(hs);
      commodities.push({
        id: `c-${Math.random().toString(36).slice(2, 10)}`,
        description: "",
        hs_code: hs,
        hs_code_confidence: scoreHsCodeConfidence(hs, ""),
        quantity: null,
        unit: "PCS",
        declared_value: null,
        weight: null,
        country_of_origin: entities.countries[0] || null,
        reviewed: false,
      });
    }
  }

  doc.status = "extracted";
  doc.confidence_avg = confidenceScores.overall ?? 0.3;
  doc.commodities = commodities;
  doc.classification = classifyDeterministic(rawText, doc.filename || "");
  doc.doc_type = doc.classification.doc_type;
  upsertDocument(doc);

  const result: ExtractionResult = {
    declaration_id: id,
    status: "extracted",
    confidence_avg: doc.confidence_avg,
    entities: { ...entities, commodities },
    confidence_scores: confidenceScores,
    needs_review: needsHumanReview(doc.confidence_avg),
    classification: doc.classification,
    commodities,
    labeled_fields: labeled,
  };

  return NextResponse.json(result);
}
