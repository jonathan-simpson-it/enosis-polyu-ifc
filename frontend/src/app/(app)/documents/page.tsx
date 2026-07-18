"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { FileText } from "@phosphor-icons/react";
import { api, type Declaration } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function DocumentsPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [docs, setDocs] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteConfirm(null);
      setDeleting(false);
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      uploaded: "bg-accent-soft text-muted",
      processing: "bg-amber-100 text-amber-700",
      extracted: "bg-accent-soft text-accent",
      reviewed: "bg-emerald-100 text-emerald-700",
      submitted: "bg-emerald-100 text-emerald-700",
    };
    return map[status] || "bg-accent-soft text-muted";
  }

  function confidenceColor(val: number | null) {
    if (val === null) return "";
    if (val >= 0.95) return "text-emerald-600";
    if (val >= 0.8) return "text-amber-600";
    return "text-red-600";
  }

  const fadeUp = (delay = 0) => ({
          initial: reduce ? false : { opacity: 0, y: 12 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const } as const,});

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">
            Documents
          </p>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-ink">
            Trade Documents
          </h1>
        </div>
        <Link
          href="/upload"
          className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent active:scale-[0.98]"
        >
          + Upload New
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-accent-soft animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <motion.div {...fadeUp()} className="rounded-xl border border-line bg-surface p-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
            <FileText weight="bold" className="h-6 w-6 text-muted" />
          </div>
          <p className="text-base font-medium text-ink mb-1">No documents uploaded yet</p>
          <p className="text-sm text-muted mb-4">
            Upload your first trade invoice or packing list
          </p>
          <Link
            href="/upload"
            className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent active:scale-[0.98]"
          >
            Upload a Document
          </Link>
        </motion.div>
      ) : (
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted border-b border-line">
                <th className="px-6 py-4 font-medium">Filename</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Confidence</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <motion.tr
                  key={doc.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  className="border-t border-line hover:bg-accent-soft transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/documents/${doc.id}/review`}
                      className="text-sm font-medium text-accent hover:text-accent"
                    >
                      {doc.filename || "Unnamed"}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm uppercase text-muted">{doc.file_type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusBadge(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium ${confidenceColor(doc.confidence_avg)}`}>
                    {doc.confidence_avg ? `${(doc.confidence_avg * 100).toFixed(0)}%` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      className="text-sm text-red-500 hover:text-red-700 transition"
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-line bg-surface p-6 shadow-lg max-w-sm w-full mx-4"
          >
            <h3 className="text-base font-semibold text-ink mb-2">Delete Document</h3>
            <p className="text-sm text-muted mb-6">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="inline-flex h-9 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:bg-accent-soft"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="inline-flex h-9 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
