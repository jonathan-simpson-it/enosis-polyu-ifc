import { NextResponse } from "next/server";
import { getDocument, upsertDocument } from "@/lib/engine/store";
import { isKnownDocType } from "@/lib/engine/registry";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.doc_type !== undefined && isKnownDocType(String(body.doc_type))) {
    const docType = String(body.doc_type) as NonNullable<typeof doc.doc_type>;
    doc.doc_type = docType;
    doc.classification = {
      doc_type: docType,
      confidence: 1,
      method: "deterministic",
      signals: ["manual_override"],
      overridden: true,
    };
  }
  doc.status = "reviewed";
  upsertDocument(doc);
  return NextResponse.json({ declaration_id: id, status: "reviewed" });
}
