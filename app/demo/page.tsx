"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  CloudArrowUp,
  Stack,
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
import { prepareUploadFile } from "@/lib/client/file-prep";

const CORE_TECH = [
  { id: "docformer", name: "DocFormer-Trade", desc: "Multi-modal layout transformer. Outperforms LayoutLM by 14% on trade manifests", color: "bg-accent-soft text-accent border-accent" },
  { id: "hierarchical", name: "HierarchicalHS", desc: "Neural matcher translating raw invoice items into standard HS product codes", color: "bg-accent-soft text-accent border-accent" },
  { id: "uncertainty", name: "UncertaintyGuard", desc: "Split conformal prediction. Guaranteed 95% accuracy, p<0.05", color: "bg-accent-soft text-accent border-accent" },
  { id: "metaschema", name: "MetaSchema Mapping", desc: "Zero-shot schema mapper. Instantly converts documents to structured JSON", color: "bg-accent-soft text-accent border-accent" },
  { id: "tradebench", name: "TradeBench", desc: "Open-source benchmark validating extraction quality", color: "bg-accent-soft text-accent border-accent" },
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

  const [liveFile, setLiveFile] = useState<File | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveVisionNote, setLiveVisionNote] = useState<string | null>(null);
  const [liveModel, setLiveModel] = useState<string | null>(null);
  const [waitingOnEngine, setWaitingOnEngine] = useState(false);
  const [retryingVision, setRetryingVision] = useState(false);
  const [waitElapsed, setWaitElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveAbortRef = useRef<AbortController | null>(null);

  // Abort any in-flight live request on unmount so we never set state on an
  // unmounted component (and the browser stops holding the connection).
  useEffect(() => {
    return () => liveAbortRef.current?.abort();
  }, []);

  // Elapsed-seconds counter for the analysis wait state: the user always
  // sees movement and a concrete sense of how long the free tier is taking.
  useEffect(() => {
    if (!waitingOnEngine) return;
    const started = Date.now();
    const id = setInterval(() => {
      setWaitElapsed(Math.round((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [waitingOnEngine]);

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

  const runEngineTheater = useCallback(async () => {
    setStep(2);
    setActiveEngine(-1);
    setShowEngineDetails(false);
    setTimeout(() => setShowEngineDetails(true), 400);
    for (let i = 0; i < CORE_TECH.length; i++) {
      await new Promise((r) => setTimeout(r, 550));
      setActiveEngine(i);
    }
    await new Promise((r) => setTimeout(r, 500));
    setActiveEngine(-1);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!selectedDoc) return;
    setProcessing(true);
    setExtraction(null);
    setExportResult(null);
    await runEngineTheater();
    setExtraction(selectedDoc.extraction);
    setStep(4);
    setProcessing(false);
  }, [selectedDoc, runEngineTheater]);

  const sendRequest = useCallback(
    async (controller: AbortController) => {
      try {
        const form = new FormData();
        form.append("file", liveFile!);
        const res = await fetch("/api/documents/process", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        return { res, data };
      } catch (err) {
        return { err: err instanceof Error ? err : new Error("Live engine failed") };
      }
    },
    [liveFile]
  );

  const handleProcessLive = useCallback(async () => {
    if (!liveFile) return;
    // Bound the whole flow — theater included — so the spinner can never
    // spin forever. Server races at 58s, vision aborts at 55s, so 65s here
    // is the outermost backstop per attempt.
    let controller = new AbortController();
    let timer = setTimeout(() => controller.abort(), 65000);
    liveAbortRef.current = controller;

    setProcessing(true);
    setLiveError(null);
    setLiveVisionNote(null);
    setLiveModel(null);
    setRetryingVision(false);
    setExtraction(null);
    setExportResult(null);
    setWaitingOnEngine(false);
    setWaitElapsed(0);

    // Start the request and the theater at the same time: the research-step
    // animation plays while the engine actually works, instead of pretending
    // to be done before the work begins.
    let settled = false;
    const request = sendRequest(controller);
    request.then(() => {
      settled = true;
    });

    await runEngineTheater();

    // Theater finished but the engine is still working: show the honest
    // analysis state with model + elapsed time instead of green ticks.
    if (!settled) {
      setWaitingOnEngine(true);
    }

    let outcome = await request;

    // 422 = the engine read nothing AND every vision model failed within
    // budget. Free-tier models sometimes answer just past the deadline, so
    // give the document one automatic second chance with a fresh budget
    // before surfacing the error.
    if (!outcome.err && outcome.res?.status === 422) {
      clearTimeout(timer);
      if (liveAbortRef.current === controller) liveAbortRef.current = null;
      setRetryingVision(true);
      setWaitingOnEngine(true);
      setWaitElapsed(0);
      controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 65000);
      liveAbortRef.current = controller;
      outcome = await sendRequest(controller);
    }

    try {
      if (outcome.err) throw outcome.err;
      const { res, data } = outcome;
      if (!res.ok) {
        throw new Error(data?.detail || `Engine returned ${res.status}`);
      }
      setExtraction(data.extraction as DemoExtraction);
      if (data.vision?.model) setLiveModel(data.vision.model);
      if (data.vision?.status === "timed_out") {
        setLiveVisionNote(
          "The vision model timed out. Showing partial extraction — try again with a clearer image."
        );
      }
      setStep(4);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setLiveError(
          "The engine took too long. Please try again or upload a smaller image."
        );
      } else {
        setLiveError(err instanceof Error ? err.message : "Live engine failed");
      }
      setStep(1);
    } finally {
      clearTimeout(timer);
      if (liveAbortRef.current === controller) liveAbortRef.current = null;
      setRetryingVision(false);
      setProcessing(false);
      setWaitingOnEngine(false);
      setWaitElapsed(0);
    }
  }, [liveFile, runEngineTheater, sendRequest]);

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
    setLiveFile(null);
    setLiveError(null);
    setLiveVisionNote(null);
    setLiveModel(null);
    setRetryingVision(false);
    setWaitElapsed(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const fieldStatus = (score: number) => {
    if (score <= 0.05)
      return {
        icon: WarningCircle,
        label: "Not detected",
        color: "text-muted",
        bar: "bg-line/40",
      };
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
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col px-6 py-6 sm:px-8">
      {/* Header */}
      <motion.div {...fadeUp()} className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.1em] text-accent mb-2">
              Interactive Pipeline Demo
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink font-display">
              Ingestion &amp; Normalization Pipeline
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 border border-accent/30 shrink-0">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-accent uppercase tracking-wider">
              Demo, no account needed
            </span>
          </div>
        </div>
      </motion.div>

      {/* Step indicator */}
      <motion.div {...fadeUp(0.05)} className="mb-5">
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
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                <FileText weight="bold" className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Unstructured Intake</p>
                <p className="text-xs text-muted">Pick a sample document, or upload your own below</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEMO_DOCS.map((doc) => {
                const active = selectedDoc?.id === doc.id;
                return (
                  <div key={doc.id}>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className={`w-full text-left rounded-xl border-2 p-3.5 transition-all ${
                        active
                          ? "border-accent bg-accent-soft/50"
                          : "border-line bg-surface hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            active ? "bg-accent-soft text-accent" : "bg-accent-soft/50 text-muted"
                          }`}
                        >
                          <FileText weight="bold" className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-[10px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            active
                              ? "bg-accent-soft text-accent border-accent/30"
                              : "bg-accent-soft/30 text-muted border-line"
                          }`}
                        >
                          {doc.fileType}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-ink truncate">{doc.label}</p>
                      <p className="text-[11px] text-muted mt-0.5 truncate">{doc.desc}</p>
                      <div className="mt-2 rounded-lg bg-accent-soft/20 px-2.5 py-1.5 border border-line">
                        <p className="text-[10px] font-mono text-muted leading-relaxed truncate">
                          {doc.preview}
                        </p>
                      </div>
                      {active && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-accent font-medium">
                          <CheckCircle weight="bold" className="h-3 w-3" />
                          Selected
                        </div>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewerDoc(doc);
                      }}
                      className="mt-1.5 w-full inline-flex h-7 items-center justify-center gap-1.5 rounded-lg border border-line text-[11px] text-muted hover:text-ink hover:bg-accent-soft transition-colors"
                    >
                      <Eye weight="bold" className="h-3 w-3" />
                      View document
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-line bg-surface/60 p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.txt,.json"
                className="hidden"
                id="live-file-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  const prepared = await prepareUploadFile(file);
                  if ("error" in prepared) {
                    setLiveFile(null);
                    setLiveError(prepared.error);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    return;
                  }
                  setLiveFile(prepared.file);
                  setLiveError(null);
                  setLiveVisionNote(null);
                  setLiveModel(null);
                }}
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="live-file-input"
                    className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-accent transition-colors"
                  >
                    <CloudArrowUp weight="bold" className="h-4 w-4 text-accent" />
                    {liveFile ? liveFile.name : "Upload your own invoice, receipt, or manifest"}
                  </label>
                  <p className="mt-0.5 text-xs text-muted">
                    PDF, image, CSV, Excel, or text. Handwritten notes route through the vision
                    model and usually take ~5-30s. Images over 4MB are compressed automatically.
                  </p>
                </div>
                {liveFile && (
                  <button
                    onClick={handleProcessLive}
                    disabled={processing}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-4 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition-all hover:bg-accent/80 active:scale-[0.98] disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Process live"}
                    {!processing && <ArrowRight weight="bold" className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {liveError && (
                <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  Live engine error: {liveError}
                </p>
              )}
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

        {/* Step 2: Enosis Engine, sequential theater */}
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
            {waitingOnEngine && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mb-4 rounded-xl border border-accent/30 bg-accent-soft/20 px-4 py-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 ${
                        reduce ? "" : "animate-ping"
                      }`}
                    />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                  </span>
                  <p className="text-xs font-medium text-ink">
                    {retryingVision
                      ? "First attempt timed out — retrying once more"
                      : "Reading via vision model"}
                    {liveModel ? ` (${liveModel})` : ""}
                  </p>
                </div>
                {/* Indeterminate sweep — the eye has something moving for the
                    whole wait, not just a ticking counter. */}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line/60">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-accent"
                    animate={
                      reduce
                        ? { x: "0%" }
                        : { x: ["-100%", "400%"] }
                    }
                    transition={
                      reduce
                        ? undefined
                        : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                    }
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  Reading usually completes in 5-30s. Elapsed:{" "}
                  <span className="font-mono text-ink">{waitElapsed}s</span>
                </p>
              </motion.div>
            )}

            <div className="flex flex-col gap-2 max-w-lg mx-auto">
              {CORE_TECH.map((tech, i) => {
                const isActive = activeEngine >= i;
                // Never show a green "Complete" checkmark during analysis:
                // the work isn't done until the engine actually answers.
                const isDone = false;
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
          className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0"
        >
          {/* Step 3: Verification API */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                <MagnifyingGlass weight="bold" className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Verification API</p>
                <p className="text-xs text-muted">HS code labeling &amp; structure validation</p>
              </div>
              {selectedDoc && (
                <button
                  onClick={() => setViewerDoc(selectedDoc)}
                  className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[11px] text-muted hover:text-ink hover:bg-accent-soft transition-colors"
                >
                  <Eye weight="bold" className="h-3 w-3" />
                  View source
                </button>
              )}
            </div>

            {/* Classification strip */}
            {extraction.classification && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-medium text-ink border border-accent/30">
                  <Stack weight="bold" className="h-3 w-3 text-accent" />
                  {extraction.classification.doc_type.replace(/_/g, " ")}
                </span>
                <span className="text-[11px] text-muted">
                  {extraction.classification.method === "llm"
                    ? "classified by language model"
                    : "classified by rule engine"}
                  {" · "}
                  {Math.round(extraction.classification.confidence * 100)}% category confidence
                </span>
              </div>
            )}

            {/* Low-confidence panel */}
            {extraction.needs_review && extraction.confidence_avg < 0.5 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  The engine flagged this document for review
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  This document was read, but the engine could not verify it automatically.
                  Handwriting, photo angle, and paper condition affect extraction. The fields
                  below are unverified.
                </p>
              </div>
            )}

            {/* Vision source badge */}
            {extraction.labeled_fields.vision_source && (
              <div className="mb-4 inline-flex flex-wrap items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-medium text-accent border border-accent/30">
                <Database weight="bold" className="h-3 w-3" />
                <span>
                  Read via {liveModel || "vision model"},{" "}
                  {extraction.confidence_avg >= 0.8 ? "verified" : "needs human review"}
                </span>
              </div>
            )}

            {/* Vision timed out banner */}
            {liveVisionNote && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Partial extraction
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">{liveVisionNote}</p>
              </div>
            )}

            {/* Extracted line items */}
            {extraction.commodities.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                  Line Items ({extraction.commodities.length})
                </p>
                <div className="rounded-lg border border-line overflow-hidden">
                  <div className="max-h-36 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-accent-soft/50">
                        <tr className="text-left text-muted">
                          <th className="px-3 py-1.5 font-medium">Description</th>
                          <th className="px-3 py-1.5 font-medium text-right">Qty</th>
                          <th className="px-3 py-1.5 font-medium text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extraction.commodities.slice(0, 8).map((c) => (
                          <tr key={c.id} className="border-t border-line/50">
                            <td className="px-3 py-1.5 text-ink truncate max-w-[220px]">{c.description || "Not provided"}</td>
                            <td className="px-3 py-1.5 text-right text-muted">{c.quantity ?? "Not provided"}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-ink">
                              {c.declared_value != null ? c.declared_value.toLocaleString() : "Not provided"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {extraction.commodities.length > 8 && (
                    <p className="px-3 py-1.5 text-[10px] text-muted border-t border-line/50">
                      {extraction.commodities.length - 8} more items in the full extraction
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* HS Codes detected */}
            <div className="mb-4">
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
                    <span>No HS codes detected, document needs human review</span>
                  </div>
                )}
              </div>
            </div>

            {/* Container Numbers */}
            {extraction.entities.container_numbers?.length > 0 && (
              <div className="mb-4">
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

              <div className="space-y-2 mb-4">
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
                        <span className="text-sm w-24 sm:w-28 capitalize text-muted min-w-0 truncate">
                          {key.replace(/_/g, " ")}
                        </span>
                        {score > 0.05 ? (
                          <div className="flex-1 h-2.5 rounded-full bg-line overflow-hidden min-w-0">
                            <motion.div
                              className={`h-full rounded-full ${status.bar}`}
                              initial={{ width: "0%" }}
                              animate={{ width: `${score * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 h-2.5 rounded-full bg-line/40 min-w-0" />
                        )}
                        <span
                          className={`text-sm w-10 sm:w-12 text-right font-medium ${status.color}`}
                        >
                          {score > 0.05 ? `${(score * 100).toFixed(0)}%` : "0%"}
                        </span>
                        <span
                          className={`hidden sm:block text-xs w-24 text-right ${status.color}`}
                        >
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
          <div className="rounded-xl border border-line bg-surface p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft">
                <Database weight="bold" className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Structured Export</p>
                <p className="text-xs text-muted">Instant handoff to TSW, WCO, HKMA CDI</p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {extraction.commodities.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Nothing was extracted from this document, so there is nothing to export.
                  Re-process it or try a clearer image.
                </div>
              )}
              <button
                onClick={() => handleExport("wco_json")}
                disabled={extraction.commodities.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-surface uppercase tracking-[0.06em] transition hover:bg-ink/80 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-ink disabled:active:scale-100"
              >
                <Download weight="bold" className="h-4 w-4" />
                WCO Data Model v3.11
              </button>
              <button
                onClick={() => handleExport("tsw_json")}
                disabled={extraction.commodities.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-xs font-medium text-ink uppercase tracking-[0.06em] transition hover:bg-accent-soft active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-surface disabled:active:scale-100"
              >
                <Download weight="bold" className="h-4 w-4" />
                TSW Phase 3 JSON
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || extraction.commodities.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-xs font-medium text-ink uppercase tracking-[0.06em] transition hover:bg-accent-soft active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-surface disabled:active:scale-100"
              >
                {submitting ? "Submitting..." : "Submit to Mock TSW"}
              </button>
            </div>

            <div className="mt-auto pt-4 text-xs text-muted">
              Exports include the 95% verified fields only. Unverified fields are marked for
              review, never silently dropped.
            </div>
          </div>

          {/* Completion state */}
          {exportResult && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-8 text-center lg:col-span-2"
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
