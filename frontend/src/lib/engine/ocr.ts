import { createWorker, type Worker } from "tesseract.js";
import sharp from "sharp";

export interface OcrResult {
  text: string;
  confidence: number;
  usedFallback: boolean;
}

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker(
      process.env.ENOSIS_OCR_LANGS || "eng+chi_sim+chi_tra"
    );
  }
  return workerPromise;
}

export async function extractImage(
  buffer: Buffer
): Promise<{ text: string; structured: Record<string, unknown> }> {
  const { text, confidence } = await ocrBuffer(buffer);
  return {
    text,
    structured: {
      invoice_number: null,
      commodities: [],
      container_number: null,
      gross_weight: null,
      country_of_origin: null,
      ocr_confidence: confidence,
    },
  };
}

// Leptonica (tesseract's image backend) cannot decode progressive JPEGs or
// HEIC. Re-encode through sharp first: baseline PNG, EXIF-rotated, greyscale
// for contrast stability.
async function normalizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate()
      .greyscale()
      .png({ compressionLevel: 6 })
      .toBuffer();
  } catch {
    return buffer;
  }
}

export async function ocrBuffer(buffer: Buffer): Promise<OcrResult> {
  try {
    const normalized = await normalizeImage(buffer);
    const worker = await getWorker();
    const { data } = await worker.recognize(normalized);
    const text = data.text || "";
    return { text, confidence: data.confidence || 0, usedFallback: false };
  } catch (err) {
    console.error("[enosis-ocr] tesseract failed:", err);
    return { text: "", confidence: 0, usedFallback: true };
  }
}
