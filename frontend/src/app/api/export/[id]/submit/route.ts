import { NextResponse } from "next/server";
import { getDocument } from "@/lib/engine/store";

function generateTswReference(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let ref = "TSW-DEMO-";
  for (let i = 0; i < 4; i++) {
    ref += letters[Math.floor(Math.random() * letters.length)];
  }
  ref += "-";
  for (let i = 0; i < 6; i++) {
    ref += Math.floor(Math.random() * 10);
  }
  return ref;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({
    declaration_id: id,
    status: "submitted",
    tsw_reference: generateTswReference(),
    submission_id: `sub-${Math.random().toString(36).slice(2, 10)}`,
  });
}
