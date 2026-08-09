export interface DemoDoc {
  id: string;
  label: string;
  desc: string;
  fileType: string;
  viewerType: "text" | "table" | "pdf" | "ocr";
  href: string;
  preview: string;
  extraction: DemoExtraction;
}

export interface DemoExtraction {
  declaration_id: string;
  status: string;
  confidence_avg: number;
  classification?: {
    doc_type: string;
    confidence: number;
    method: string;
    signals: string[];
  };
  entities: {
    hs_codes: string[];
    container_numbers: string[];
    weights: number[];
    quantities: number[];
    dates: string[];
    invoice_numbers: string[];
    total_values: number[];
    countries: string[];
    commodity_descriptions: string[];
  };
  confidence_scores: Record<string, number>;
  needs_review: boolean;
  commodities: DemoCommodity[];
  labeled_fields: Record<string, string | number>;
}

export interface DemoCommodity {
  id: string;
  description: string;
  hs_code: string;
  hs_code_confidence: number;
  quantity: number;
  unit: string;
  declared_value: number;
  weight: number;
  country_of_origin: string;
  reviewed: boolean;
}

function uid(): string {
  return "demo-" + Math.random().toString(36).slice(2, 10);
}

const INVOICE_DOC: DemoDoc = {
  id: "invoice",
  label: "Trade Invoice",
  desc: "PDF extract: HS codes, weights, containers",
  fileType: "TXT",
  viewerType: "text",
  href: "/data/mock/invoice-sample.txt",
  preview:
    "INV-2026-0715-0042  |  Shenzhen Electronics Trading  |  3 commodities  |  HS: 8471.30.00, 8523.51.00, 8542.31.00  |  USD 639,000.00",
  extraction: {
    declaration_id: "demo-inv-001",
    status: "extracted",
    confidence_avg: 0.91,
    entities: {
      hs_codes: ["8471.30.00", "8523.51.00", "8542.31.00"],
      container_numbers: ["MSCU4820137"],
      weights: [750.0, 120.0, 45.0],
      quantities: [500, 1000, 10000],
      dates: ["2026-07-15"],
      invoice_numbers: ["INV-2026-0715-0042"],
      total_values: [425000.0, 89000.0, 125000.0],
      countries: ["China", "China", "Taiwan"],
      commodity_descriptions: [
        "Portable laptop computers, brand: Lenovo ThinkPad X1",
        "Solid-state storage drives, 1TB, NVMe",
        "Electronic integrated circuits, processor controllers",
      ],
    },
    confidence_scores: {
      hs_codes: 0.94,
      containers: 0.95,
      weights: 0.92,
      dates: 0.96,
      invoice_numbers: 0.97,
      overall: 0.91,
    },
    needs_review: false,
    classification: {
      doc_type: "commercial_invoice",
      confidence: 0.93,
      method: "deterministic",
      signals: ["seeded_demo"],
    },
    commodities: [
      {
        id: uid(),
        description: "Portable laptop computers, brand: Lenovo ThinkPad X1",
        hs_code: "8471.30.00",
        hs_code_confidence: 0.94,
        quantity: 500,
        unit: "units",
        declared_value: 425000,
        weight: 750,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Solid-state storage drives, 1TB, NVMe",
        hs_code: "8523.51.00",
        hs_code_confidence: 0.93,
        quantity: 1000,
        unit: "units",
        declared_value: 89000,
        weight: 120,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Electronic integrated circuits, processor controllers",
        hs_code: "8542.31.00",
        hs_code_confidence: 0.92,
        quantity: 10000,
        unit: "units",
        declared_value: 125000,
        weight: 45,
        country_of_origin: "Taiwan",
        reviewed: false,
      },
    ],
    labeled_fields: {
      consignor_name: "Shenzhen Electronics Trading Co., Ltd.",
      consignee_name: "HK Digital Logistics Ltd.",
      port_of_loading: "Yantian, Shenzhen",
      port_of_discharge: "Hong Kong",
      incoterms: "CIF",
      container_number: "MSCU4820137",
      total_value: 639000,
      gross_weight: 915,
      net_weight: 832,
      number_of_packages: 28,
    },
  },
};

