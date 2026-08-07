import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/engine/auth-store";

export async function GET(request: Request) {
  const user = getDemoUser(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    id: Buffer.from(user.email).toString("hex").slice(0, 12),
    email: user.email,
    full_name: user.fullName,
    role: "admin",
    org_id: "org-demo",
    api_key: "enosis-demo-key",
  });
}
