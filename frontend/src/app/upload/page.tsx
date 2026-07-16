"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Document</h1>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-xl p-16 text-center transition ${
          dragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-300 bg-white hover:border-emerald-400"
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
          <div className="text-5xl mb-4">📄</div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            {uploading ? "Uploading..." : "Drop your file here or click to browse"}
          </p>
          <p className="text-sm text-gray-400">
            PDF, Excel, Image, JSON, or CSV — up to 20MB
          </p>
        </label>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-white border border-emerald-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-emerald-700 mb-3">Upload Successful</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500 w-32">Declaration ID:</dt>
              <dd className="font-mono text-gray-800">{result.declaration_id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-32">Filename:</dt>
              <dd>{result.filename}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-32">Type:</dt>
              <dd className="uppercase">{result.file_type}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500 w-32">Characters:</dt>
              <dd>{result.char_count?.toLocaleString()}</dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.push(`/documents/${result.declaration_id}/review`)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              Review & Process
            </button>
            <button
              onClick={() => router.push("/documents")}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              View All Documents
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