const PACKING_DOC: DemoDoc = {
  id: "packing",
  label: "Packing List",
  desc: "CSV: 5 commodity lines with HS codes",
  fileType: "CSV",
  viewerType: "table",
  href: "/data/mock/packing-list.csv",
  preview:
    "Cotton pullovers (6110.20.00), Laptops (8471.30.00), ICs (8542.31.00), Medicaments (3004.90.00), ECG (9018.11.00)",
  extraction: {
    declaration_id: "demo-pkg-001",
    status: "extracted",
    confidence_avg: 0.88,
    entities: {
      hs_codes: ["6110.20.00", "8471.30.00", "8542.31.00", "3004.90.00", "9018.11.00"],
      container_numbers: [],
      weights: [400.0, 225.0, 25.0, 180.0, 350.0],
      quantities: [2000, 150, 5000, 1000, 50],
      dates: [],
      invoice_numbers: [],
      total_values: [30000.0, 138000.0, 42500.0, 45000.0, 160000.0],
      countries: ["China", "China", "Taiwan", "India", "Germany"],
      commodity_descriptions: [
        "Cotton knitted pullovers",
        "Portable digital computers <=10kg",
        "Electronic integrated circuits",
        "Medicaments in measured doses",
        "Electrocardiographs",
      ],
    },
    confidence_scores: {
      hs_codes: 0.92,
      containers: 0.5,
      weights: 0.9,
      dates: 0.5,
      invoice_numbers: 0.5,
      overall: 0.88,
    },
    needs_review: false,
    classification: {
      doc_type: "packing_list",
      confidence: 0.9,
      method: "deterministic",
      signals: ["seeded_demo"],
    },
    commodities: [
      {
        id: uid(),
        description: "Cotton knitted pullovers",
        hs_code: "6110.20.00",
        hs_code_confidence: 0.89,
        quantity: 2000,
        unit: "pcs",
        declared_value: 30000,
        weight: 400,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Portable digital computers <=10kg",
        hs_code: "8471.30.00",
        hs_code_confidence: 0.95,
        quantity: 150,
        unit: "units",
        declared_value: 138000,
        weight: 225,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Electronic integrated circuits",
        hs_code: "8542.31.00",
        hs_code_confidence: 0.91,
        quantity: 5000,
        unit: "units",
        declared_value: 42500,
        weight: 25,
        country_of_origin: "Taiwan",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Medicaments in measured doses",
        hs_code: "3004.90.00",
        hs_code_confidence: 0.87,
        quantity: 1000,
        unit: "bottles",
        declared_value: 45000,
        weight: 180,
        country_of_origin: "India",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Electrocardiographs",
        hs_code: "9018.11.00",
        hs_code_confidence: 0.85,
        quantity: 50,
        unit: "units",
        declared_value: 160000,
        weight: 350,
        country_of_origin: "Germany",
        reviewed: false,
      },
    ],
    labeled_fields: {
      consignor_name: "",
      consignee_name: "",
      port_of_loading: "",
      port_of_discharge: "",
    },
  },
};

const WECHAT_DOC: DemoDoc = {
  id: "wechat",
  label: "WeChat Screenshot",
  desc: "OCR text: messy Chinese cargo manifest",
  fileType: "OCR",
  viewerType: "ocr",
  href: "/data/mock/wechat-scan.txt",
  preview:
    "东莞华强电子 → 香港捷运物流  |  HS: 85423100  |  USD ~85,000  |  OCR confidence: 78%",
  extraction: {
    declaration_id: "demo-wct-001",
    status: "extracted",
    confidence_avg: 0.72,
    entities: {
      hs_codes: ["8542.31.00"],
      container_numbers: ["OOLU8125479"],
      weights: [250.0, 180.0],
      quantities: [500, 200],
      dates: ["2026-07-14"],
      invoice_numbers: [],
      total_values: [85000.0],
      countries: ["China"],
      commodity_descriptions: [
        "电子元器件 Electronic components",
        "LED 显示屏 LED display screens",
      ],
    },
    confidence_scores: {
      hs_codes: 0.78,
      containers: 0.82,
      weights: 0.65,
      dates: 0.72,
      invoice_numbers: 0.3,
      overall: 0.72,
    },
    needs_review: true,
    classification: {
      doc_type: "receipt",
      confidence: 0.82,
      method: "deterministic",
      signals: ["seeded_demo"],
    },
    commodities: [
      {
        id: uid(),
        description: "电子元器件 Electronic components",
        hs_code: "8542.31.00",
        hs_code_confidence: 0.78,
        quantity: 500,
        unit: "箱 cases",
        declared_value: 0,
        weight: 250,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "LED 显示屏 LED display screens",
        hs_code: "",
        hs_code_confidence: 0,
        quantity: 200,
        unit: "箱 cases",
        declared_value: 0,
        weight: 180,
        country_of_origin: "China",
        reviewed: false,
      },
    ],
    labeled_fields: {
      consignor_name: "东莞华强电子",
      consignee_name: "香港捷运物流",
      port_of_loading: "",
      port_of_discharge: "香港 → 转口 越南",
      container_number: "OOLU8125479",
      total_value: 85000,
    },
  },
};

