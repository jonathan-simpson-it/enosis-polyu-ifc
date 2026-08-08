import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    org_name?: string;
    full_name?: string;
  };
  const email = (body.email || "").toLowerCase();
  const password = body.password || "";

  if (!email.includes("@") || password.length < 4) {
    return NextResponse.json(
      { detail: "Email and password (4+ chars) required" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    access_token: `demo-${Buffer.from(email).toString("base64url")}`,
    token_type: "bearer",
    user_id: Buffer.from(email).toString("hex").slice(0, 12),
    org_id: "org-demo",
  });
}
