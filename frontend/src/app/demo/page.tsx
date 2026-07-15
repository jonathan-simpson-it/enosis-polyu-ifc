"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Hospital,
  FileText,
  PencilLine,
  ArrowRight,
  CheckCircle,
  Clock,
  FloppyDisk,
} from "@phosphor-icons/react";
import { StepIndicator } from "@/components/step-indicator";
import { ConfidenceBar } from "@/components/confidence-bar";
import { FhirViewer } from "@/components/fhir-viewer";
import { Badge } from "@/components/badge";
import { api, type TranslateResponse, type UploadResponse, type CertificationResponse } from "@/lib/api";

type SourceType = "cms" | "lab" | "custom";

interface Patient {
  id: string;
  name: string;
  hkid: string;
  dob: string;
  gender: string;
  diagnoses: { code: string; desc: string }[];
  medications: { name: string; dosage: string; freq: string }[];
  labs: { test: string; value: string; unit: string; ref: string }[];
  notes: string;
}

const DATA_SOURCES: Record<SourceType, { label: string; icon: typeof Hospital; patients: Patient[] }> = {
  cms: {
    label: "Mock Clinic CMS",
    icon: Hospital,
    patients: [
      { id: "P001", name: "Leung Hin Wa", hkid: "U2167390", dob: "1977-03-26", gender: "M",
        diagnoses: [{ code: "I10", desc: "Essential (primary) hypertension" }],
        medications: [{ name: "Sertraline", dosage: "50mg", freq: "Once daily" }],
        labs: [{ test: "Fasting Glucose", value: "8.3", unit: "mmol/L", ref: "4.0-6.0" }, { test: "HbA1c", value: "8.6", unit: "%", ref: "< 7.0" }, { test: "Total Cholesterol", value: "6.5", unit: "mmol/L", ref: "< 5.2" }, { test: "Creatinine", value: "107.1", unit: "umol/L", ref: "60-110" }],
        notes: "Patient presents with numbness in feet. Referred to specialist." },
      { id: "P002", name: "Fong Chun Kit", hkid: "B3999814", dob: "1949-01-17", gender: "M",
        diagnoses: [{ code: "D64.9", desc: "Anemia, unspecified" }, { code: "I10", desc: "Essential hypertension" }, { code: "J44.9", desc: "COPD, unspecified" }],
        medications: [{ name: "Sertraline", dosage: "50mg", freq: "Once daily" }, { name: "Metformin", dosage: "500mg", freq: "Twice daily" }, { name: "Omeprazole", dosage: "20mg", freq: "Once daily" }],
        labs: [{ test: "White Cell Count", value: "3.0", unit: "x10^9/L", ref: "4.0-11.0" }, { test: "TSH", value: "1.3", unit: "mIU/L", ref: "0.4-4.0" }, { test: "Triglycerides", value: "3.4", unit: "mmol/L", ref: "< 1.7" }, { test: "Hb", value: "11.9", unit: "g/dL", ref: "13-17" }],
        notes: "Routine check. Gait normal. Advised food diary and reduced sodium." },
      { id: "P003", name: "Wan Sze Man", hkid: "N6452810", dob: "1994-04-15", gender: "F",
        diagnoses: [{ code: "E78.5", desc: "Hyperlipidemia, unspecified" }, { code: "E11.9", desc: "Type 2 diabetes mellitus" }],
        medications: [{ name: "Lisinopril", dosage: "10mg", freq: "Once daily" }, { name: "Metformin", dosage: "500mg", freq: "Twice daily" }],
        labs: [{ test: "Triglycerides", value: "3.2", unit: "mmol/L", ref: "< 1.7" }, { test: "BMI", value: "32.1", unit: "kg/m2", ref: "18.5-24.9" }, { test: "AST", value: "35.1", unit: "U/L", ref: "< 37" }, { test: "Blood Pressure Systolic", value: "127.1", unit: "mmHg", ref: "< 130" }],
        notes: "Shortness of breath on exertion. Prescribed Lisinopril. Follow-up in 3 months." },
    ],
  },
  lab: {
    label: "Lab Report (OCR)",
    icon: FileText,
    patients: [{
      id: "P004", name: "Tam Ho Yin", hkid: "R9241808", dob: "1954-07-09", gender: "M",
      diagnoses: [{ code: "G47.9", desc: "Sleep disorder, unspecified" }, { code: "I25.1", desc: "Atherosclerotic heart disease" }],
      medications: [{ name: "Warfarin", dosage: "3mg", freq: "Once daily" }, { name: "Sertraline", dosage: "50mg", freq: "Once daily" }],
      labs: [{ test: "CRP", value: "18.0", unit: "mg/L", ref: "< 5" }, { test: "Heart Rate", value: "55.6", unit: "bpm", ref: "60-100" }, { test: "Fasting Glucose", value: "5.2", unit: "mmol/L", ref: "4.0-6.0" }, { test: "HbA1c", value: "7.3", unit: "%", ref: "< 7.0" }],
      notes: "Difficulty sleeping and feeling anxious. ECG sinus rhythm with LVH.",
    }],
  },
  custom: {
    label: "Custom Clinical Text",
    icon: PencilLine,
    patients: [{
      id: "P005", name: "Lee Ka Ho", hkid: "A9876543", dob: "1970-03-22", gender: "M",
      diagnoses: [{ code: "E78.5", desc: "Hyperlipidemia, unspecified" }],
      medications: [{ name: "Atorvastatin", dosage: "20mg", freq: "Nocte" }],
      labs: [{ test: "Total Cholesterol", value: "6.2", unit: "mmol/L", ref: "< 5.2" }, { test: "LDL", value: "3.8", unit: "mmol/L", ref: "< 2.6" }],
      notes: "Routine health check. Elevated cholesterol. Advised diet and exercise.",
    }],
  },
};

