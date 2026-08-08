import { NextResponse } from "next/server";
import { processBuffer } from "@/lib/engine/process";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ detail: "No file provided" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const { extraction, parsed } = await processBuffer(bytes, file.name, file.type);

  return NextResponse.json({
    extraction,
    parsed: {
      filename: parsed.filename,
      file_type: parsed.file_type,
      char_count: parsed.raw_text.length,
    },
  });
}
