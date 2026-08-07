"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  FileText,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  Download,
  SealCheck,
  FloppyDisk,
  XCircle,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import {
  api,
  type Declaration,
  type ExtractionResult,
  type Commodity,
  type CommodityUpdate,
} from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import ConfidenceExplainer from "@/components/confidence-explainer";

const CONFIDENCE_THRESHOLD = 0.95;

type EditableHeader = {
  consignor_name: string;
  consignee_name: string;
  port_of_loading: string;
  port_of_discharge: string;
  incoterms: string;
  container_number: string;
  total_declared_value: string;
  gross_weight: string;
  net_weight: string;
  number_of_packages: string;
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [doc, setDoc] = useState<Declaration | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState("wco_json");
  const [exportResult, setExportResult] = useState<any>(null);

  const [header, setHeader] = useState<EditableHeader>({
    consignor_name: "",
    consignee_name: "",
    port_of_loading: "",
    port_of_discharge: "",
    incoterms: "",
    container_number: "",
    total_declared_value: "",
    gross_weight: "",
    net_weight: "",
    number_of_packages: "",
  });
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [headerDirty, setHeaderDirty] = useState(false);
  const [commodityDirty, setCommodityDirty] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingCommodities, setSavingCommodities] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  useEffect(() => {
    async function load() {
      try {
        const d = await api.getDocument(id);
        setDoc(d);
        setCommodities(d.commodities || []);
        setHeader({
          consignor_name: d.consignor_name || "",
          consignee_name: d.consignee_name || "",
          port_of_loading: d.port_of_loading || "",
          port_of_discharge: d.port_of_discharge || "",
          incoterms: d.incoterms || "",
          container_number: d.container_number || "",
          total_declared_value: d.total_declared_value?.toString() || "",
          gross_weight: d.gross_weight?.toString() || "",
          net_weight: d.net_weight?.toString() || "",
          number_of_packages: d.number_of_packages?.toString() || "",
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleProcess = useCallback(async () => {
    setProcessing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.processDocument(id);
      setExtraction(res);
      setCommodities(res.commodities || []);
      setDoc((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          status: res.status,
          confidence_avg: res.confidence_avg,
        };
        if (res.labeled_fields) {
          const lf = res.labeled_fields as Record<string, any>;
          updated.consignor_name = lf.consignor_name || prev.consignor_name;
          updated.consignee_name = lf.consignee_name || prev.consignee_name;
          updated.port_of_loading = lf.port_of_loading || prev.port_of_loading;
          updated.port_of_discharge =
            lf.port_of_discharge || prev.port_of_discharge;
          updated.incoterms = lf.incoterms || prev.incoterms;
          updated.container_number =
            lf.container_number || prev.container_number;
          updated.total_declared_value =
            lf.total_value || prev.total_declared_value;
          updated.gross_weight = lf.gross_weight || prev.gross_weight;
          updated.net_weight = lf.net_weight || prev.net_weight;
          updated.number_of_packages =
            lf.number_of_packages || prev.number_of_packages;
        }
        return updated;
      });
      setHeader((prev) => ({
        consignor_name:
          (res.labeled_fields as any)?.consignor_name || prev.consignor_name,
        consignee_name:
          (res.labeled_fields as any)?.consignee_name || prev.consignee_name,
        port_of_loading:
          (res.labeled_fields as any)?.port_of_loading || prev.port_of_loading,
        port_of_discharge:
          (res.labeled_fields as any)?.port_of_discharge ||
          prev.port_of_discharge,
        incoterms: (res.labeled_fields as any)?.incoterms || prev.incoterms,
        container_number:
          (res.labeled_fields as any)?.container_number ||
          prev.container_number,
        total_declared_value:
          (res.labeled_fields as any)?.total_value?.toString() ||
          prev.total_declared_value,
        gross_weight:
          (res.labeled_fields as any)?.gross_weight?.toString() ||
          prev.gross_weight,
        net_weight:
          (res.labeled_fields as any)?.net_weight?.toString() ||
          prev.net_weight,
        number_of_packages:
          (res.labeled_fields as any)?.number_of_packages?.toString() ||
          prev.number_of_packages,
      }));
      setSuccess(`Extracted ${res.commodities.length} commodity items`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [id]);

  const handleSaveHeader = useCallback(async () => {
    setSavingHeader(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      const numFields = [
        "total_declared_value",
        "gross_weight",
        "net_weight",
        "number_of_packages",
      ];
      for (const [key, val] of Object.entries(header)) {
        if (numFields.includes(key)) {
          payload[key] = val ? parseFloat(val.replace(/,/g, "")) : null;
        } else {
          payload[key] = val || null;
        }
      }
      await api.updateDocument(id, payload);
      setHeaderDirty(false);
      setSuccess("Header fields saved");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingHeader(false);
    }
  }, [id, header]);

  const handleSaveCommodities = useCallback(async () => {
    setSavingCommodities(true);
    setError(null);
    try {
      const updates: CommodityUpdate[] = commodities.map((c) => ({
        id: c.id,
        hs_code: c.hs_code || undefined,
        description: c.description || undefined,
        quantity: c.quantity ?? undefined,
        unit: c.unit || undefined,
        declared_value: c.declared_value ?? undefined,
        weight: c.weight ?? undefined,
        country_of_origin: c.country_of_origin || undefined,
      }));
      await api.updateCommodities(updates);
      setCommodityDirty(false);
      setCommodities((prev) => prev.map((c) => ({ ...c, reviewed: true })));
      setSuccess("Commodities saved");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingCommodities(false);
    }
  }, [commodities]);

  const updateCommodity = (idx: number, field: keyof Commodity, value: any) => {
    setCommodities((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    setCommodityDirty(true);
  };

  const handleApprove = useCallback(async () => {
    setSubmitting(true);
    try {
      await api.approveDocument(id);
      setDoc((prev) => (prev ? { ...prev, status: "reviewed" } : prev));
      setSuccess("Document approved and marked as reviewed");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [id]);

  const handleExport = useCallback(async () => {
    try {
      const res = await api.exportDocument(id, exportFormat);
      setExportResult(res);
      const ext = res.export;
      const blob = new Blob(
        [typeof ext === "string" ? ext : JSON.stringify(ext, null, 2)],
        {
          type:
            exportFormat === "wco_xml" ? "application/xml" : "application/json",
        },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extName = exportFormat === "wco_xml" ? "xml" : "json";
      a.download = `declaration-${id.slice(0, 8)}-${exportFormat}.${extName}`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`${exportFormat.toUpperCase()} exported successfully`);
    } catch (err: any) {
      setError(err.message);
    }
  }, [id, exportFormat]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await api.submitToTsw(id);
      setDoc((prev) => (prev ? { ...prev, status: "submitted" } : prev));
      setExportResult({
        tsw_reference: res.tsw_reference,
        submission_id: res.submission_id,
      });
      setSuccess(`Submitted to Mock TSW, Ref: ${res.tsw_reference}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [id]);

  const fieldStatus = (score: number) => {
    if (score <= 0.05)
      return {
        label: "Not detected",
        color: "text-muted",
        bg: "bg-line/30",
        icon: WarningCircle,
      };
    if (score >= CONFIDENCE_THRESHOLD)
      return {
        label: "Auto-approved",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: CheckCircle,
      };
    return {
      label: "Review required",
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: WarningCircle,
    };
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      submitted: "bg-emerald-100 text-emerald-700",
      reviewed: "bg-accent-soft text-accent",
      extracted: "bg-amber-100 text-amber-700",
      processing: "bg-amber-100 text-amber-700",
      uploaded: "bg-accent-soft text-muted",
    };
    return map[status] || "bg-accent-soft text-muted";
  };

  const fadeUp = (delay = 0) => ({
    initial: reduce ? false : ({ opacity: 0, y: 12 } as const),
    animate: { opacity: 1, y: 0 } as const,
    transition: {
      duration: 0.4,
      delay,
      ease: [0.16, 1, 0.3, 1] as const,
    } as const,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-accent-soft animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <XCircle weight="bold" className="mx-auto h-8 w-8 text-red-400 mb-2" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const isEditable =
    doc?.status === "extracted" || doc?.status === "processing";
  const isReviewable = doc?.status === "extracted";
  const isPostReview =
    doc?.status === "reviewed" || doc?.status === "submitted";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <motion.div {...fadeUp()} className="mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.1em] text-accent mb-2">
          Document Review
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink font-display">
          {doc?.filename || "Trade Document"}
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <span
            className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${statusBadge(doc?.status || "")}`}
          >
            {doc?.status}
          </span>
          {doc?.confidence_avg != null && (
            <span className="text-sm text-muted">
              Avg confidence: {(doc.confidence_avg * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </motion.div>

      {/* Run Extraction CTA */}
      {doc?.status === "processing" && (
        <motion.div
          {...fadeUp(0.05)}
          className="mb-8 rounded-xl border border-accent bg-accent-soft p-8 text-center"
        >
          <p className="text-sm text-ink mb-4">
            This document has been uploaded but not yet processed. Run
            extraction to parse trade data.
          </p>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition hover:bg-ink/80 active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <ArrowRight weight="bold" className="h-4 w-4" />
                Run Extraction
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Declaration Info Card - Editable */}
      {doc && (
        <motion.div
          {...fadeUp(0.05)}
          className="rounded-xl border border-line bg-surface p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText weight="bold" className="h-5 w-5 text-muted" />
              <h2 className="text-sm font-semibold text-ink">
                Declaration Info
              </h2>
            </div>
            {isEditable && (
              <button
                onClick={handleSaveHeader}
                disabled={savingHeader || !headerDirty}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-medium text-surface transition hover:bg-ink/80 disabled:opacity-30"
              >
                <FloppyDisk weight="bold" className="h-3.5 w-3.5" />
                {savingHeader ? "Saving..." : "Save"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            {(
              [
                ["consignor_name", "Consignor"],
                ["consignee_name", "Consignee"],
                ["port_of_loading", "Port of Loading"],
                ["port_of_discharge", "Port of Discharge"],
                ["incoterms", "Incoterms"],
                ["container_number", "Container"],
                ["total_declared_value", "Total Value"],
                ["gross_weight", "Gross Weight"],
                ["net_weight", "Net Weight"],
                ["number_of_packages", "Packages"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <dt className="text-muted text-xs mb-0.5">{label}</dt>
                {isEditable ? (
                  <input
                    type="text"
                    value={(header as any)[key] ?? ""}
                    onChange={(e) => {
                      setHeader((prev) => ({ ...prev, [key]: e.target.value }));
                      setHeaderDirty(true);
                    }}
                    className="w-full rounded-lg border border-line bg-accent-soft/30 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent focus:bg-surface"
                  />
                ) : (
                  <dd className="text-ink">
                    {String((doc as any)[key] ?? "Not provided")}
                  </dd>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Commodities Table */}
      {commodities.length > 0 && (
        <motion.div
          {...fadeUp(0.1)}
          className="rounded-xl border border-line bg-surface p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">
              Commodities ({commodities.length})
            </h2>
            {isEditable && (
              <button
                onClick={handleSaveCommodities}
                disabled={savingCommodities || !commodityDirty}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-medium text-surface transition hover:bg-ink/80 disabled:opacity-30"
              >
                <FloppyDisk weight="bold" className="h-3.5 w-3.5" />
                {savingCommodities ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium text-muted uppercase tracking-wider">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-2 min-w-[180px]">Description</th>
                  <th className="pb-2 pr-2">HS Code</th>
                  <th className="pb-2 pr-2 text-right">Qty</th>
                  <th className="pb-2 pr-2">Unit</th>
                  <th className="pb-2 pr-2 text-right">Value</th>
                  <th className="pb-2 pr-2 text-right">Weight</th>
                  <th className="pb-2 pr-2">Origin</th>
                  <th className="pb-2 pr-2">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {commodities.map((c, i) => (
                  <tr key={c.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-2 text-muted font-mono text-xs">
                      {i + 1}
                    </td>
                    <td className="py-2 pr-2">
                      {isEditable ? (
                        <input
                          type="text"
                          value={c.description || ""}
                          onChange={(e) =>
                            updateCommodity(i, "description", e.target.value)
                          }
                          className="w-full rounded-lg border border-line bg-accent-soft/20 px-2 py-1 text-xs outline-none focus:border-accent focus:bg-surface"
                        />
                      ) : (
                        <span className="text-ink">{c.description || "Not provided"}</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {isEditable ? (
                        <input
                          type="text"
                          value={c.hs_code || ""}
                          onChange={(e) =>
                            updateCommodity(i, "hs_code", e.target.value)
                          }
                          className="w-28 rounded-lg border border-line bg-accent-soft/20 px-2 py-1 font-mono text-xs outline-none focus:border-accent focus:bg-surface"
                        />
                      ) : (
                        <span className="font-mono text-xs text-ink">
                          {c.hs_code || "Not provided"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      {isEditable ? (
                        <input
                          type="text"
                          value={c.quantity ?? ""}
                          onChange={(e) =>
                            updateCommodity(
                              i,
                              "quantity",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          className="w-20 rounded-lg border border-line bg-accent-soft/20 px-2 py-1 text-right text-xs outline-none focus:border-accent focus:bg-surface"
                        />
                      ) : (
                        <span className="text-ink">{c.quantity ?? "Not provided"}</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {isEditable ? (
                        <input
                          type="text"
                          value={c.unit || ""}
                          onChange={(e) =>
                            updateCommodity(i, "unit", e.target.value)
                          }
                          className="w-14 rounded-lg border border-line bg-accent-soft/20 px-2 py-1 text-xs outline-none focus:border-accent focus:bg-surface"
                        />
                      ) : (
                        <span className="text-ink">{c.unit || "Not provided"}</span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      {isEditable ? (
                        <input
                          type="text"
                          value={c.declared_value ?? ""}
                          onChange={(e) =>
                            updateCommodity(
                              i,
                              "declared_value",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          className="w-24 rounded-lg border border-line bg-accent-soft/20 px-2 py-1 text-right text-xs outline-none focus:border-accent focus:bg-surface"
                        />
                      ) : (
                        <span className="text-ink">
                          {c.declared_value != null
                            ? `$${c.declared_value.toLocaleString()}`
                            : "Not provided"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      {isEditable ? (
                        <input
                          type="text"
                          value={c.weight ?? ""}
                          onChange={(e) =>
                            updateCommodity(
                              i,
                              "weight",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          className="w-20 rounded-lg border border-line bg-accent-soft/20 px-2 py-1 text-right text-xs outline-none focus:border-accent focus:bg-surface"
                        />
                      ) : (
                        <span className="text-ink">
                          {c.weight != null ? `${c.weight}kg` : "Not provided"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {isEditable ? (
                        <input
                          type="text"
                          value={c.country_of_origin || ""}
                          onChange={(e) =>
                            updateCommodity(
                              i,
                              "country_of_origin",
                              e.target.value,
                            )
                          }
                          className="w-10 rounded-lg border border-line bg-accent-soft/20 px-2 py-1 text-center text-xs uppercase outline-none focus:border-accent focus:bg-surface"
                        />
                      ) : (
                        <span className="font-mono text-xs text-ink">
                          {c.country_of_origin || "Not provided"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {c.hs_code_confidence != null ? (
                        <span
                          className={`text-xs font-medium ${c.hs_code_confidence >= CONFIDENCE_THRESHOLD ? "text-emerald-600" : "text-amber-600"}`}
                        >
                          {(c.hs_code_confidence * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Not provided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Confidence Scores */}
      {extraction && (
        <motion.div
          {...fadeUp(0.15)}
          className="rounded-xl border border-line bg-surface p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">
              Confidence Scores
            </h2>
            <span className="text-xs text-muted">
              Threshold: {(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%
            </span>
          </div>
          <div className="space-y-3 mb-4">
            {Object.entries(extraction.confidence_scores).map(([key, val]) => {
              const status = fieldStatus(val);
              return (
                <div key={key} className="flex items-center gap-3">
                  <status.icon
                    weight="bold"
                    className={`h-4 w-4 shrink-0 ${status.color}`}
                  />
                  <span className="text-sm w-28 capitalize text-ink">
                    {key.replace(/_/g, " ")}
                  </span>
                  {val > 0.05 ? (
                    <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          val >= CONFIDENCE_THRESHOLD
                            ? "bg-emerald-500"
                            : val >= 0.8
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${val * 100}%` }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 h-2 rounded-full bg-line/40" />
                  )}
                  <span
                    className={`text-sm w-16 text-right font-medium ${status.color}`}
                  >
                    {val > 0.05 ? `${(val * 100).toFixed(0)}%` : "Not provided"}
                  </span>
                  <span
                    className={`text-[11px] w-28 text-right ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>

          <ConfidenceExplainer
            scores={extraction.confidence_scores}
            showHeader={true}
          />
        </motion.div>
      )}

      {/* Actions */}
      {doc?.status !== "submitted" && (
        <motion.div
          {...fadeUp(0.2)}
          className="rounded-xl border border-line bg-surface p-6 mb-6"
        >
          <h2 className="text-sm font-semibold text-ink mb-4">Actions</h2>

          {/* Re-run extraction */}
          {doc?.status === "extracted" && (
            <div className="mb-4">
              <button
                onClick={handleProcess}
                disabled={processing}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-4 text-xs font-medium text-ink transition hover:bg-accent-soft active:scale-[0.98] disabled:opacity-50"
              >
                Re-run Extraction
              </button>
            </div>
          )}

          {/* Approve */}
          {doc?.status === "extracted" && (
            <div className="mb-4">
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
              >
                <SealCheck weight="bold" className="h-4 w-4" />
                {submitting ? "Approving..." : "Approve & Mark Reviewed"}
              </button>
            </div>
          )}

          {/* Export + Submit */}
          {(doc?.status === "reviewed" || doc?.status === "submitted") && (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="wco_json">WCO JSON</option>
                <option value="tsw_json">TSW JSON</option>
                <option value="wco_xml">WCO XML</option>
              </select>
              <button
                onClick={handleExport}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition hover:bg-ink/80 active:scale-[0.98]"
              >
                <Download weight="bold" className="h-4 w-4" />
                Export
              </button>
              {doc?.status === "reviewed" && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition hover:bg-ink/80 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit to TSW (Mock)"}
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Success / Error notifications */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700 flex items-center gap-2"
        >
          <CheckCircle weight="bold" className="h-4 w-4 shrink-0" />
          {success}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 flex items-center gap-2"
        >
          <WarningCircle weight="bold" className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Jonathan Simpson and Co: Data Pipeline CTA */}
      {(doc?.status === "extracted" ||
        doc?.status === "reviewed" ||
        doc?.status === "submitted") && (
        <motion.div
          {...fadeUp(0.25)}
          className="rounded-xl border border-line bg-surface p-5 mb-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted">
                Need to modify your AI &amp; data pipeline?
              </p>
              <p className="text-sm text-ink mt-0.5">
                <strong>Jonathan Simpson &amp; Co</strong> is tailoring Enosis
                to your trade workflows
              </p>
            </div>
            <a
              href="https://jonathansimpson.co/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition hover:bg-ink/80 active:scale-[0.98] shrink-0"
            >
              <ArrowSquareOut weight="bold" className="h-4 w-4" />
              Process the data and gain insight using AI
            </a>
          </div>
        </motion.div>
      )}

      {/* Export / Submit result panel */}
      {exportResult && exportResult.tsw_reference && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle weight="bold" className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Submitted to Mock TSW
              </p>
              <p className="text-xs text-emerald-600 font-mono">
                Reference: {exportResult.tsw_reference}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
