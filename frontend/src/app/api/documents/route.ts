import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/engine/store";

export async function GET() {
  return NextResponse.json({ documents: listDocuments() });
}
