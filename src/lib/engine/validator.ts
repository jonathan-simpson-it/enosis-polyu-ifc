const HS_CODE_FORMAT = /^\d{4}\.\d{2}(\.\d{2,4})?$/;

export function validateHsCodeFormat(code: string): boolean {
  return HS_CODE_FORMAT.test(code);
}

export function validateCommodity(commodity: {
  hs_code?: string;
  declared_value?: number | null;
  weight?: number | null;
  quantity?: number | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const hsCode = commodity.hs_code || "";
  if (hsCode && !validateHsCodeFormat(hsCode)) {
    errors.push(`Invalid HS code format: ${hsCode}`);
  }
  const value = commodity.declared_value ?? 0;
  if (value < 0) errors.push("Declared value cannot be negative");
  const weight = commodity.weight ?? 0;
  if (weight < 0) errors.push("Weight cannot be negative");
  const quantity = commodity.quantity ?? 0;
  if (quantity < 0) errors.push("Quantity cannot be negative");

  return { valid: errors.length === 0, errors };
}

export function validateDeclaration(
  declaration: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const decl = (declaration.declaration || {}) as Record<string, unknown>;

  if (!decl.Declaration) errors.push("Missing Declaration header");

  const shipment = (decl.GoodsShipment || {}) as Record<string, unknown>;
  const goodsItems = ((shipment.GovernmentAgencyGoodsItem || []) as Record<string, unknown>[]);

  if (!goodsItems.length) errors.push("No goods items in declaration");

  const seenHs = new Set<string>();
  for (const item of goodsItems) {
    const commodity = (item.Commodity || {}) as Record<string, unknown>;
    const classifications = (commodity.Classification || []) as { ID?: string }[];
    for (const cls of classifications) {
      const code = cls.ID || "";
      if (seenHs.has(code)) errors.push(`Duplicate HS code: ${code}`);
      seenHs.add(code);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateTswReady(
  declaration: Record<string, unknown>
): { valid: boolean; errors: string[]; confidence: number } {
  const allErrors: string[] = [];

  const declValidation = validateDeclaration(declaration);
  allErrors.push(...declValidation.errors);

  const decl = (declaration.declaration || {}) as Record<string, unknown>;
  const shipment = (decl.GoodsShipment || {}) as Record<string, unknown>;
  const goodsItems = ((shipment.GovernmentAgencyGoodsItem || []) as Record<string, unknown>[]);

  for (const item of goodsItems) {
    const commodity = (item.Commodity || {}) as Record<string, unknown>;
    const classifications = (commodity.Classification || []) as { ID?: string }[];
    const goodsMeasure = (item.GoodsMeasure || {}) as Record<string, unknown>;
    const value = (goodsMeasure.CustomsValueAmount || {}) as Record<string, unknown>;
    const weight = (goodsMeasure.NetNetWeightMeasure || {}) as Record<string, unknown>;

    const cv = validateCommodity({
      hs_code: classifications[0]?.ID || "",
      declared_value: typeof value.Value === "number" ? value.Value : null,
      weight: typeof weight.Value === "number" ? weight.Value : null,
    });
    allErrors.push(...cv.errors);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    confidence: Math.max(0, 1 - allErrors.length * 0.1),
  };
}
