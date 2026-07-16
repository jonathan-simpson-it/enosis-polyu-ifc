"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [extraction, setExtraction] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const d = await api.getDocument(id);
        setDoc(d);
      } catch (err) {
        console.error("Failed to load document:", err);
      }
    }
    load();
  }, [id]);

  async function handleProcess() {
    try {
      const res = await api.processDocument(id);
      setExtraction(res);
    } catch (err) {
      console.error("Processing failed:", err);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await api.submitToTsw(id);
      alert(`Submitted! TSW Reference: ${res.tsw_reference}`);
      router.push("/documents");
    } catch (err: any) {
      alert(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!doc) return <p className="text-gray-500">Loading document...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Document Review</h1>

      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-4">Declaration Info</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Filename</dt>
            <dd className="font-medium">{doc.filename}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {doc.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Consignor</dt>
            <dd>{doc.consignor_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Consignee</dt>
            <dd>{doc.consignee_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Port of Loading</dt>
            <dd>{doc.port_of_loading || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Port of Discharge</dt>
            <dd>{doc.port_of_discharge || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={handleProcess}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          Run Extraction
        </button>
        {doc.status === "reviewed" && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit to TSW"}
          </button>
        )}
      </div>

      {extraction && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            Extraction Results
            {extraction.needs_review && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                Review Required
              </span>
            )}
          </h2>

          <div className="space-y-6">
            {extraction.entities?.hs_codes?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">HS Codes Detected</h3>
                <div className="flex flex-wrap gap-2">
                  {extraction.entities.hs_codes.map((code: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-mono">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {extraction.entities?.container_numbers?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Container Numbers</h3>
                {extraction.entities.container_numbers.map((n: string, i: number) => (
                  <p key={i} className="font-mono text-sm">{n}</p>
                ))}
              </div>
            )}

            {extraction.confidence_scores && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Confidence Scores</h3>
                <div className="space-y-2">
                  {Object.entries(extraction.confidence_scores).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm w-24 capitalize">{key}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (val as number) >= 0.8 ? "bg-emerald-500" : (val as number) >= 0.5 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${(val as number) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm w-12 text-right">
                        {((val as number) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
