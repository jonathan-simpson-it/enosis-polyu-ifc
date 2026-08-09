import { NextResponse } from "next/server";
import { processBuffer } from "@/lib/engine/process";
import { upsertDocument, nextDeclarationId } from "@/lib/engine/store";
import { validateUpload } from "@/lib/engine/sanitizer";
import { withTimeout, ProcessingTimeoutError } from "@/lib/engine/timeout";
import type { Declaration } from "@/lib/engine/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ detail: "No file provided" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadCheck = validateUpload(bytes, file.name);
  if (!uploadCheck.valid) {
    return NextResponse.json(
      { detail: uploadCheck.errors.join("; ") },
      { status: 400 }
    );
  }

  let outcome;
  try {
    outcome = await withTimeout(
      processBuffer(bytes, file.name, file.type, { signal: request.signal }),
      40000
    );
  } catch (err) {
    if (err instanceof ProcessingTimeoutError) {
      return NextResponse.json(
        {
          detail:
            "The engine took too long on this document. Try again, or upload a smaller or clearer image.",
          vision: { status: "timed_out" },
        },
        { status: 504 }
      );
    }
    console.error("[enosis-upload] processing failed:", err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }

  const { extraction, parsed, vision } = outcome;

  const id = nextDeclarationId();
  const decl: Declaration = {
    id,
    filename: file.name,
    file_type: parsed.file_type,
    status: "extracted",
    confidence_avg: extraction.confidence_avg,
    doc_type: extraction.classification?.doc_type ?? null,
    classification: extraction.classification ?? null,
    decl_number: extraction.entities.invoice_numbers?.[0] || null,
    consignor_name: (extraction.labeled_fields.consignor_name as string) || null,
    consignee_name: (extraction.labeled_fields.consignee_name as string) || null,
    port_of_loading: (extraction.labeled_fields.port_of_loading as string) || null,
    port_of_discharge: (extraction.labeled_fields.port_of_discharge as string) || null,
    incoterms: (extraction.labeled_fields.incoterms as string) || null,
    total_declared_value: (extraction.labeled_fields.total_value as number) ?? null,
    gross_weight: (extraction.labeled_fields.gross_weight as number) ?? null,
    net_weight: (extraction.labeled_fields.net_weight as number) ?? null,
    number_of_packages: (extraction.labeled_fields.number_of_packages as number) ?? null,
    country_of_origin: extraction.entities.countries?.[0] || null,
    container_number: extraction.entities.container_numbers?.[0] || null,
    declared_currency: "USD",
    transport_mode: "Sea",
    commercial_notes: null,
    raw_text: parsed.raw_text,
    parsed_data: { structured_data: parsed.structured_data },
    created_at: new Date().toISOString(),
    commodities: extraction.commodities,
  };
  upsertDocument(decl);

  return NextResponse.json({
    declaration_id: id,
    filename: file.name,
    file_type: parsed.file_type,
    status: "extracted",
    char_count: parsed.raw_text.length,
    has_tables: parsed.tables.length > 0,
    structured_fields: Object.keys(parsed.structured_data),
    vision,
  });
}
