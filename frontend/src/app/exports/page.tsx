"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ExportsPage() {
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    api
      .listDocuments()
      .then((data) => setDocs((data.documents || []).filter((d: any) => d.status === "reviewed" || d.status === "submitted")))
      .catch(console.error);
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
      a.download = `declaration-${id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Exports</h1>

      {docs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-200">
          <p>No reviewed documents ready for export</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-6 py-4">Filename</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="border-t border-gray-100">
                  <td className="px-6 py-4 text-sm">{doc.filename}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleExport(doc.id, "wco_json")}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                    >
                      WCO JSON
                    </button>
                    <button
                      onClick={() => handleExport(doc.id, "tsw_json")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      TSW JSON
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
