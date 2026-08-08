import type { Commodity } from "./types";

export interface DeclarationHeader {
  declaration_number?: string;
  consignor_name?: string;
  consignor_address?: string;
  consignee_name?: string;
  consignee_address?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  container_number?: string;
  number_of_packages?: number;
  transport_mode?: string;
  incoterms?: string;
  gross_weight?: number;
  net_weight?: number;
  type_code?: string;
  declaration_date?: string;
  currency?: string;
}

function uid(prefix = "c"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildWcoJson(
  declarationData: DeclarationHeader,
  commodities: Commodity[]
): Record<string, unknown> {
  const declarationId =
    declarationData.declaration_number || uid("decl").toUpperCase();

  const consignment: Record<string, unknown> = {
    Consignor: {
      Name: declarationData.consignor_name || "",
      Address: { Line: declarationData.consignor_address || "" },
    },
    Consignee: {
      Name: declarationData.consignee_name || "",
      Address: { Line: declarationData.consignee_address || "" },
    },
    LoadingLocation: { Name: declarationData.port_of_loading || "" },
    DischargeLocation: { Name: declarationData.port_of_discharge || "" },
    TransportEquipment: [{ ID: declarationData.container_number || "N/A" }],
    ConsignmentPackageQuantity: declarationData.number_of_packages ?? 1,
    TransportModeCode: declarationData.transport_mode || "Sea",
  };

  if (declarationData.incoterms) {
    consignment.Incoterms = { Code: declarationData.incoterms };
  }
  if (declarationData.gross_weight) {
    consignment.TotalGrossMassMeasure = {
      Value: declarationData.gross_weight,
      UnitCode: "KGM",
    };
  }
  if (declarationData.net_weight) {
    consignment.TotalNetMassMeasure = {
      Value: declarationData.net_weight,
      UnitCode: "KGM",
    };
  }

  const goodsItems = commodities.map((c, idx) => {
    const goodsMeasure: Record<string, unknown> = {};
    if (c.declared_value) {
      goodsMeasure.CustomsValueAmount = { Value: c.declared_value };
    }
    if (c.weight) {
      goodsMeasure.NetNetWeightMeasure = {
        Value: c.weight,
        UnitCode: "KGM",
      };
    }
    if (c.quantity) {
      goodsMeasure.QuantityQuantity = { Value: c.quantity };
    }
    const item: Record<string, unknown> = {
      SequenceNumeric: idx + 1,
      Commodity: {
        Classification: [
          { ID: c.hs_code || "", IdentificationTypeCode: "HS" },
        ],
        Description: c.description,
      },
      GoodsMeasure: goodsMeasure,
    };
    if (c.country_of_origin) {
      item.TradeCountry = [
        { ID: c.country_of_origin, TypeCode: "Origin" },
      ];
    }
    return item;
  });

  return {
    resourceType: "WCODeclaration",
    type: "customs_declaration",
    specification: "WCO Data Model v3.11",
    profile: ["https://www.wcoomd.org/datamodel"],
    declaration_id: declarationId,
    declaration: {
      Declaration: {
        ID: declarationId,
        FunctionCode: "9",
        TypeCode: declarationData.type_code || "IM",
        IssueDateTime: declarationData.declaration_date || "",
      },
      GoodsShipment: {
        Consignment: consignment,
        GovernmentAgencyGoodsItem: goodsItems,
      },
    },
  };
}

function dictToXmlLines(data: unknown, key: string, depth: number): string[] {
  const indent = "  ".repeat(depth);
  const lines: string[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      lines.push(...dictToXmlLines(item, key, depth));
    }
  } else if (typeof data === "object" && data !== null) {
    lines.push(`${indent}<${key}>`);
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      lines.push(...dictToXmlLines(v, k, depth + 1));
    }
    lines.push(`${indent}</${key}>`);
  } else {
    lines.push(
      `${indent}<${key}>${escapeXml(data === null || data === undefined ? "" : String(data))}</${key}>`
    );
  }
  return lines;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildWcoXml(
  declarationData: DeclarationHeader,
  commodities: Commodity[]
): string {
  const jsonData = buildWcoJson(declarationData, commodities);
  const body = dictToXmlLines(jsonData, "WCODeclaration", 0).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}

export function buildTswPayload(
  declarationData: DeclarationHeader,
  commodities: Commodity[],
  traderRef = ""
): Record<string, unknown> {
  const wco = buildWcoJson(declarationData, commodities);
  return {
    tsw_version: "3.0",
    submission_type: "declaration",
    trader_reference: traderRef || declarationData.declaration_number || "",
    submission_channel: "API",
    declaration: wco,
  };
}
