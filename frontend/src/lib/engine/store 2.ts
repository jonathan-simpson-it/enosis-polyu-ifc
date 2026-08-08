import { DEMO_DOCS } from "../demo-data";
import type { Commodity, Declaration } from "./types";

const documents = new Map<string, Declaration>();

function seedFromDemoDocs(): void {
  if (documents.size > 0) return;
  const now = Date.now();
  for (const demo of DEMO_DOCS) {
    const lf = demo.extraction.labeled_fields;
    const commodities: Commodity[] = demo.extraction.commodities.map((c) => ({
      ...c,
      id: c.id || `seed-${Math.random().toString(36).slice(2, 10)}`,
    }));
    const decl: Declaration = {
      id: demo.extraction.declaration_id,
      filename: demo.label,
      file_type: demo.fileType.toLowerCase(),
      status: demo.extraction.needs_review ? "extracted" : "reviewed",
      confidence_avg: demo.extraction.confidence_avg,
      decl_number: demo.extraction.entities.invoice_numbers?.[0] || null,
      consignor_name: (lf.consignor_name as string) || null,
      consignee_name: (lf.consignee_name as string) || null,
      port_of_loading: (lf.port_of_loading as string) || null,
      port_of_discharge: (lf.port_of_discharge as string) || null,
      incoterms: (lf.incoterms as string) || null,
      total_declared_value: (lf.total_value as number) ?? null,
      gross_weight: (lf.gross_weight as number) ?? null,
      net_weight: (lf.net_weight as number) ?? null,
      number_of_packages: (lf.number_of_packages as number) ?? null,
      country_of_origin: demo.extraction.entities.countries?.[0] || null,
      container_number: demo.extraction.entities.container_numbers?.[0] || null,
      declared_currency: "USD",
      transport_mode: "Sea",
      commercial_notes: null,
      created_at: new Date(now - Math.floor(Math.random() * 5) * 86400000).toISOString(),
      commodities,
    };
    documents.set(decl.id, decl);
  }
}

export function listDocuments(): Declaration[] {
  seedFromDemoDocs();
  return Array.from(documents.values());
}

export function getDocument(id: string): Declaration | undefined {
  seedFromDemoDocs();
  return documents.get(id);
}

export function upsertDocument(decl: Declaration): void {
  seedFromDemoDocs();
  documents.set(decl.id, decl);
}

export function deleteDocument(id: string): boolean {
  seedFromDemoDocs();
  return documents.delete(id);
}

export function nextDeclarationId(): string {
  seedFromDemoDocs();
  let id = `decl-${Math.random().toString(36).slice(2, 10)}`;
  while (documents.has(id)) {
    id = `decl-${Math.random().toString(36).slice(2, 10)}`;
  }
  return id;
}
