"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { FileText, CheckCircle, WarningCircle, Hash } from "@phosphor-icons/react";
import { api, type Declaration } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [docs, setDocs] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  useEffect(() => {
    api
      .listDocuments()
      .then((data) => setDocs(data.documents || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalDocs = docs.length;
  const avgConfidence =
    docs.length > 0
      ? docs.reduce((s, d) => s + (d.confidence_avg || 0), 0) / docs.length
      : 0;
  const pendingReview = docs.filter(
    (d) => d.status === "uploaded" || d.status === "processing",
  ).length;
  const reviewed = docs.filter((d) => d.status === "reviewed" || d.status === "submitted").length;
  const hsCodesCount = docs.reduce((sum, d) => sum + ((d as any).commodities?.length || 0), 0);

  const fadeUp = (delay = 0) => ({
          initial: reduce ? false : { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const } as const,});

  return (
    <>
      <motion.div {...fadeUp()} className="mb-10">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 mb-3">
          Dashboard
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
          Trade Document Overview
        </h1>
        <p className="mt-3 text-zinc-500 max-w-xl leading-relaxed">
          Real-time overview of your document processing, extraction accuracy, and export readiness.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: FileText, label: "Documents Processed", value: totalDocs, color: "text-blue-600", bg: "bg-blue-50" },
              { icon: CheckCircle, label: "Avg Confidence", value: `${(avgConfidence * 100).toFixed(0)}%`, color: totalDocs > 0 ? "text-emerald-600" : "text-zinc-400", bg: totalDocs > 0 ? "bg-emerald-50" : "bg-zinc-50" },
              { icon: Hash, label: "Export Ready", value: reviewed, color: reviewed > 0 ? "text-indigo-600" : "text-zinc-400", bg: reviewed > 0 ? "bg-indigo-50" : "bg-zinc-50" },
              { icon: WarningCircle, label: "Pending Review", value: pendingReview, color: pendingReview > 0 ? "text-amber-600" : "text-emerald-600", bg: pendingReview > 0 ? "bg-amber-50" : "bg-emerald-50" },
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

          {/* Recent + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div {...fadeUp(0.3)} className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-900">Recent Documents</h2>
                {docs.length > 0 && (
                  <span className="text-xs text-zinc-400">
                    {reviewed} reviewed · {pendingReview} pending
                  </span>
                )}
              </div>
              {docs.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">
                  No documents yet. Upload your first trade invoice to get started.
                </p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {docs.slice(0, 5).map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={reduce ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        doc.status === "reviewed" || doc.status === "submitted"
                          ? "bg-emerald-50 text-emerald-500"
                          : doc.status === "extracted"
                          ? "bg-blue-50 text-blue-500"
                          : "bg-zinc-100 text-zinc-500"
                      }`}>
                        <div className="h-2 w-2 rounded-full bg-current" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {doc.filename || "Unnamed document"}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {doc.status} · {doc.confidence_avg ? `${(doc.confidence_avg * 100).toFixed(0)}% confidence` : "pending processing"}
                        </p>
                      </div>
                      <span className="text-[11px] text-zinc-300 shrink-0">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div {...fadeUp(0.35)} className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-base font-semibold text-zinc-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a
                  href="/upload"
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <FileText weight="bold" className="h-5 w-5 text-blue-600" />
                  Upload New Document
                </a>
                <a
                  href="/documents"
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <WarningCircle weight="bold" className="h-5 w-5 text-amber-600" />
                  Review Pending Documents
                </a>
                <a
                  href="/exports"
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <CheckCircle weight="bold" className="h-5 w-5 text-emerald-600" />
                  Export Reviewed Documents
                </a>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </>
  );
}
