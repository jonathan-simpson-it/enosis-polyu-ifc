import { NextResponse } from "next/server";
import { processBuffer } from "@/lib/engine/process";
import { withTimeout, ProcessingTimeoutError } from "@/lib/engine/timeout";

// Vision calls can run long (the free fallback has measured up to ~45s);
// the route race (58s) and the vision module's own 55s abort must both stay
// under this ceiling.
export const maxDuration = 60;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ detail: "No file provided" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    // request.signal fires on client disconnect, so abandoned requests stop
    // the vision fetch instead of burning Lambda time until maxDuration.
    const { extraction, parsed, vision, emptyExtraction } = await withTimeout(
      processBuffer(bytes, file.name, file.type, { signal: request.signal }),
      58000
    );

    // The engine read nothing AND the vision model did not deliver: surface
    // it as an error instead of a 200 that lets the caller download an empty
    // declaration. Text documents with no extractable data hit this too.
    if (emptyExtraction && vision.status !== "ok") {
      return NextResponse.json(
        {
          detail:
            vision.status === "timed_out"
              ? "The vision model timed out and no data could be extracted. Try again — or upload a clearer, smaller image."
              : "No data could be extracted from this document. Try again with a clearer scan.",
          vision,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      extraction,
      vision,
      parsed: {
        filename: parsed.filename,
        file_type: parsed.file_type,
        char_count: parsed.raw_text.length,
      },
    });
  } catch (err) {
    if (err instanceof ProcessingTimeoutError) {
      return NextResponse.json(
        {
          detail:
            "The engine took too long on this document. Try again, or upload a smaller or clearer image.",
          vision: { status: "timed_out" },
        },
        { status: 504 }
      );
    }
    console.error("[enosis-process] processing failed:", err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