const CLINIC_ID = "c1010101-0000-4000-a000-000000000001";

export default function DemoPage() {
  const reduce = useReducedMotion();
  const [source, setSource] = useState<SourceType>("cms");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [step, setStep] = useState(1);
  const [translating, setTranslating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [translateResult, setTranslateResult] = useState<TranslateResponse | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [certResult, setCertResult] = useState<CertificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sourceData = DATA_SOURCES[source];
  const patient = sourceData.patients[source === "cms" ? selectedIdx : 0];

  const runTranslation = useCallback(async () => {
    setTranslating(true);
    setError(null);
    setTranslateResult(null);
    setUploadResult(null);
    setCertResult(null);
    setStep(3);

    try {
      await api.ingest({
        clinic_id: CLINIC_ID,
        clinic_name: "Central Clinic",
        cms_type: "demo",
        cms_url: "http://localhost:8080",
        patient_ids: [patient.id],
      }).catch(() => {});

      setStep(4);

      const result = await api.translate({
        clinic_id: CLINIC_ID,
        patient_id: patient.id,
        patient_data: {
          name: { first: patient.name.split(" ")[0], last: patient.name.split(" ").slice(1).join(" ") || patient.name.split(" ")[0] },
          hkid: patient.hkid,
          dob: patient.dob,
          gender: patient.gender,
        },
        diagnoses: patient.diagnoses.map((d) => ({ code: d.code, description: d.desc })),
        medications: patient.medications.map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.freq })),
        lab_results: patient.labs.map((l) => ({ test: l.test, value: l.value, unit: l.unit, reference: l.ref })),
        clinical_notes: patient.notes,
      });

      setTranslateResult(result);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  }, [patient, source, selectedIdx]);

  const runUpload = useCallback(async () => {
    if (!translateResult) return;
    setUploading(true);
    setError(null);

    try {
      const upload = await api.upload({
        clinic_id: CLINIC_ID,
        patient_id: patient.id,
        fhir_bundle: translateResult.fhir_bundle,
        patient_consent: true,
      });
      setUploadResult(upload);

      const cert = await api.certification(CLINIC_ID);
      setCertResult(cert);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [translateResult, patient]);

  const fadeUp = (delay = 0) =>
    reduce ? {} : {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
    };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Page header */}
      <motion.div {...fadeUp()} className="mb-10 text-center">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 mb-3">
          Interactive Pipeline Demo
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
          AI Translation in Action
        </h1>
        <p className="mt-3 text-zinc-500 max-w-xl mx-auto leading-relaxed">
          Watch Enosis transform raw clinical data into standardized FHIR R5
          and upload it to eHealth+ — automatically, with zero clinic effort.
        </p>
      </motion.div>

      {/* Step indicator */}
      <motion.div {...fadeUp(0.1)} className="mb-10">
        <StepIndicator current={step} />
      </motion.div>

      {/* Step 1: Source Selection */}
      <motion.div {...fadeUp(0.15)} className="mb-6">
        <div className="flex gap-2">
          {(Object.entries(DATA_SOURCES) as [SourceType, typeof sourceData][]).map(([key, src]) => {
            const active = source === key;
            return (
              <button
                key={key}
                onClick={() => { setSource(key); setSelectedIdx(0); setTranslateResult(null); setUploadResult(null); setCertResult(null); setError(null); setStep(1); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                <src.icon weight="bold" className="h-4 w-4" />
                {src.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Step 1b: Patient selection for CMS */}
      {source === "cms" && (
        <motion.div {...fadeUp(0.2)} className="mb-6">
          <p className="text-sm font-medium text-zinc-500 mb-3">Select a patient</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sourceData.patients.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => { setSelectedIdx(idx); setTranslateResult(null); setUploadResult(null); setCertResult(null); setError(null); }}
                className={`text-left rounded-xl border-2 p-4 transition-all ${
                  idx === selectedIdx
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <p className="text-sm font-semibold text-zinc-900">{p.name}</p>
                <p className="text-xs text-zinc-400 mt-1">{p.id} · {p.hkid}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.diagnoses.map((d) => (
                    <span key={d.code} className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                      {d.code}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Patient detail card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${source}-${patient.id}`}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-lg font-semibold text-zinc-900">{patient.name}</p>
              <p className="text-sm text-zinc-400">
                {patient.hkid} · {patient.dob} · {patient.gender === "M" ? "Male" : "Female"}
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-zinc-100 text-zinc-500">
              {patient.id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Diagnoses</p>
              <div className="space-y-1">
                {patient.diagnoses.map((d) => (
                  <p key={d.code} className="text-zinc-700">
                    {d.code} — {d.desc}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Medications</p>
              <div className="space-y-1">
                {patient.medications.map((m) => (
                  <p key={m.name} className="text-zinc-700">
                    {m.name} {m.dosage}, {m.freq}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Lab Results</p>
              <div className="space-y-1">
                {patient.labs.map((l) => (
                  <p key={l.test} className="text-zinc-700">
                    {l.test}: {l.value} {l.unit}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {patient.notes && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">Clinical Notes</p>
              <p className="text-sm text-zinc-600 italic">{patient.notes}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Translate button */}
      <motion.div {...fadeUp(0.25)} className="mb-8">
        <button
          onClick={runTranslation}
          disabled={translating}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {translating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Translating via DeepSeek...
            </>
          ) : (
            <>
              <ArrowRight weight="bold" className="h-4 w-4" />
              Translate via DeepSeek
            </>
          )}
        </button>
      </motion.div>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Translation results */}
      <AnimatePresence>
        {translateResult && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Confidence bars */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-900">Translation Results</h2>
                <span className="text-sm font-medium text-emerald-600">
                  {translateResult.translations.length > 0
                    ? `${(translateResult.translations.reduce((s, t) => s + t.confidence, 0) / translateResult.translations.length * 100).toFixed(1)}% avg`
                    : ""}
                </span>
              </div>
              <div>
                {translateResult.translations.map((t, i) => (
                  <ConfidenceBar
                    key={i}
                    label={t.mapping_standard}
                    original={t.original}
                    translated={t.translated}
                    confidence={t.confidence}
                  />
                ))}
              </div>
            </div>

            {/* FHIR viewer */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-900">FHIR R5 Bundle</h2>
                <span className="text-xs text-zinc-400">
                  {(translateResult.fhir_bundle?.entry as unknown[])?.length || 0} resources
                </span>
              </div>
              <FhirViewer bundle={translateResult.fhir_bundle} />
            </div>

            {/* Upload button */}
            <div className="flex items-center gap-4">
              <button
                onClick={runUpload}
                disabled={uploading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading to eHealth+...
                  </>
                ) : (
                  <>
                    <FloppyDisk weight="bold" className="h-4 w-4" />
                    Upload to eHealth+
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload result + certification */}
      <AnimatePresence>
        {uploadResult && certResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle weight="bold" className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-emerald-800 mb-1">
              Successfully Uploaded to eHealth+
            </h3>
            <p className="text-sm text-emerald-600 font-mono mb-6">
              Reference: {uploadResult.ehealth_reference}
            </p>
            <div className="flex justify-center">
              <Badge
                level={certResult.current_level}
                records={certResult.records_uploaded}
                accuracy={certResult.accuracy_rate}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token usage */}
      {translateResult?.token_usage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-zinc-400 font-mono">
            Token usage: {translateResult.token_usage.input_tokens} in · {translateResult.token_usage.output_tokens} out
          </p>
        </motion.div>
      )}
    </div>
  );
}
