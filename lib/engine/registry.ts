import type { DocType } from "./types";

export interface DocTypeDefinition {
  doc_type: DocType;
  label: string;
  short_label: string;
  description: string;
  target_standards: string[];
  purpose: string;
  expected_header_fields: string[];
  export_notes: string;
}

const DOC_TYPE_ORDER: DocType[] = [
  "commercial_invoice",
  "packing_list",
  "bill_of_lading",
  "certificate_of_origin",
  "purchase_order",
  "customs_declaration",
  "bank_statement",
  "receipt",
];

const DOC_TYPE_DEFS: Record<DocType, DocTypeDefinition> = {
  commercial_invoice: {
    doc_type: "commercial_invoice",
    label: "Commercial Invoice",
    short_label: "Invoice",
    description:
      "Seller-to-buyer sale record: commodity lines, values, HS codes, consignor/consignee, incoterms.",
    target_standards: ["WCO Data Model v3.11", "HK TSW Phase 3 JSON"],
    purpose:
      "Customs declaration value basis; bank credit underwriting proof of trade.",
    expected_header_fields: [
      "invoice_number",
      "consignor_name",
      "consignee_name",
      "declaration_date",
      "total_value",
      "currency",
    ],
    export_notes: "Commodity lines map to GovernmentAgencyGoodsItem; values to CustomsValueAmount.",
  },
  packing_list: {
    doc_type: "packing_list",
    label: "Packing List",
    short_label: "Packing List",
    description:
      "Shipment contents breakdown: quantity, unit, weight, package count, marks.",
    target_standards: ["WCO Data Model v3.11", "HK TSW Phase 3 JSON"],
    purpose:
      "Verifies weight and package declarations; reconciles against invoice quantities.",
    expected_header_fields: [
      "port_of_loading",
      "port_of_discharge",
      "gross_weight",
      "net_weight",
      "number_of_packages",
    ],
    export_notes: "Quantities map to QuantityQuantity; weights to NetNetWeightMeasure.",
  },
  bill_of_lading: {
    doc_type: "bill_of_lading",
    label: "Bill of Lading",
    short_label: "B/L",
    description:
      "Carrier-issued transport document: vessel, ports, container, consignee.",
    target_standards: ["WCO Data Model v3.11"],
    purpose:
      "Transport leg evidence; container and routing data for customs risk assessment.",
    expected_header_fields: [
      "vessel",
      "port_of_loading",
      "port_of_discharge",
      "container_number",
      "consignee_name",
    ],
    export_notes: "Vessel/ports map to TransportModeCode and Loading/DischargeLocation.",
  },
  certificate_of_origin: {
    doc_type: "certificate_of_origin",
    label: "Certificate of Origin",
    short_label: "CoO",
    description:
      "Origin certification for preferential duty: country of origin, exporter, HS codes.",
    target_standards: ["WCO Data Model v3.11", "HK TSW Phase 3 JSON"],
    purpose:
      "Proves country of origin; required for preferential tariff claims.",
    expected_header_fields: ["country_of_origin", "consignor_name", "consignee_name"],
    export_notes: "Country maps to TradeCountry with TypeCode Origin.",
  },
  purchase_order: {
    doc_type: "purchase_order",
    label: "Purchase Order",
    short_label: "PO",
    description:
      "Buyer order committing to purchase: line items, quantities, unit prices.",
    target_standards: ["WCO Data Model v3.11"],
    purpose:
      "Pre-shipment demand signal; reconciles against the invoice at filing.",
    expected_header_fields: [
      "invoice_number",
      "consignee_name",
      "declaration_date",
      "total_value",
    ],
    export_notes: "Treated as invoice-adjacent; line items map to goods items.",
  },
  customs_declaration: {
    doc_type: "customs_declaration",
    label: "Customs Declaration",
    short_label: "Declaration",
    description:
      "Filing form (e.g. HK TSW): declared value, HS codes, origin, transport.",
    target_standards: ["WCO Data Model v3.11", "HK TSW Phase 3 JSON"],
    purpose:
      "The filing itself; highest-fidelity mapping to WCO/TSW schemas.",
    expected_header_fields: [
      "declaration_date",
      "total_value",
      "port_of_loading",
      "port_of_discharge",
    ],
    export_notes: "Direct mapping to WCODeclaration; TypeCode from form.",
  },
  bank_statement: {
    doc_type: "bank_statement",
    label: "Bank Statement",
    short_label: "Bank",
    description:
      "Account statement: transactions, dates, amounts, counterparties.",
    target_standards: ["HK TSW Phase 3 JSON"],
    purpose:
      "Payment evidence for credit underwriting; verifies invoice settlement.",
    expected_header_fields: ["declaration_date", "total_value", "currency"],
    export_notes: "Transactions surface as payment evidence, not goods items.",
  },
  receipt: {
    doc_type: "receipt",
    label: "Receipt / Transfer Note",
    short_label: "Receipt",
    description:
      "Proof of payment or shop nota (incl. WeChat transfer screenshots).",
    target_standards: ["HK TSW Phase 3 JSON"],
    purpose:
      "Settlement proof; supports declared values with low data density.",
    expected_header_fields: ["invoice_number", "declaration_date", "total_value"],
    export_notes: "Total maps to payment amount; items may be absent.",
  },
  other: {
    doc_type: "other",
    label: "Unrecognized Document",
    short_label: "Other",
    description:
      "Document type could not be determined confidently. Review before export.",
    target_standards: [],
    purpose: "Human review required to pick the correct category.",
    expected_header_fields: [],
    export_notes: "Export still allowed after manual category selection.",
  },
};

export const DOC_TYPE_DEFINITIONS: DocTypeDefinition[] = [
  ...DOC_TYPE_ORDER.map((t) => DOC_TYPE_DEFS[t]),
  DOC_TYPE_DEFS.other,
];

export function getDocTypeDefinition(docType: DocType): DocTypeDefinition {
  return DOC_TYPE_DEFS[docType] || DOC_TYPE_DEFS.other;
}

export function isKnownDocType(value: string): value is DocType {
  return value in DOC_TYPE_DEFS;
}

export function targetStandardsFor(docType: DocType): string[] {
  return getDocTypeDefinition(docType).target_standards;
}

export function defaultExportFormatFor(docType: DocType): string {
  const def = getDocTypeDefinition(docType);
  if (def.target_standards.includes("HK TSW Phase 3 JSON")) return "tsw_json";
  if (def.target_standards.includes("WCO Data Model v3.11")) return "wco_json";
  return "wco_json";
}
