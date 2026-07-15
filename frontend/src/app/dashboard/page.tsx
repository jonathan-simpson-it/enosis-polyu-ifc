"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  UploadSimple,
  CheckCircle,
  Trophy,
  Users,
  ArrowRight,
} from "@phosphor-icons/react";
import { Badge } from "@/components/badge";
import { api, type CertificationResponse } from "@/lib/api";

const CLINIC_ID = "c1010101-0000-4000-a000-000000000001";

const LEVEL_ORDER = ["none", "bronze", "silver", "gold", "platinum", "diamond"];

const LEVEL_THRESHOLDS = [
  { level: "bronze", label: "Bronze", records: 50, accuracy: 0.8 },
  { level: "silver", label: "Silver", records: 200, accuracy: 0.85 },
  { level: "gold", label: "Gold", records: 500, accuracy: 0.9 },
  { level: "platinum", label: "Platinum", records: 1000, accuracy: 0.95 },
  { level: "diamond", label: "Diamond", records: 5000, accuracy: 0.97 },
];

const activityFeed = [
  { action: "Translation completed", detail: "Leung Hin Wa → FHIR R5 (4 resources)", time: "2 min ago", type: "translate" },
  { action: "Uploaded to eHealth+", detail: "Ref: MOCK-EH-20260706-001234", time: "3 min ago", type: "upload" },
  { action: "Translation completed", detail: "Fong Chun Kit → FHIR R5 (6 resources)", time: "15 min ago", type: "translate" },
  { action: "CMS data ingested", detail: "3 new patient records found", time: "1 hour ago", type: "ingest" },
  { action: "Translation completed", detail: "Wan Sze Man → FHIR R5 (5 resources)", time: "2 hours ago", type: "translate" },
];

export default function DashboardPage() {
  const reduce = useReducedMotion();
  const [cert, setCert] = useState<CertificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.certification(CLINIC_ID)
      .then(setCert)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const currentLevelIndex = LEVEL_ORDER.indexOf(cert?.current_level ?? "none");
  const nextLevel = LEVEL_THRESHOLDS[currentLevelIndex];

  const fadeUp = (delay = 0) =>
    reduce ? {} : {
      initial: { opacity: 0, y: 16 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
    };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <motion.div {...fadeUp()} className="mb-10">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 mb-3">
          Central Clinic
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
          Clinic Dashboard
        </h1>
        <p className="mt-3 text-zinc-500 max-w-xl leading-relaxed">
          Real-time overview of your clinic&apos;s Enosis data translation, eHealth+ uploads, and certification status.
        </p>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}. Showing mock data.
        </div>
      )}

      {cert && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: UploadSimple, label: "Records Uploaded", value: cert.records_uploaded.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
              { icon: CheckCircle, label: "Accuracy Rate", value: `${(cert.accuracy_rate * 100).toFixed(0)}%`, color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Trophy, label: "Certification", value: cert.current_level.charAt(0).toUpperCase() + cert.current_level.slice(1), color: "text-amber-600", bg: "bg-amber-50" },
              { icon: Users, label: "Patients Processed", value: "247", color: "text-indigo-600", bg: "bg-indigo-50" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                {...fadeUp(0.1 + i * 0.05)}
                className="rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
                  <stat.icon weight="bold" className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-semibold text-zinc-900 tabular-nums">{stat.value}</p>
                <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Certification Progress */}
            <motion.div
              {...fadeUp(0.3)}
              className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <h2 className="text-base font-semibold text-zinc-900 mb-6">
                Certification Progress
              </h2>
              <div className="space-y-4">
                {LEVEL_THRESHOLDS.map((level, i) => {
                  const achieved = i <= currentLevelIndex - 1;
                  const current = i === currentLevelIndex;
                  const progress = current && nextLevel
                    ? Math.min(100, Math.round((cert.records_uploaded / nextLevel.records) * 100))
                    : achieved ? 100 : 0;

                  return (
                    <div key={level.level} className="flex items-center gap-4">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          achieved || current
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                      >
                        {achieved ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium ${achieved || current ? "text-zinc-900" : "text-zinc-400"}`}>
                            {level.label}
                          </p>
                          {current && nextLevel && (
                            <p className="text-xs text-zinc-400">
                              {cert.records_uploaded.toLocaleString()} / {nextLevel.records.toLocaleString()} records
                            </p>
                          )}
                          {achieved && (
                            <p className="text-xs text-emerald-600 font-medium">Achieved</p>
                          )}
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${achieved ? "bg-emerald-500" : current ? "bg-blue-500" : "bg-zinc-200"}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              {...fadeUp(0.35)}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <h2 className="text-base font-semibold text-zinc-900 mb-4">
                Recent Activity
              </h2>
              <div className="space-y-0">
                {activityFeed.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={reduce ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex gap-3 py-3 border-b border-zinc-100 last:border-0"
                  >
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      item.type === "translate" ? "bg-blue-50 text-blue-500" :
                      item.type === "upload" ? "bg-emerald-50 text-emerald-500" :
                      "bg-zinc-100 text-zinc-500"
                    }`}>
                      <div className="h-2 w-2 rounded-full bg-current" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{item.action}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.detail}</p>
                      <p className="text-[11px] text-zinc-300 mt-0.5">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Badge display */}
          <motion.div {...fadeUp(0.4)} className="mt-8 flex justify-center">
            <Badge
              level={cert.current_level}
              records={cert.records_uploaded}
              accuracy={cert.accuracy_rate}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}
