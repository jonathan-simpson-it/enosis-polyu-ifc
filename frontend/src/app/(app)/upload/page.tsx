"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { UploadSimple, FileText } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export default function UploadPage() {
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await upload(file);
  }, []);

  async function upload(file: File) {
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.uploadDocument(file);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const fadeUp = (delay = 0) => ({
          initial: reduce ? false : { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const } as const,});

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div {...fadeUp()} className="mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 mb-3">
          Upload
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Upload Trade Document
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          PDF invoices, Excel packing lists, or scanned documents
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.1)}>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`relative rounded-2xl border-2 border-dashed p-16 text-center transition-all ${
            dragging
              ? "border-blue-500 bg-blue-50/50"
              : "border-zinc-300 bg-white hover:border-zinc-400"
          }`}
        >
          <input
            type="file"
            id="file-input"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
            accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.json,.csv"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
              {uploading ? (
                <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <UploadSimple weight="bold" className="h-6 w-6 text-zinc-500" />
              )}
            </div>
            <p className="text-base font-medium text-zinc-700 mb-1">
              {uploading ? "Uploading..." : "Drop your file here or click to browse"}
            </p>
            <p className="text-sm text-zinc-400">
              PDF, Excel, Image, JSON, or CSV — up to 20MB
            </p>
          </label>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {error}
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <FileText weight="bold" className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-emerald-800">Upload Successful</h2>
              <p className="text-xs text-emerald-600">{result.filename}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-zinc-500">Declaration ID:</dt>
              <dd className="font-mono text-zinc-800 text-xs">{result.declaration_id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-zinc-500">Type:</dt>
              <dd className="uppercase text-zinc-800">{result.file_type}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-zinc-500">Characters:</dt>
              <dd className="text-zinc-800">{result.char_count?.toLocaleString()}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-zinc-500">Tables detected:</dt>
              <dd className="text-zinc-800">{result.has_tables ? "Yes" : "No"}</dd>
            </div>
          </dl>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => router.push(`/documents/${result.declaration_id}/review`)}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              Review & Process
            </button>
            <button
              onClick={() => router.push("/documents")}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98]"
            >
              View All Documents
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
