import { createWorker, PSM, type Worker } from "tesseract.js";
import sharp from "sharp";

export interface OcrResult {
  text: string;
  confidence: number;
  usedFallback: boolean;
}

interface OcrAttempt {
  text: string;
  confidence: number;
}

let workerPromise: Promise<Worker> | null = null;

// tesseract.js workers share mutable PSM state; concurrent setParameters calls
// corrupt recognition. Serialize all OCR work through one promise chain.
let ocrQueue: Promise<unknown> = Promise.resolve();

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker(
      process.env.ENOSIS_OCR_LANGS || "eng+ind+chi_sim+chi_tra"
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
// HEIC. Re-encode through sharp first: EXIF-rotated, greyscale, contrast
// stretched and sharpened so faint pencil and pen strokes separate from paper.
async function normalizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate()
      .greyscale()
      .normalize({ lower: 5, upper: 95 })
      .sharpen()
      .linear(1.4, -0.15)
      .png({ compressionLevel: 6 })
      .toBuffer();
  } catch {
    return buffer;
  }
}

async function runAttempt(
  worker: Worker,
  image: Buffer,
  psm: PSM
): Promise<OcrAttempt> {
  try {
    await worker.setParameters({ tessedit_pageseg_mode: psm });
    const { data } = await worker.recognize(image);
    return { text: data.text || "", confidence: data.confidence || 0 };
  } catch {
    return { text: "", confidence: 0 };
  }
}

export async function ocrBuffer(buffer: Buffer): Promise<OcrResult> {
  const run = async (): Promise<OcrResult> => {
    try {
      const normalized = await normalizeImage(buffer);
      const worker = await getWorker();

      // Try a uniform block first (PSM 6), then a single column (PSM 4).
      // Handwritten notes fragment into columns, printed forms stay in blocks.
      // Sequential: setParameters mutates shared worker state.
      const block = await runAttempt(worker, normalized, PSM.SINGLE_BLOCK);
      const column = await runAttempt(worker, normalized, PSM.SINGLE_COLUMN);

      const attempts = [block, column].filter((a) => a.text.length > 0);
      if (attempts.length === 0) {
        return { text: "", confidence: 0, usedFallback: false };
      }

      const best = attempts.reduce((a, b) =>
        b.text.length > a.text.length ? b : a
      );
      return {
        text: best.text,
        confidence: best.confidence,
        usedFallback: false,
      };
    } catch (err) {
      console.error("[enosis-ocr] tesseract failed:", err);
      return { text: "", confidence: 0, usedFallback: true };
    }
  };

  const result = ocrQueue.then(run, run);
  ocrQueue = result.catch(() => {});
  return result;
}
