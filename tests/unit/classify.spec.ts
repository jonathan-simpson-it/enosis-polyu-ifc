import { test, expect } from "@playwright/test";
import { classifyDeterministic, classifyDocument } from "../../lib/engine/classify";
import {
  getDocTypeDefinition,
  defaultExportFormatFor,
  DOC_TYPE_DEFINITIONS,
  targetStandardsFor,
} from "../../lib/engine/registry";

const INVOICE_TEXT = `COMMERCIAL INVOICE
INV #: INV-2026-0715-0042
Consignor: Shenzhen Electronics Trading Co.
Consignee: HK Logistics Ltd.
Date: 2026-07-15
Incoterms: CIF
1. "Portable laptop computers" HS Code: 8471.30.00 Quantity: 500 PCS
2. "Solid-state storage drives" HS Code: 8523.51.00 Quantity: 1000 PCS
Total Declared Value: USD 639,000.00`;

const PACKING_LIST_TEXT = `PACKING LIST
Port of Loading: Shenzhen
Port of Discharge: Hong Kong
Gross Weight: 915 KG
Net Weight: 860 KG
Number of Packages: 12 CTN
1. Portable laptop computers, HS: 8471.30.00, Qty 500 PCS
2. Solid-state storage drives, HS: 8523.51.00, Qty 1000 PCS`;

const BILL_OF_LADING_TEXT = `BILL OF LADING
Vessel: MSC ANNA
Voyage: 761W
Port of Loading: YANTIAN
Port of Discharge: HONG KONG
Container: MSCU4820137
Shipped on board 2026-07-15
Consignee: HK Logistics Ltd.`;

const CERT_OF_ORIGIN_TEXT = `CERTIFICATE OF ORIGIN
Certificate No.: COO-2026-0088
Exporter: Shenzhen Electronics Trading Co.
Country of Origin: CHINA
HS Code: 8471.30.00
Preferential tariff claim under HK-GBA agreement`;

const PURCHASE_ORDER_TEXT = `PURCHASE ORDER
PO #: PO-8861
Buyer: HK Logistics Ltd.
Delivery Date: 2026-08-20
Terms of Payment: 30 days
1. Portable laptop computers, Qty 500, Unit Price USD 850`;

const CUSTOMS_DECLARATION_TEXT = `CUSTOMS DECLARATION
TSW Filing: DCL-2026-11999
Trade Single Window submission
Declared Value: USD 639,000.00
HS Code: 8471.30.00
Port of Discharge: Hong Kong`;

const BANK_STATEMENT_TEXT = `BANK STATEMENT
Account Number: 1234-5678-9012
Statement Period: 2026-06-01 to 2026-06-30
Opening Balance: HKD 120,000.00
Transactions:
2026-06-05 CREDIT HKD 250,000.00
Closing Balance: HKD 370,000.00`;

const RECEIPT_TEXT = `RECEIPT
Nota No.: NT-88213
Received from: HK Logistics Ltd.
Total: Rp 8,500,000
Paid by WeChat Pay 2026-07-15`;

const GIBBERISH_TEXT = `florp zyxq wibble 4839201 qwerty asdfgh
zzz bbb ccc ddd eee fff ggg hhh iii jjj`;

