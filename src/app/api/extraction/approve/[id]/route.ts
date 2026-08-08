import { NextResponse } from "next/server";
import { getDocument, upsertDocument } from "@/lib/engine/store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }
  doc.status = "reviewed";
  upsertDocument(doc);
  return NextResponse.json({ declaration_id: id, status: "reviewed" });
}
