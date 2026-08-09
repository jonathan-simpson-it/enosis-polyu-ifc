"use client";

import { useMemo, useState } from "react";
import { Tag, WarningCircle, CheckCircle, SealCheck, FloppyDisk } from "@phosphor-icons/react";
import type { DocumentClassification } from "@/lib/api";
import { api } from "@/lib/api";
import { getDocTypeDefinition } from "@/lib/engine/registry";
import type { DocType } from "@/lib/engine/types";

const DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "commercial_invoice", label: "Commercial Invoice" },
  { value: "packing_list", label: "Packing List" },
  { value: "bill_of_lading", label: "Bill of Lading" },
  { value: "certificate_of_origin", label: "Certificate of Origin" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "customs_declaration", label: "Customs Declaration" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "receipt", label: "Receipt / Transfer Note" },
  { value: "other", label: "Unrecognized Document" },
];

const STANDARD_LABELS: Record<string, string> = {
  "WCO Data Model v3.11": "WCO v3.11",
  "HK TSW Phase 3 JSON": "TSW Phase 3",
};

export default function DocumentTypeCard({
  documentId,
  docType,
  classification,
  editable,
  onChanged,
}: {
  documentId: string;
  docType: string | null | undefined;
  classification: DocumentClassification | null | undefined;
  editable: boolean;
  onChanged?: () => void;
}) {
  const [selected, setSelected] = useState(docType || "other");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conf = classification?.confidence ?? null;
  const overridden = classification?.overridden ?? false;
  const cleanType = docType || "other";
  const label =
    DOC_TYPE_OPTIONS.find((o) => o.value === cleanType)?.label || "Unrecognized Document";

  const standards = useMemo(() => {
    if (cleanType === "other") return [];
    return getDocTypeDefinition(cleanType as DocType).target_standards.map(
      (s) => STANDARD_LABELS[s] || s,
    );
  }, [cleanType]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateDocument(documentId, { doc_type: selected });
      onChanged?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update document type");
    } finally {
      setSaving(false);
    }
  };

  const lowConfidence = conf !== null && conf < 0.6 && !overridden;

  return (
    <div className="rounded-xl border border-line bg-surface p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag weight="bold" className="h-5 w-5 text-accent" />
          <h2 className="text-sm font-semibold text-ink">Document Type</h2>
          {overridden && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
              <SealCheck weight="bold" className="h-2.5 w-2.5" />
              Human confirmed
            </span>
          )}
        </div>
        {editable && (
          <div className="flex items-center gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs outline-none focus:border-accent"
            >
              {DOC_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={saving || selected === cleanType}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-medium text-surface transition hover:bg-ink/80 disabled:opacity-30"
            >
              <FloppyDisk weight="bold" className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Confirm"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              cleanType === "other"
                ? "bg-amber-100 text-amber-700"
                : "bg-accent-soft text-ink"
            }`}
          >
            {lowConfidence ? (
              <WarningCircle weight="bold" className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle weight="bold" className="h-3.5 w-3.5 text-emerald-600" />
            )}
            {label}
          </span>
          {conf !== null && (
            <span className="text-xs text-muted tabular-nums">
              {conf >= 0.97 && !overridden
                ? "Auto-approved"
                : `${Math.round(conf * 100)}% confidence`}
            </span>
          )}
        </div>

        {standards.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
            <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted">
              Structured into
            </span>
            {standards.map((s) => (
              <span
                key={s}
                className="rounded-full border border-line bg-accent-soft/40 px-2.5 py-0.5 text-[11px] font-medium text-ink"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {lowConfidence && !editable && (
        <p className="mt-3 text-xs text-amber-600">
          Low classification confidence — the export target may not match this document.
        </p>
      )}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
