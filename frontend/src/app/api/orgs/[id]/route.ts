import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    id,
    name: "Demo Organization",
    br_number: null,
    subscription_tier: "demo",
    usage_limit: 100,
    usage_current: 0,
  });
}