test.describe("classifyDeterministic", () => {
  test("classifies a commercial invoice", () => {
    const result = classifyDeterministic(INVOICE_TEXT);
    expect(result.doc_type).toBe("commercial_invoice");
    expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    expect(result.method).toBe("deterministic");
    expect(result.signals.length).toBeGreaterThan(0);
  });

  test("classifies a packing list", () => {
    expect(classifyDeterministic(PACKING_LIST_TEXT).doc_type).toBe("packing_list");
  });

  test("classifies a bill of lading", () => {
    expect(classifyDeterministic(BILL_OF_LADING_TEXT).doc_type).toBe("bill_of_lading");
  });

  test("classifies a certificate of origin", () => {
    expect(classifyDeterministic(CERT_OF_ORIGIN_TEXT).doc_type).toBe(
      "certificate_of_origin",
    );
  });

  test("classifies a purchase order", () => {
    expect(classifyDeterministic(PURCHASE_ORDER_TEXT).doc_type).toBe("purchase_order");
  });

  test("classifies a customs declaration", () => {
    expect(classifyDeterministic(CUSTOMS_DECLARATION_TEXT).doc_type).toBe(
      "customs_declaration",
    );
  });

  test("classifies a bank statement", () => {
    expect(classifyDeterministic(BANK_STATEMENT_TEXT).doc_type).toBe("bank_statement");
  });

  test("classifies a receipt / nota", () => {
    expect(classifyDeterministic(RECEIPT_TEXT).doc_type).toBe("receipt");
  });

  test("returns other with fallback for gibberish", () => {
    const result = classifyDeterministic(GIBBERISH_TEXT);
    expect(result.doc_type).toBe("other");
    expect(result.method).toBe("fallback");
  });

  test("returns fallback for empty text", () => {
    const result = classifyDeterministic("");
    expect(result.doc_type).toBe("other");
    expect(result.method).toBe("fallback");
  });

  test("handles traditional Chinese invoice text", () => {
    const result = classifyDeterministic("發票 號碼 INV-100\n總價值 HKD 5,000\n發票");
    expect(result.doc_type).toBe("commercial_invoice");
  });

  test("handles Chinese packing list text", () => {
    const result = classifyDeterministic("裝箱單\n毛重 100 KG\n淨重 90 KG");
    expect(result.doc_type).toBe("packing_list");
  });

  test("uses filename as a hint for thin CSV content", () => {
    const result = classifyDeterministic(
      "item_no,description,hs_code,quantity,unit,unit_price_usd,total_value_usd,gross_weight_kg,country_of_origin\n001,Cotton pullovers,6110.20.00,2000,pcs,15.00,30000.00,400.0,China",
      "packing-list.csv",
    );
    expect(result.doc_type).toBe("packing_list");
  });

  test("filename does not override clear body signals", () => {
    const result = classifyDeterministic(
      "COMMERCIAL INVOICE\nINV #: INV-2026-0001\nTotal Value: USD 10,000",
      "wechat-scan.png",
    );
    expect(result.doc_type).toBe("commercial_invoice");
  });
});

test.describe("classifyDocument (pipeline)", () => {
  test("returns a classification for a parsed document", async () => {
    const result = await classifyDocument({
      filename: "invoice-sample.txt",
      file_type: "text",
      raw_text: INVOICE_TEXT,
      structured_data: {},
      tables: [],
    });
    expect(result.doc_type).toBe("commercial_invoice");
    expect(result.confidence).toBeGreaterThan(0);
    expect(["deterministic", "llm", "fallback"]).toContain(result.method);
  });
});

test.describe("registry", () => {
  test("has 9 doc type definitions", () => {
    expect(DOC_TYPE_DEFINITIONS).toHaveLength(9);
    expect(DOC_TYPE_DEFINITIONS[0].doc_type).toBe("commercial_invoice");
    expect(DOC_TYPE_DEFINITIONS[8].doc_type).toBe("other");
  });

  test("invoice maps to WCO + TSW", () => {
    const def = getDocTypeDefinition("commercial_invoice");
    expect(def.target_standards).toContain("WCO Data Model v3.11");
    expect(def.target_standards).toContain("HK TSW Phase 3 JSON");
    expect(def.expected_header_fields).toContain("invoice_number");
  });

  test("bill of lading maps to WCO only", () => {
    const def = getDocTypeDefinition("bill_of_lading");
    expect(def.target_standards).toEqual(["WCO Data Model v3.11"]);
    expect(def.expected_header_fields).toContain("vessel");
  });

  test("bank statement maps to TSW only", () => {
    expect(targetStandardsFor("bank_statement")).toEqual(["HK TSW Phase 3 JSON"]);
  });

  test("other has no target standards", () => {
    expect(targetStandardsFor("other")).toEqual([]);
  });

  test("default export format follows the category", () => {
    expect(defaultExportFormatFor("commercial_invoice")).toBe("tsw_json");
    expect(defaultExportFormatFor("bill_of_lading")).toBe("wco_json");
    expect(defaultExportFormatFor("bank_statement")).toBe("tsw_json");
    expect(defaultExportFormatFor("other")).toBe("wco_json");
  });

  test("every definition has labels and a purpose", () => {
    for (const def of DOC_TYPE_DEFINITIONS) {
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.short_label.length).toBeGreaterThan(0);
      expect(def.purpose.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });
});
