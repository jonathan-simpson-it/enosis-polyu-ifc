"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  FileText,
  ArrowRight,
  CheckCircle,
  WarningCircle,
  Download,
  MagnifyingGlass,
  Database,
  Eye,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import ConfidenceExplainer from "@/components/confidence-explainer";
import DocViewer from "@/components/demo/doc-viewer";
import {
  DEMO_DOCS,
  buildWcoJson,
  buildTswJson,
  generateDemoTswReference,
} from "@/lib/demo-data";
import type { DemoDoc, DemoExtraction } from "@/lib/demo-data";

const CORE_TECH = [
  { id: "docformer", name: "DocFormer-Trade", desc: "Layout-aware multi-modal model analysing document structure and visual cues", color: "bg-accent-soft text-accent border-accent" },
  { id: "hierarchical", name: "HierarchicalHS", desc: "Deep taxonomy mapping matching detected codes to WCO hierarchy", color: "bg-accent-soft text-accent border-accent" },
  { id: "uncertainty", name: "UncertaintyGuard", desc: "Conformal prediction computing provable confidence bounds per field", color: "bg-accent-soft text-accent border-accent" },
  { id: "metaschema", name: "MetaSchema", desc: "Zero-shot schema transfer adapting output to TSW/WCO format", color: "bg-accent-soft text-accent border-accent" },
  { id: "tradebench", name: "TradeBench", desc: "Multi-vertical benchmark validating extraction quality", color: "bg-accent-soft text-accent border-accent" },
];

const STEPS = [
  { num: 1, label: "Unstructured Intake" },
  { num: 2, label: "Enosis Engine" },
  { num: 3, label: "Verification API" },
  { num: 4, label: "Structured Export" },
];

