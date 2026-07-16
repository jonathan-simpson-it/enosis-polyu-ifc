"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listDocuments()
      .then((data) => setDocs(data.documents || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await api.deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <Link
          href="/upload"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
        >
          + Upload New
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-200">
          <p className="text-lg mb-2">No documents uploaded yet</p>
          <Link href="/upload" className="text-emerald-600 hover:underline text-sm">
            Upload your first document
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-6 py-4">Filename</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    <Link href={`/documents/${doc.id}/review`} className="hover:text-emerald-600">
                      {doc.filename || "N/A"}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm uppercase">{doc.file_type}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        doc.status === "submitted"
                          ? "bg-emerald-100 text-emerald-700"
                          : doc.status === "processing"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {doc.confidence_avg
                      ? `${(doc.confidence_avg * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