const PDF_INVOICE_DOC: DemoDoc = {
  id: "invoice-pdf",
  label: "Invoice (PDF)",
  desc: "Same trade invoice via native PDF parsing",
  fileType: "PDF",
  viewerType: "pdf",
  href: "/data/mock/invoice-sample.pdf",
  preview:
    "Scanned PDF invoice  |  INV-2026-0715-0042  |  3 commodities  |  HS codes: 8471.30.00, 8523.51.00, 8542.31.00",
  extraction: {
    declaration_id: "demo-pdf-001",
    status: "extracted",
    confidence_avg: 0.93,
    entities: {
      hs_codes: ["8471.30.00", "8523.51.00", "8542.31.00"],
      container_numbers: ["MSCU4820137"],
      weights: [750.0, 120.0, 45.0],
      quantities: [500, 1000, 10000],
      dates: ["2026-07-15"],
      invoice_numbers: ["INV-2026-0715-0042"],
      total_values: [425000.0, 89000.0, 125000.0],
      countries: ["China", "China", "Taiwan"],
      commodity_descriptions: [
        "Portable laptop computers, Lenovo ThinkPad X1",
        "Solid-state storage drives, 1TB NVMe",
        "Electronic integrated circuits, processor controllers",
      ],
    },
    confidence_scores: {
      hs_codes: 0.96,
      containers: 0.95,
      weights: 0.94,
      dates: 0.97,
      invoice_numbers: 0.98,
      overall: 0.93,
    },
    needs_review: false,
    classification: {
      doc_type: "commercial_invoice",
      confidence: 0.91,
      method: "deterministic",
      signals: ["seeded_demo"],
    },
    commodities: [
      {
        id: uid(),
        description: "Portable laptop computers, Lenovo ThinkPad X1",
        hs_code: "8471.30.00",
        hs_code_confidence: 0.96,
        quantity: 500,
        unit: "units",
        declared_value: 425000,
        weight: 750,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Solid-state storage drives, 1TB NVMe",
        hs_code: "8523.51.00",
        hs_code_confidence: 0.95,
        quantity: 1000,
        unit: "units",
        declared_value: 89000,
        weight: 120,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Electronic integrated circuits, processor controllers",
        hs_code: "8542.31.00",
        hs_code_confidence: 0.94,
        quantity: 10000,
        unit: "units",
        declared_value: 125000,
        weight: 45,
        country_of_origin: "Taiwan",
        reviewed: false,
      },
    ],
    labeled_fields: {
      consignor_name: "Shenzhen Electronics Trading Co., Ltd.",
      consignee_name: "HK Digital Logistics Ltd.",
      port_of_loading: "Yantian, Shenzhen",
      port_of_discharge: "Hong Kong",
      incoterms: "CIF",
      container_number: "MSCU4820137",
      total_value: 639000,
      gross_weight: 915,
      net_weight: 832,
      number_of_packages: 28,
    },
  },
};

