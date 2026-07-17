"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  FileText,
  ArrowRight,
  CheckCircle,
  WarningCircle,
  Download,
  Cube,
  MagnifyingGlass,
  Gear,
  SealCheck,
  Database,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";

const SAMPLE_FILES = [
  {
    id: "invoice",
    label: "Trade Invoice",
    desc: "PDF extract: HS codes, weights, containers",
    preview: "INV-2026-0715-0042  |  Lenovo ThinkPad X1  |  HS: 8471.30.00  |  USD 639,000.00",
  },
  {
    id: "packing",
    label: "Packing List",
    desc: "CSV: 5 commodity lines with HS codes",
    preview: "6110.20.00 Cotton pullovers  |  8471.30.00 Laptops  |  9018.11.00 ECG",
  },
  {
    id: "wechat",
    label: "WeChat Screenshot",
    desc: "OCR text: messy Chinese cargo manifest",
    preview: "东莞华强电子 → 香港捷运物流  |  HS: 85423100  |  USD ~85,000",
  },
];

const CORE_TECH = [
  { id: "docformer", name: "DocFormer-Trade", desc: "Layout-aware multi-modal model", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "hierarchical", name: "HierarchicalHS", desc: "Deep taxonomy HS code mapping", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "uncertainty", name: "UncertaintyGuard", desc: "Conformal prediction p<0.05", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "metaschema", name: "MetaSchema", desc: "Zero-shot schema transfer", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "tradebench", name: "TradeBench", desc: "Multi-vertical benchmark", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const MOCK_EXTRACTION = {
  declaration_id: "demo-mock-0001",
  status: "extracted",
  confidence_avg: 0.84,
  entities: {
    hs_codes: ["8471.30.00", "8523.51.00", "8542.31.00", "6110.20.00"],
    container_numbers: ["MSCU4820137", "OOLU8125479"],
    weights: [915.0, 120.0, 45.0, 400.0],
    quantities: [500, 1000, 10000, 2000],
    dates: ["2026-07-15", "2026-07-14"],
    invoice_numbers: ["INV-2026-0715-0042"],
    total_values: [639000.0, 89000.0, 125000.0, 30000.0],
  },
  confidence_scores: {
    hs_codes: 0.94,
    containers: 0.88,
    weights: 0.92,
    dates: 0.96,
    invoice_numbers: 0.97,
    overall: 0.84,
  },
  needs_review: true,
};

const STEPS = [
  { num: 1, label: "Unstructured Intake" },
  { num: 2, label: "Enosis Engine" },
  { num: 3, label: "Verification API" },
  { num: 4, label: "Structured Export" },
];

export default function DemoPage() {
  const reduce = useReducedMotion();

  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<typeof SAMPLE_FILES[0] | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extraction, setExtraction] = useState<any>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleProcess = useCallback(async () => {
    if (!selectedFile) return;
    setProcessing(true);
    setError(null);
    setStep(2);

    if (offlineMode) {
      setTimeout(() => {
        setExtraction(MOCK_EXTRACTION);
        setStep(4);
        setProcessing(false);
      }, 1000);
      return;
    }

    try {
      const blob = await fetch(`/data/mock/${selectedFile.id === "wechat" ? "wechat-scan.txt" : selectedFile.id === "packing" ? "packing-list.csv" : "invoice-sample.txt"}`).then((r) => {
        if (!r.ok) throw new Error(`File not found (${r.status})`);
        return r.blob();
      });

      const file = new File([blob], `${selectedFile.label.replace(/\s/g, "_")}.txt`, {
        type: "text/plain",
      });

      const upload = await api.uploadDocument(file);
      setStep(3);
      const res = await api.processDocument(upload.declaration_id);
      setExtraction(res);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    } finally {
      setProcessing(false);
    }
  }, [selectedFile, offlineMode]);

  const handleExport = useCallback(async (format: string) => {
    if (!extraction) return;
    try {
      const res = await api.exportDocument(extraction.declaration_id, format);
      setExportResult(res);
      const blob = new Blob([JSON.stringify(res.export, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enosis-demo-${format}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  }, [extraction]);

  const handleSubmit = useCallback(async () => {
    if (!extraction) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitToTsw(extraction.declaration_id);
      setExportResult({ tsw_reference: res.tsw_reference });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [extraction]);

  const fieldStatus = (score: number) => {
    if (score >= 0.95) return { icon: CheckCircle, label: "Auto-approved", color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500" };
    if (score >= 0.8) return { icon: WarningCircle, label: "Needs review", color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-500" };
    return { icon: WarningCircle, label: "Review required", color: "text-red-600", bg: "bg-red-50", bar: "bg-red-500" };
  };

  const fadeUp = (delay = 0) =>
    reduce ? {} : {
      initial: reduce ? false : { opacity: 0, y: 16 } as const,
      animate: { opacity: 1, y: 0 } as const,
      transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const } as const,
    };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
      {/* Header */}
      <motion.div {...fadeUp()} className="mb-10">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 mb-3">
          Interactive Pipeline Demo
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
          Ingestion &amp; Normalization Pipeline
        </h1>
        <p className="mt-3 text-zinc-500 max-w-2xl leading-relaxed">
          From unstructured trade documents to verified, structured data — powered by 5 novel research contributions.
        </p>
      </motion.div>

      {/* Offline mode toggle */}
      <motion.div {...fadeUp(0.03)} className="mb-6 flex items-center justify-end gap-3">
        <span className="text-xs text-zinc-400">API backend unavailable?</span>
        <button
          onClick={() => setOfflineMode(!offlineMode)}
          className={`inline-flex h-7 items-center rounded-full px-3 text-[11px] font-medium transition ${
            offlineMode
              ? "bg-amber-100 text-amber-700 border border-amber-200"
              : "bg-zinc-100 text-zinc-500 border border-zinc-200"
          }`}
        >
          {offlineMode ? "Offline Demo Mode" : "Use Mock Data"}
        </button>
      </motion.div>

      {/* Step indicator */}
      <motion.div {...fadeUp(0.05)} className="mb-10">
        <div className="flex items-center justify-between gap-0">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${step > s.num ? "text-emerald-600" : step === s.num ? "text-blue-600" : "text-zinc-300"}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step > s.num ? "bg-emerald-500 text-white" :
                  step === s.num ? "bg-blue-600 text-white ring-2 ring-blue-200" :
                  "bg-zinc-100 text-zinc-400"
                }`}>
                  {step > s.num ? <CheckCircle weight="bold" className="h-4 w-4" /> : s.num}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${step >= s.num ? "text-zinc-800" : "text-zinc-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${step > s.num ? "bg-emerald-300" : "bg-zinc-200"}`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Step 1: Unstructured Intake */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <FileText weight="bold" className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-900">Unstructured Intake</p>
                  <p className="text-sm text-zinc-500">Select a sample SME trade document to process</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SAMPLE_FILES.map((f) => {
                  const active = selectedFile?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => { setSelectedFile(f); }}
                      className={`text-left rounded-xl border-2 p-5 transition-all ${
                        active ? "border-blue-500 bg-blue-50/50" : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${
                        active ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-500"
                      }`}>
                        <FileText weight="bold" className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">{f.label}</p>
                      <p className="text-xs text-zinc-400 mt-1 mb-2">{f.desc}</p>
                      <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-100">
                        <p className="text-[11px] font-mono text-zinc-500 leading-relaxed truncate">
                          {f.preview}
                        </p>
                      </div>
                      {active && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                          <CheckCircle weight="bold" className="h-3.5 w-3.5" />
                          Selected
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedFile && (
              <div className="flex justify-center">
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 shadow-sm"
                >
                  <ArrowRight weight="bold" className="h-4 w-4" />
                  Process via Enosis Engine
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Enosis Engine (processing) */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-zinc-200 bg-white p-10 text-center mb-8"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">Enosis Engine</h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
              Processing via 5 core research contributions
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {CORE_TECH.map((tech) => (
                <div key={tech.id} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${tech.color} animate-pulse`}>
                  {tech.name}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700"
        >
          {error}. Using mock data for demonstration.
        </motion.div>
      )}

      {/* Step 3-4: Verification API + Export */}
      {extraction && step >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Step 3: Verification API */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <MagnifyingGlass weight="bold" className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900">Verification API</p>
                <p className="text-sm text-zinc-500">HS code labeling &amp; structure validation</p>
              </div>
            </div>

            {/* HS Codes detected */}
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">HS Codes Detected</p>
              <div className="flex flex-wrap gap-2">
                {extraction.entities?.hs_codes?.length > 0 ? (
                  extraction.entities.hs_codes.map((code: string, i: number) => (
                    <span key={i} className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-mono text-blue-700 border border-blue-100">
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-400">No HS codes detected</span>
                )}
              </div>
            </div>

            {/* Container Numbers */}
            {extraction.entities?.container_numbers?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Container Numbers</p>
                <div className="flex flex-wrap gap-2">
                  {extraction.entities.container_numbers.map((n: string, i: number) => (
                    <span key={i} className="font-mono text-sm text-zinc-700 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">{n}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Scores */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Confidence Scores</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Threshold 95%</span>
                  <span className={`text-xs font-medium ${extraction.confidence_avg >= 0.8 ? "text-emerald-600" : "text-amber-600"}`}>
                    {(extraction.confidence_avg * 100).toFixed(0)}% avg
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {Object.entries(extraction.confidence_scores || {}).filter(([k]) => k !== "overall").map(([key, val]) => {
                  const score = val as number;
                  const status = fieldStatus(score);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <status.icon weight="bold" className={`h-4 w-4 shrink-0 ${status.color}`} />
                      <span className="text-sm w-28 capitalize text-zinc-600">{key.replace(/_/g, " ")}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${status.bar}`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className={`text-sm w-12 text-right font-medium ${status.color}`}>
                        {(score * 100).toFixed(0)}%
                      </span>
                      <span className={`text-xs w-24 text-right ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 4: Structured Export */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Database weight="bold" className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900">Structured Export</p>
                <p className="text-sm text-zinc-500">Instant handoff to TSW, WCO, HKMA CDI</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExport("wco_json")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <Download weight="bold" className="h-4 w-4" />
                WCO Data Model v3.11
              </button>
              <button
                onClick={() => handleExport("tsw_json")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-800 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700 active:scale-[0.98]"
              >
                <Download weight="bold" className="h-4 w-4" />
                TSW Phase 3 JSON
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit to Mock TSW"}
              </button>
            </div>
          </div>

          {/* Submit result */}
          {exportResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle weight="bold" className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-emerald-800 mb-1">
                {exportResult.tsw_reference ? "Submitted to Mock TSW" : "Export Complete"}
              </h3>
              {exportResult.tsw_reference && (
                <p className="text-sm text-emerald-600 font-mono">
                  Reference: {exportResult.tsw_reference}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Core Technologies Footer */}
      <motion.div {...fadeUp(0.2)} className="mt-12 pt-8 border-t border-zinc-200">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 mb-4 text-center">
          Platform Core Technologies
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CORE_TECH.map((tech, i) => (
            <motion.div
              key={tech.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-zinc-200 bg-white p-4 text-center"
            >
              <p className="text-sm font-semibold text-zinc-900">{tech.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