export default function DemoPage() {
  const reduce = useReducedMotion();

  const [step, setStep] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState<DemoDoc | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extraction, setExtraction] = useState<DemoExtraction | null>(null);
  const [exportResult, setExportResult] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [activeEngine, setActiveEngine] = useState(-1);
  const [showEngineDetails, setShowEngineDetails] = useState(false);

  const [viewerDoc, setViewerDoc] = useState<DemoDoc | null>(null);

  const fadeUp = (delay = 0) =>
    reduce
      ? {}
      : ({
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
        } as const);

  const handleProcess = useCallback(async () => {
    if (!selectedDoc) return;
    setProcessing(true);
    setExtraction(null);
    setExportResult(null);
    setStep(2);
    setActiveEngine(-1);
    setShowEngineDetails(false);

    setTimeout(() => setShowEngineDetails(true), 400);

    for (let i = 0; i < CORE_TECH.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setActiveEngine(i);
    }

    await new Promise((r) => setTimeout(r, 600));
    setActiveEngine(-1);

    setExtraction(selectedDoc.extraction);
    setStep(4);
    setProcessing(false);
  }, [selectedDoc]);

  const handleExport = useCallback(
    (format: string) => {
      if (!extraction) return;
      const data =
        format === "tsw_json" ? buildTswJson(extraction) : buildWcoJson(extraction);
      setExportResult({ exported: true });
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enosis-demo-${format === "tsw_json" ? "tsw-phase-3" : "wco-v3-11"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [extraction]
  );

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setExportResult({ tsw_reference: generateDemoTswReference() });
    setSubmitting(false);
  }, []);

  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedDoc(null);
    setExtraction(null);
    setExportResult(null);
    setActiveEngine(-1);
    setShowEngineDetails(false);
  }, []);

  const fieldStatus = (score: number) => {
    if (score >= 0.95)
      return {
        icon: CheckCircle,
        label: "Auto-approved",
        color: "text-emerald-700",
        bar: "bg-emerald-500",
      };
    if (score >= 0.8)
      return {
        icon: WarningCircle,
        label: "Needs review",
        color: "text-amber-700",
        bar: "bg-amber-500",
      };
    return {
      icon: WarningCircle,
      label: "Review required",
      color: "text-red-700",
      bar: "bg-red-500",
    };
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
      {/* Header */}
      <motion.div {...fadeUp()} className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.1em] text-accent mb-3">
              Interactive Pipeline Demo
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink font-display">
              Ingestion &amp; Normalization Pipeline
            </h1>
            <p className="mt-3 text-muted max-w-2xl leading-relaxed text-sm">
              From unstructured trade documents to verified, structured data — powered by 5 novel
              research contributions.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 border border-accent/30 shrink-0">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-accent uppercase tracking-wider">
              Demo — no account needed
            </span>
          </div>
        </div>
      </motion.div>

      {/* Step indicator */}
      <motion.div {...fadeUp(0.05)} className="mb-10">
        <div className="flex items-center justify-between gap-0">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-2 ${
                  step > s.num ? "text-emerald-600" : step === s.num ? "text-ink" : "text-muted"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    step > s.num
                      ? "bg-emerald-500 text-white"
                      : step === s.num
                        ? "bg-ink text-surface ring-2 ring-accent-soft"
                        : "bg-line/30 text-muted"
                  }`}
                >
                  {step > s.num ? <CheckCircle weight="bold" className="h-4 w-4" /> : s.num}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:inline ${
                    step >= s.num ? "text-ink" : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 transition-colors duration-500 ${
                    step > s.num ? "bg-emerald-300" : "bg-line"
                  }`}
                />
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
            <div className="rounded-xl border border-line bg-surface p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft">
                  <FileText weight="bold" className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-base font-semibold text-ink">Unstructured Intake</p>
                  <p className="text-sm text-muted">Select a sample SME trade document to process</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEMO_DOCS.map((doc) => {
                  const active = selectedDoc?.id === doc.id;
                  return (
                    <div key={doc.id}>
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                          active
                            ? "border-accent bg-accent-soft/50"
                            : "border-line bg-surface hover:border-accent/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              active ? "bg-accent-soft text-accent" : "bg-accent-soft/50 text-muted"
                            }`}
                          >
                            <FileText weight="bold" className="h-5 w-5" />
                          </div>
                          <span
                            className={`text-[11px] font-mono font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              active
                                ? "bg-accent-soft text-accent border-accent/30"
                                : "bg-accent-soft/30 text-muted border-line"
                            }`}
                          >
                            {doc.fileType}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-ink">{doc.label}</p>
                        <p className="text-xs text-muted mt-1 mb-2">{doc.desc}</p>
                        <div className="rounded-lg bg-accent-soft/20 p-2.5 border border-line">
                          <p className="text-[11px] font-mono text-muted leading-relaxed truncate">
                            {doc.preview}
                          </p>
                        </div>
                        {active && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-accent font-medium">
                            <CheckCircle weight="bold" className="h-3.5 w-3.5" />
                            Selected
                          </div>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerDoc(doc);
                        }}
                        className="mt-2 w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line text-xs text-muted hover:text-ink hover:bg-accent-soft transition-colors"
                      >
                        <Eye weight="bold" className="h-3.5 w-3.5" />
                        View document
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDoc && (
              <div className="flex justify-center">
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="inline-flex h-11 items-center justify-center gap-2.5 rounded-full bg-ink px-8 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition-all hover:bg-ink/80 active:scale-[0.98] disabled:opacity-50 shadow-sm"
                >
                  {processing ? "Processing..." : "Process via Enosis Engine"}
                  {!processing && <ArrowRight weight="bold" className="h-4 w-4" />}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Enosis Engine — Sequential Theater */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-line bg-surface p-10 text-center mb-8"
          >
            <motion.div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
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
            </motion.div>

            <h2 className="text-xl font-semibold text-ink mb-2">Enosis Engine</h2>
            <p className="text-sm text-muted mb-6 max-w-md mx-auto">
              Processing via 5 core research contributions
            </p>

            <div className="flex flex-col gap-2 max-w-lg mx-auto">
              {CORE_TECH.map((tech, i) => {
                const isActive = activeEngine >= i;
                const isDone = activeEngine > i;
                return (
                  <motion.div
                    key={tech.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: showEngineDetails ? 1 : 0,
                      y: showEngineDetails ? 0 : 8,
                    }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                      isDone
                        ? "bg-emerald-50 border-emerald-200"
                        : isActive
                          ? `${tech.color} shadow-sm`
                          : "border-line bg-surface/50 opacity-40"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-accent text-surface"
                            : "bg-line/50 text-muted"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle weight="bold" className="h-3.5 w-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isDone ? "text-emerald-800" : isActive ? "text-ink" : "text-muted"
                        }`}
                      >
                        {tech.name}
                      </p>
                      <p
                        className={`text-xs ${
                          isDone || isActive ? "text-muted" : "text-muted/50"
                        }`}
                      >
                        {isDone
                          ? "Complete"
                          : isActive
                            ? tech.desc
                            : "Waiting"}
                      </p>
                    </div>
                    {isActive && !isDone && (
                      <motion.div
                        className="h-1.5 w-16 rounded-full bg-line overflow-hidden"
                      >
                        <motion.div
                          className="h-full rounded-full bg-accent"
                          animate={{ x: ["-100%", "0%"] }}
                          transition={{ duration: 0.7, ease: "easeInOut" }}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3-4: Verification API + Export */}
      {extraction && step >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Step 3: Verification API */}
          <div className="rounded-xl border border-line bg-surface p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft">
                <MagnifyingGlass weight="bold" className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-base font-semibold text-ink">Verification API</p>
                <p className="text-sm text-muted">HS code labeling &amp; structure validation</p>
              </div>
              {selectedDoc && (
                <button
                  onClick={() => setViewerDoc(selectedDoc)}
                  className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs text-muted hover:text-ink hover:bg-accent-soft transition-colors"
                >
                  <Eye weight="bold" className="h-3.5 w-3.5" />
                  View source
                </button>
              )}
            </div>

            {/* HS Codes detected */}
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                HS Codes Detected
              </p>
              <div className="flex flex-wrap gap-2">
                {extraction.entities.hs_codes?.length > 0 ? (
                  extraction.entities.hs_codes.map((code: string, i: number) => (
                    <motion.span
                      key={i}
                      initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-mono text-accent border border-accent"
                    >
                      {code}
                    </motion.span>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                    <WarningCircle weight="bold" className="h-4 w-4 shrink-0" />
                    <span>No HS codes detected — document needs human review</span>
                  </div>
                )}
              </div>
            </div>

            {/* Container Numbers */}
            {extraction.entities.container_numbers?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                  Container Numbers
                </p>
                <div className="flex flex-wrap gap-2">
                  {extraction.entities.container_numbers.map((n: string, i: number) => (
                    <span
                      key={i}
                      className="font-mono text-sm text-ink bg-accent-soft/30 px-3 py-1.5 rounded-lg border border-line"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Scores */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Confidence Scores
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Threshold 95%</span>
                  <span
                    className={`text-xs font-medium ${
                      extraction.confidence_avg >= 0.8
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {(extraction.confidence_avg * 100).toFixed(0)}% avg
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                {Object.entries(extraction.confidence_scores || {})
                  .filter(([k]) => k !== "overall")
                  .map(([key, val]) => {
                    const score = val as number;
                    const status = fieldStatus(score);
                    return (
                      <motion.div
                        key={key}
                        initial={reduce ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                      >
                        <status.icon weight="bold" className={`h-4 w-4 shrink-0 ${status.color}`} />
                        <span className="text-sm w-28 capitalize text-muted">
                          {key.replace(/_/g, " ")}
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-line overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${status.bar}`}
                            initial={{ width: "0%" }}
                            animate={{ width: `${score * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <span
                          className={`text-sm w-12 text-right font-medium ${status.color}`}
                        >
                          {(score * 100).toFixed(0)}%
                        </span>
                        <span className={`text-xs w-24 text-right ${status.color}`}>
                          {status.label}
                        </span>
                      </motion.div>
                    );
                  })}
              </div>

              <ConfidenceExplainer
                scores={extraction.confidence_scores || {}}
                showHeader={true}
              />
            </div>
          </div>

          {/* Step 4: Structured Export */}
          <div className="rounded-xl border border-line bg-surface p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft">
                <Database weight="bold" className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-base font-semibold text-ink">Structured Export</p>
                <p className="text-sm text-muted">Instant handoff to TSW, WCO, HKMA CDI</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExport("wco_json")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition hover:bg-ink/80 active:scale-[0.98]"
              >
                <Download weight="bold" className="h-4 w-4" />
                WCO Data Model v3.11
              </button>
              <button
                onClick={() => handleExport("tsw_json")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-xs font-medium text-ink uppercase tracking-[0.06em] transition hover:bg-accent-soft active:scale-[0.98]"
              >
                <Download weight="bold" className="h-4 w-4" />
                TSW Phase 3 JSON
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-xs font-medium text-ink uppercase tracking-[0.06em] transition hover:bg-accent-soft active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit to Mock TSW"}
              </button>
            </div>
          </div>

          {/* Completion state */}
          {exportResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-8 text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle weight="bold" className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-emerald-800 mb-1 font-display">
                {"tsw_reference" in exportResult ? "Submitted to Mock TSW" : "Export Complete"}
              </h3>
              {"tsw_reference" in exportResult && (
                <p className="text-sm text-emerald-600 font-mono mb-4">
                  Reference: {String(exportResult.tsw_reference)}
                </p>
              )}

              <div className="mt-6 space-y-3">
                <a
                  href="https://jonathansimpson.co/#contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-8 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition-all hover:bg-ink/80 active:scale-[0.98]"
                >
                  <ArrowSquareOut weight="bold" className="h-4 w-4" />
                  Process the data and gain insight using AI
                </a>
                <div>
                  <button
                    onClick={handleReset}
                    className="inline-flex h-9 items-center justify-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
                  >
                    Process another document
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Core Technologies Footer */}
      <motion.div {...fadeUp(0.2)} className="mt-12 pt-8 border-t border-line">
        <p className="text-xs font-mono uppercase tracking-[0.1em] text-muted mb-4 text-center">
          Platform Core Technologies
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CORE_TECH.map((tech, i) => (
            <motion.div
              key={tech.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-line bg-surface p-4 text-center"
            >
              <p className="text-sm font-semibold text-ink">{tech.name}</p>
              <p className="text-xs text-muted mt-1">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Document viewer modal */}
      {viewerDoc && (
        <DocViewer
          open={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
          href={viewerDoc.href}
          viewerType={viewerDoc.viewerType}
          label={viewerDoc.label}
        />
      )}
    </div>
  );
}
