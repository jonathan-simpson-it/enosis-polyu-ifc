import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    formats: ["wco_json", "wco_xml", "tsw_json"],
  });
}
