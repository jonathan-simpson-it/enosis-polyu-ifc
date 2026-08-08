"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Download, FileArrowDown } from "@phosphor-icons/react";
import { api, type Declaration } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function ExportsPage() {
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
      .then((data) =>
        setDocs(
          (data.documents || []).filter(
            (d: Declaration) => d.status === "reviewed" || d.status === "submitted",
          ),
        ),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleExport(id: string, format: string) {
    try {
      const res = await api.exportDocument(id, format);
      const blob = new Blob([JSON.stringify(res.export, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `declaration-${id.slice(0, 8)}-${format}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }

  const fadeUp = (delay = 0) => ({
          initial: reduce ? false : { opacity: 0, y: 12 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const } as const,});

  return (
    <div>
      <motion.div {...fadeUp()} className="mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">
          Exports
        </p>
        <h1 className="text-2xl font-display font-semibold tracking-tight text-ink">
          Export Documents
        </h1>
        <p className="mt-1 text-sm text-muted">
          Download reviewed declarations as WCO or TSW schemas
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-accent-soft animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <motion.div {...fadeUp(0.1)} className="rounded-xl border border-line bg-surface p-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
            <FileArrowDown weight="bold" className="h-6 w-6 text-muted" />
          </div>
          <p className="text-base font-medium text-ink mb-1">No documents ready for export</p>
          <p className="text-sm text-muted">
            Review and approve documents first, then export them here
          </p>
        </motion.div>
      ) : (
        <div className="rounded-xl border border-line bg-surface overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted border-b border-line">
                <th className="px-6 py-4 font-medium">Filename</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Confidence</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <motion.tr
                  key={doc.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="border-t border-line hover:bg-accent-soft transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-ink">{doc.filename}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {doc.confidence_avg ? `${(doc.confidence_avg * 100).toFixed(0)}%` : "Not provided"}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleExport(doc.id, "wco_json")}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white transition hover:bg-accent active:scale-[0.98]"
                    >
                      <Download weight="bold" className="h-3.5 w-3.5" />
                      WCO JSON
                    </button>
                    <button
                      onClick={() => handleExport(doc.id, "tsw_json")}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-xs font-semibold text-white transition hover:bg-ink/80 active:scale-[0.98]"
                    >
                      <Download weight="bold" className="h-3.5 w-3.5" />
                      TSW JSON
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
