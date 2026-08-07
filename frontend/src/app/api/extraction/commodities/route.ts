import { NextResponse } from "next/server";
import { listDocuments, upsertDocument } from "@/lib/engine/store";
import type { Commodity } from "@/lib/engine/types";

interface CommodityUpdate {
  id: string;
  hs_code?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  declared_value?: number;
  weight?: number;
  country_of_origin?: string;
}

export async function PUT(request: Request) {
  const updates = (await request.json().catch(() => [])) as CommodityUpdate[];
  const docs = listDocuments();
  const updated: string[] = [];

  for (const upd of updates) {
    for (const doc of docs) {
      const idx = doc.commodities.findIndex((c) => c.id === upd.id);
      if (idx === -1) continue;
      const c: Commodity = doc.commodities[idx];
      if (upd.hs_code !== undefined) c.hs_code = upd.hs_code;
      if (upd.description !== undefined) c.description = upd.description;
      if (upd.quantity !== undefined) c.quantity = upd.quantity;
      if (upd.unit !== undefined) c.unit = upd.unit;
      if (upd.declared_value !== undefined) c.declared_value = upd.declared_value;
      if (upd.weight !== undefined) c.weight = upd.weight;
      if (upd.country_of_origin !== undefined) c.country_of_origin = upd.country_of_origin;
      c.reviewed = true;
      upsertDocument(doc);
      updated.push(c.id);
      break;
    }
  }

  return NextResponse.json({ updated: updated.length, commodity_ids: updated });
}