const BORDERLESS_DOC: DemoDoc = {
  id: "borderless",
  label: "Borderless Packing List",
  desc: "PDF: no borders, messy layout, no HS codes",
  fileType: "PDF",
  viewerType: "pdf",
  href: "/data/mock/borderless-table.pdf",
  preview:
    "Dongguan Precision Parts  |  5 items, no HS codes  |  Totals: 662.5 kg  |  Needs review",
  extraction: {
    declaration_id: "demo-bdr-001",
    status: "extracted",
    confidence_avg: 0.45,
    entities: {
      hs_codes: [],
      container_numbers: [],
      weights: [450.0, 22.5, 18.0, 160.0, 12.0],
      quantities: [2000, 10000, 5000, 800, 3000],
      dates: [],
      invoice_numbers: [],
      total_values: [],
      countries: [],
      commodity_descriptions: [
        "Aluminium casings for tablets",
        "Stainless steel screws M3x12",
        "Rubber gaskets 50x30mm",
        "LED backlight strips 55 inch",
        "Flex PCB connectors",
      ],
    },
    confidence_scores: {
      hs_codes: 0.15,
      containers: 0.1,
      weights: 0.72,
      dates: 0.1,
      invoice_numbers: 0.1,
      overall: 0.45,
    },
    needs_review: true,
    classification: {
      doc_type: "packing_list",
      confidence: 0.88,
      method: "deterministic",
      signals: ["seeded_demo"],
    },
    commodities: [
      {
        id: uid(),
        description: "Aluminium casings for tablets",
        hs_code: "",
        hs_code_confidence: 0,
        quantity: 2000,
        unit: "pcs",
        declared_value: 0,
        weight: 450,
        country_of_origin: "",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Stainless steel screws M3x12",
        hs_code: "",
        hs_code_confidence: 0,
        quantity: 10000,
        unit: "pcs",
        declared_value: 0,
        weight: 22.5,
        country_of_origin: "",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Rubber gaskets 50x30mm",
        hs_code: "",
        hs_code_confidence: 0,
        quantity: 5000,
        unit: "pcs",
        declared_value: 0,
        weight: 18,
        country_of_origin: "",
        reviewed: false,
      },
      {
        id: uid(),
        description: "LED backlight strips 55 inch",
        hs_code: "",
        hs_code_confidence: 0,
        quantity: 800,
        unit: "units",
        declared_value: 0,
        weight: 160,
        country_of_origin: "",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Flex PCB connectors",
        hs_code: "",
        hs_code_confidence: 0,
        quantity: 3000,
        unit: "pcs",
        declared_value: 0,
        weight: 12,
        country_of_origin: "",
        reviewed: false,
      },
    ],
    labeled_fields: {
      consignor_name: "Dongguan Precision Parts Ltd.",
      consignee_name: "HK Trading Co.",
      total_value: 0,
      gross_weight: 662.5,
    },
  },
};

const XLSX_DOC: DemoDoc = {
  id: "xlsx",
  label: "Excel Invoice",
  desc: "XLSX: 3 commodity lines with HS codes",
  fileType: "XLSX",
  viewerType: "table",
  href: "/data/mock/invoice.xlsx",
  preview:
    "INV-2026-0715-0099  |  Guangzhou Tech Parts → Macau  |  HS: 8507.60.00, 8501.40.00, 8803.90.00  |  USD 167,000",
  extraction: {
    declaration_id: "demo-xls-001",
    status: "extracted",
    confidence_avg: 0.89,
    entities: {
      hs_codes: ["8507.60.00", "8501.40.00", "8803.90.00"],
      container_numbers: ["MSCU9032741"],
      weights: [750.0, 320.0, 40.0],
      quantities: [500, 200, 2000],
      dates: ["2026-07-15"],
      invoice_numbers: ["INV-2026-0715-0099"],
      total_values: [60000.0, 90000.0, 17000.0],
      countries: ["China", "China", "China"],
      commodity_descriptions: [
        "Lithium-ion battery packs 48V/20Ah",
        "Electric motors for drones, 1000W",
        "Carbon fiber propellers 15 inch",
      ],
    },
    confidence_scores: {
      hs_codes: 0.93,
      containers: 0.95,
      weights: 0.88,
      dates: 0.96,
      invoice_numbers: 0.97,
      overall: 0.89,
    },
    needs_review: false,
    classification: {
      doc_type: "commercial_invoice",
      confidence: 0.92,
      method: "deterministic",
      signals: ["seeded_demo"],
    },
    commodities: [
      {
        id: uid(),
        description: "Lithium-ion battery packs 48V/20Ah",
        hs_code: "8507.60.00",
        hs_code_confidence: 0.93,
        quantity: 500,
        unit: "units",
        declared_value: 60000,
        weight: 750,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Electric motors for drones, 1000W",
        hs_code: "8501.40.00",
        hs_code_confidence: 0.91,
        quantity: 200,
        unit: "units",
        declared_value: 90000,
        weight: 320,
        country_of_origin: "China",
        reviewed: false,
      },
      {
        id: uid(),
        description: "Carbon fiber propellers 15 inch",
        hs_code: "8803.90.00",
        hs_code_confidence: 0.89,
        quantity: 2000,
        unit: "pcs",
        declared_value: 17000,
        weight: 40,
        country_of_origin: "China",
        reviewed: false,
      },
    ],
    labeled_fields: {
      consignor_name: "Guangzhou Tech Parts Co.",
      consignee_name: "Macau Logistics Ltd.",
      port_of_loading: "Nansha, Guangzhou",
      port_of_discharge: "Macau",
      incoterms: "CIF",
      container_number: "MSCU9032741",
      total_value: 167000,
      gross_weight: 1110,
    },
  },
};

