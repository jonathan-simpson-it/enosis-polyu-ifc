import readXlsxFile from "read-excel-file/node";
import type { StructuredRow } from "./ner";

export async function extractExcel(
  buffer: Buffer
): Promise<{ text: string; sheets: unknown[]; rows: StructuredRow[] }> {
  const sheets = await readXlsxFile(buffer);
  const allRows = sheets.flatMap((s) => s.data) as unknown[][];
  const text = allRows
    .map((row) =>
      (row as unknown[])
        .map((cell) => (cell === null || cell === undefined ? "" : String(cell)))
        .join("\t")
    )
    .join("\n");

  const rows = mapSheetRows(allRows);
  return { text, sheets: sheets as unknown[], rows };
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function mapSheetRows(rows: unknown[][]): StructuredRow[] {
  const structured: StructuredRow[] = [];
  if (rows.length < 2) return structured;

  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const candidate = (rows[i] as unknown[]).map((h) =>
      normalizeHeader(h === null || h === undefined ? "" : String(h))
    );
    if (candidate.includes("hs_code")) {
      headerIdx = i;
      headers = candidate;
      break;
    }
  }
  if (headerIdx === -1) return structured;

  const find = (...names: string[]): number => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const hsIdx = find("hs_code", "hs_code_1", "hs");
  const descIdx = find("description", "goods_description", "commodity", "item_description");
  const qtyIdx = find("quantity", "qty", "quantity_units");
  const unitIdx = find("unit", "uom", "unit_of_measure");
  const totalIdx = find("total_usd", "total_value_usd", "total_value", "declared_value", "amount_usd");
  const weightIdx = find("weight_kg", "gross_weight_kg", "gross_weight", "weight");
  const originIdx = find("country_of_origin", "country", "origin", "coo");

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i] as unknown[];
    const cell = (idx: number): string =>
      idx >= 0 && idx < cells.length && cells[idx] !== null && cells[idx] !== undefined
        ? String(cells[idx]).trim()
        : "";
    const hs = hsIdx >= 0 ? cell(hsIdx) : "";
    if (!hs) continue;
    structured.push({
      hs_code: hs,
      description: descIdx >= 0 ? cell(descIdx) : "",
      quantity: qtyIdx >= 0 ? cell(qtyIdx) : "",
      unit: unitIdx >= 0 ? cell(unitIdx) : "PCS",
      total_value_usd: totalIdx >= 0 ? cell(totalIdx) : "",
      gross_weight_kg: weightIdx >= 0 ? cell(weightIdx) : "",
      country_of_origin: originIdx >= 0 ? cell(originIdx) : "",
    });
  }
  return structured;
}
