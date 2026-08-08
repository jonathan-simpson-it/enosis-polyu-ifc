import type { ParsedDocument } from "./types";
import type { StructuredRow } from "./ner";

export function detectFileType(filename: string, contentType?: string | null): string {
  const name = filename.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".tiff") || name.endsWith(".bmp") || name.endsWith(".webp")) return "image";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".csv")) return "csv";

  if (contentType) {
    if (contentType.includes("pdf")) return "pdf";
    if (contentType.includes("excel") || contentType.includes("spreadsheet")) return "excel";
    if (contentType.startsWith("image/")) return "image";
  }

  return "text";
}

const OCR_LANGS =
  process.env.ENOSIS_OCR_LANGS || "eng+chi_sim+chi_tra";

export async function parseDocument(
  fileBytes: Buffer,
  filename: string,
  contentType?: string | null
): Promise<ParsedDocument> {
  const fileType = detectFileType(filename, contentType);
  const result: ParsedDocument = {
    filename,
    file_type: fileType,
    raw_text: "",
    structured_data: {},
    tables: [],
  };

  if (fileType === "pdf") {
    const { extractPdf } = await import("./pdf");
    const parsed = await extractPdf(fileBytes);
    result.raw_text = parsed.text;
    result.tables = parsed.tables;
  } else if (fileType === "excel") {
    const { extractExcel } = await import("./excel");
    const parsed = await extractExcel(fileBytes);
    result.raw_text = parsed.text;
    result.structured_data = { sheets: parsed.sheets, rows: parsed.rows };
  } else if (fileType === "image") {    const { extractImage } = await import("./ocr");
    const parsed = await extractImage(fileBytes);
    result.raw_text = parsed.text;
    result.structured_data = parsed.structured;
  } else if (fileType === "json") {
    result.raw_text = fileBytes.toString("utf-8");
    try {
      result.structured_data = JSON.parse(result.raw_text) as Record<string, unknown>;
    } catch {
      // keep structured_data empty on malformed JSON
    }
  } else if (fileType === "csv") {
    result.raw_text = fileBytes.toString("utf-8");
    result.structured_data = { rows: parseCsvRows(result.raw_text) };
  } else {
    result.raw_text = fileBytes.toString("utf-8");
  }

  return result;
}

export function parseCsvRows(text: string): StructuredRow[] {
  const rows: StructuredRow[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return rows;

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row: StructuredRow = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (!key) continue;
      const val = (cells[j] ?? "").trim();
      if (key === "hs_code" || key === "hs_code_1" || key === "hs") {
        row.hs_code = val;
      } else if (key === "description" || key === "goods_description" || key === "commodity") {
        row.description = val;
      } else if (key === "quantity" || key === "qty") {
        row.quantity = val;
      } else if (key === "unit" || key === "uom") {
        row.unit = val;
      } else if (key === "total_value_usd" || key === "total_value" || key === "declared_value" || key === "value_usd") {
        row.total_value_usd = val;
      } else if (key === "gross_weight_kg" || key === "gross_weight" || key === "weight") {
        row.gross_weight_kg = val;
      } else if (key === "country_of_origin" || key === "country" || key === "origin") {
        row.country_of_origin = val;
      }
    }
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}
