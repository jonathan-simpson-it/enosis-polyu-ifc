"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download } from "@phosphor-icons/react";
import { getXlsxTablePreview } from "@/lib/demo-data";

interface DocViewerProps {
  open: boolean;
  onClose: () => void;
  href: string;
  viewerType: "text" | "table" | "pdf" | "ocr";
  label: string;
}

export default function DocViewer({ open, onClose, href, viewerType, label }: DocViewerProps) {
  const [rawText, setRawText] = useState<string | null>(null);
  const [tableView, setTableView] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (viewerType === "text" || viewerType === "ocr" || viewerType === "table") {
      let cancelled = false;
      fetch(href)
        .then((r) => r.text())
        .then((text) => { if (!cancelled) setRawText(text); })
        .catch(() => { if (!cancelled) setRawText("Failed to load document content."); });
      return () => { cancelled = true; };
    }
  }, [open, href, viewerType]);

  const escHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", escHandler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", escHandler);
      document.body.style.overflow = "";
    };
  }, [open, escHandler]);

  function renderCsvTable(text: string) {
    const lines = text.split("\n").filter(Boolean);
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
    return (
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-accent-soft">
              {headers.map((h, i) => (
                <th key={i} className="text-left px-3 py-2 text-muted font-medium border-b border-line whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-line/50 hover:bg-accent-soft/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-ink whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderXlsxTable() {
    const rows = getXlsxTablePreview();
    if (rows.length === 0) return <p className="text-sm text-muted">No preview available.</p>;
    const headers = rows[0];
    const data = rows.slice(1);
    return (
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-accent-soft">
              {headers.map((h, i) => (
                <th key={i} className="text-left px-3 py-2 text-muted font-medium border-b border-line whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} className="border-b border-line/50 hover:bg-accent-soft/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-ink whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[85vh] bg-surface rounded-2xl border border-line shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft shrink-0">
                  <Download weight="bold" className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{label}</p>
                  <p className="text-xs text-muted">
                    {viewerType === "pdf"
                      ? "PDF document"
                      : viewerType === "ocr"
                        ? "OCR-extracted text"
                        : viewerType === "table"
                          ? "Tabular data"
                          : "Plain text"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent-soft transition-colors shrink-0"
              >
                <X weight="bold" className="h-4 w-4 text-muted" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6">
              {viewerType === "pdf" ? (
                <iframe
                  src={href}
                  className="w-full h-[65vh] rounded-xl border border-line"
                  title={label}
                />
              ) : viewerType === "table" && href.endsWith(".xlsx") ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted">
                      Rendered preview of Excel binary
                    </p>
                  </div>
                  {renderXlsxTable()}
                </>
              ) : viewerType === "table" && href.endsWith(".csv") ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setTableView(true)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                        tableView
                          ? "bg-accent-soft text-accent"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Table
                    </button>
                    <button
                      onClick={() => setTableView(false)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                        !tableView
                          ? "bg-accent-soft text-accent"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Raw CSV
                    </button>
                  </div>
                  {tableView && rawText
                    ? renderCsvTable(rawText)
                    : rawText && (
                        <pre className="text-xs font-mono text-ink leading-relaxed whitespace-pre-wrap bg-accent-soft/20 p-4 rounded-xl border border-line max-h-[60vh] overflow-auto">
                          {rawText}
                        </pre>
                      )}
                </>
              ) : (
                <>
                  {viewerType === "ocr" && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-700 mb-3">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      OCR extract, confidence 78%
                    </div>
                  )}
                  <pre className="text-xs font-mono text-ink leading-relaxed whitespace-pre-wrap bg-accent-soft/20 p-4 rounded-xl border border-line max-h-[60vh] overflow-auto">
                    {rawText || "Loading..."}
                  </pre>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-line shrink-0 gap-2">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-muted hover:text-ink transition-colors"
              >
                <Download weight="bold" className="h-3.5 w-3.5" />
                Open original
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