export const DEMO_DOCS: DemoDoc[] = [
  INVOICE_DOC,
  PACKING_DOC,
  WECHAT_DOC,
  PDF_INVOICE_DOC,
  BORDERLESS_DOC,
  XLSX_DOC,
];

export function generateDemoTswReference(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "0123456789";
  let ref = "TSW-DEMO-";
  for (let i = 0; i < 4; i++) ref += letters[Math.floor(Math.random() * letters.length)];
  ref += "-";
  for (let i = 0; i < 6; i++) ref += nums[Math.floor(Math.random() * nums.length)];
  return ref;
}

export function buildWcoJson(extraction: DemoExtraction): Record<string, unknown> {
  const lf = extraction.labeled_fields || {};
  return {
    declaration: {
      declaration_number: extraction.declaration_id,
      declaration_type: "EXPORT",
      declarant_reference: extraction.entities.invoice_numbers?.[0] || "",
      declaration_date: extraction.entities.dates?.[0] || "",
      consignor: {
        name: (lf.consignor_name as string) || "",
      },
      consignee: {
        name: (lf.consignee_name as string) || "",
      },
      transport: {
        mode: "Sea",
        container_number: extraction.entities.container_numbers?.[0] || "",
        port_of_loading: (lf.port_of_loading as string) || "",
        port_of_discharge: (lf.port_of_discharge as string) || "",
      },
      total_gross_weight: {
        value: (lf.gross_weight as number) || 0,
        unit: "kg",
      },
      total_net_weight: {
        value: (lf.net_weight as number) || 0,
        unit: "kg",
      },
      total_declared_value: {
        value: (lf.total_value as number) || 0,
        currency: (lf.currency as string) || "USD",
      },
      incoterms: (lf.incoterms as string) || "",
      number_of_packages: (lf.number_of_packages as number) || 0,
      items: extraction.commodities.map((c) => ({
        item_number: extraction.commodities.indexOf(c) + 1,
        description: c.description,
        hs_code: c.hs_code || "",
        quantity: c.quantity,
        unit: c.unit,
        declared_value: c.declared_value,
        weight: c.weight,
        country_of_origin: c.country_of_origin,
      })),
    },
  };
}

export function buildTswJson(extraction: DemoExtraction): Record<string, unknown> {
  return {
    submission: {
      submission_reference: extraction.declaration_id,
      submission_type: "TSW_PHASE_3",
      submitted_at: new Date().toISOString(),
      source: "Enosis UDIE Demo",
    },
    declaration: buildWcoJson(extraction).declaration,
  };
}

export function getXlsxTablePreview(): string[][] {
  return [
    ["Item", "Description", "HS Code", "Quantity", "Unit", "Unit Price USD", "Total USD", "Weight kg"],
    ["1", "Lithium-ion battery packs 48V/20Ah", "8507.60.00", "500", "units", "120", "60000", "750"],
    ["2", "Electric motors for drones, 1000W", "8501.40.00", "200", "units", "450", "90000", "320"],
    ["3", "Carbon fiber propellers 15 inch", "8803.90.00", "2000", "pcs", "8.5", "17000", "40"],
  ];
}
