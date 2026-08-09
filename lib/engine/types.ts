export type DocType =
  | "commercial_invoice"
  | "packing_list"
  | "bill_of_lading"
  | "certificate_of_origin"
  | "purchase_order"
  | "customs_declaration"
  | "bank_statement"
  | "receipt"
  | "other";

export interface DocumentClassification {
  doc_type: DocType;
  confidence: number;
  method: "deterministic" | "llm" | "fallback";
  signals: string[];
  overridden?: boolean;
}

export interface Commodity {
  id: string;
  description: string;
  hs_code: string;
  hs_code_confidence: number;
  quantity: number | null;
  unit: string;
  declared_value: number | null;
  weight: number | null;
  country_of_origin: string | null;
  reviewed: boolean;
}

export interface ExtractionEntities {
  hs_codes: string[];
  container_numbers: string[];
  weights: string[];
  values: string[];
  quantities: string[];
  dates: string[];
  countries: string[];
  commodity_descriptions: string[];
  invoice_numbers: string[];
  labeled_fields: Record<string, string | number | null>;
  commodities: Commodity[];
}

export interface ExtractionResult {
  declaration_id: string;
  status: string;
  confidence_avg: number;
  entities: ExtractionEntities;
  confidence_scores: Record<string, number>;
  needs_review: boolean;
  commodities: Commodity[];
  labeled_fields: Record<string, string | number | null>;
  classification?: DocumentClassification;
}

export interface ParsedDocument {
  filename: string;
  file_type: string;
  raw_text: string;
  structured_data: Record<string, unknown>;
  tables: unknown[];
}

export interface Declaration {
  id: string;
  filename: string | null;
  file_type: string | null;
  status: string;
  confidence_avg: number | null;
  decl_number: string | null;
  consignor_name: string | null;
  consignee_name: string | null;
  port_of_loading: string | null;
  port_of_discharge: string | null;
  incoterms: string | null;
  total_declared_value: number | null;
  gross_weight: number | null;
  net_weight: number | null;
  number_of_packages: number | null;
  country_of_origin: string | null;
  container_number: string | null;
  declared_currency: string | null;
  transport_mode: string | null;
  commercial_notes: string | null;
  raw_text?: string;
  parsed_data?: Record<string, unknown>;
  created_at: string;
  commodities: Commodity[];
  doc_type?: DocType | null;
  classification?: DocumentClassification | null;
}
