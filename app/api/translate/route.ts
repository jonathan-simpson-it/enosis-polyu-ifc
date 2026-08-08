import { NextResponse } from "next/server";
import { translateText, type TargetLang } from "@/lib/engine/translate";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    text?: string;
    target?: string;
  };
  const text = (body.text || "").trim();
  const target = (body.target || "zh-Hant-HK") as TargetLang;

  if (!text) {
    return NextResponse.json({ detail: "text is required" }, { status: 400 });
  }
  if (!["en", "zh-Hant-HK", "zh-Hans-CN"].includes(target)) {
    return NextResponse.json({ detail: "unsupported target language" }, { status: 400 });
  }

  const result = await translateText(text, target);
  if (!result) {
    return NextResponse.json(
      { detail: "Translation unavailable (no API key configured or model error)" },
      { status: 503 }
    );
  }

  return NextResponse.json(result);
}
