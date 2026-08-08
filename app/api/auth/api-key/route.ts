import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    api_key: `enosis-demo-${Math.random().toString(36).slice(2, 10)}`,
  });
}
