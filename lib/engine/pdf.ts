import "./pdf-globals";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

const WORKER_REL = join("pdfjs-dist", "legacy", "build", "pdf.worker.mjs");

function findWorkerSrc(): string | null {
  const candidates = [
    join(process.cwd(), "node_modules", WORKER_REL),
    join(process.cwd(), "..", "node_modules", WORKER_REL),
    join(resolve(process.cwd(), "..", ".."), "node_modules", WORKER_REL),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).toString();
    }
  }
  return null;
}

const workerSrc = findWorkerSrc();
if (workerSrc) {
  GlobalWorkerOptions.workerSrc = workerSrc;
}

export async function extractPdf(
  buffer: Buffer
): Promise<{ text: string; tables: unknown[] }> {
  const data: Uint8Array = Buffer.isBuffer(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : buffer;
  const loadingTask = getDocument({ data, verbosity: 0 });
  const doc = await loadingTask.promise;
  try {
    const chunks: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? String((item as { str: string }).str) : ""))
        .join(" ");
      chunks.push(pageText);
    }
    return { text: chunks.join("\n").replace(/\u0000/g, ""), tables: [] };
  } finally {
    await loadingTask.destroy();
  }
}
