import { NextResponse } from "next/server";
import { getDocument, deleteDocument, upsertDocument } from "@/lib/engine/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }
  return NextResponse.json(doc);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const updatable = [
    "status",
    "consignor_name",
    "consignee_name",
    "port_of_loading",
    "port_of_discharge",
    "incoterms",
    "total_declared_value",
    "gross_weight",
    "net_weight",
    "number_of_packages",
    "container_number",
    "declared_currency",
    "transport_mode",
    "commercial_notes",
    "confidence_avg",
  ] as const;

  for (const key of updatable) {
    if (body[key] !== undefined) {
      (doc as unknown as Record<string, unknown>)[key] = body[key];
    }
  }
  upsertDocument(doc);
  return NextResponse.json({ status: "ok", id });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = deleteDocument(id);
  if (!removed) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ status: "deleted" });
}
