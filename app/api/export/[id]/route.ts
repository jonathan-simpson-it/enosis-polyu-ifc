import { NextResponse } from "next/server";
import { getDocument } from "@/lib/engine/store";
import { buildWcoJson, buildWcoXml, buildTswPayload } from "@/lib/engine/wco";
import { validateTswReady } from "@/lib/engine/validator";
import { translateText, type TargetLang } from "@/lib/engine/translate";
import { getDocTypeDefinition, defaultExportFormatFor } from "@/lib/engine/registry";
import type { DeclarationHeader } from "@/lib/engine/wco";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const requestedFormat = searchParams.get("format");
  const translateTo = searchParams.get("translate_to") as TargetLang | null;

  const docType = doc.doc_type || "other";
  const typeDef = getDocTypeDefinition(docType);
  const format =
    requestedFormat || defaultExportFormatFor(docType);

  let commodities = doc.commodities;
  if (translateTo && ["en", "zh-Hant-HK", "zh-Hans-CN"].includes(translateTo)) {
    const descriptions = await Promise.all(
      commodities.map((c) =>
        translateText(c.description, translateTo).then((r) => r?.translated || c.description)
      )
    );
    commodities = commodities.map((c, i) => ({
      ...c,
      description: descriptions[i],
    }));
  }

  const header: DeclarationHeader = {
    declaration_number: doc.decl_number || doc.id,
    consignor_name: doc.consignor_name || "",
    consignee_name: doc.consignee_name || "",
    port_of_loading: doc.port_of_loading || "",
    port_of_discharge: doc.port_of_discharge || "",
    container_number: doc.container_number || "",
    number_of_packages: doc.number_of_packages ?? 1,
    transport_mode: doc.transport_mode || "Sea",
    incoterms: doc.incoterms || "",
    gross_weight: doc.gross_weight ?? undefined,
    net_weight: doc.net_weight ?? undefined,
    type_code: "IM",
    declaration_date: doc.created_at || "",
    currency: doc.declared_currency || "USD",
  };

  let payload: Record<string, unknown>;
  let xml: string | null = null;

  if (format === "tsw_json") {
    payload = buildTswPayload(header, commodities, doc.decl_number || "");
  } else if (format === "wco_xml") {
    payload = buildWcoJson(header, commodities);
    xml = buildWcoXml(header, commodities);
  } else {
    payload = buildWcoJson(header, commodities);
  }

  const validation = validateTswReady(payload as Record<string, unknown>);

  return NextResponse.json({
    declaration_id: id,
    format,
    export: payload,
    xml,
    validation,
    classification: {
      doc_type: docType,
      label: typeDef.label,
      target_standards: typeDef.target_standards,
      purpose: typeDef.purpose,
      confidence: doc.classification?.confidence ?? null,
      overridden: doc.classification?.overridden ?? false,
    },
  });
}
