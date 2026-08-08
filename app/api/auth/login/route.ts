import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const email = (body.email || "demo@enosis.hk").toLowerCase();
  const password = body.password || "demo";

  if (!email.includes("@") || password.length < 4) {
    return NextResponse.json(
      { detail: "Invalid email or password" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    access_token: `demo-${Buffer.from(email).toString("base64url")}`,
    token_type: "bearer",
    user_id: Buffer.from(email).toString("hex").slice(0, 12),
    org_id: "org-demo",
  });
}
