"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, CaretDown } from "@phosphor-icons/react";

const SCORE_INFO: Record<string, { label: string; explanation: string }> = {
  hs_codes: {
    label: "HS Codes",
    explanation:
      "Base 75% confidence from regex pattern match (6+ digit code with dots). +5% per code found up to 95% cap. Higher counts suggest richer, more reliable data.",
  },
  containers: {
    label: "Container Numbers",
    explanation:
      "95% confidence when ISO 6346 container format (4 letters + 7 digits) is matched. The check digit is validated against the ISO standard to confirm integrity.",
  },
  weights: {
    label: "Weights",
    explanation:
      "90% confidence when numeric weight values with units (kg, lb, T) are detected next to labeled fields such as 'Gross Weight' or 'Net Weight' in the document.",
  },
  dates: {
    label: "Dates",
    explanation:
      "90% confidence for recognized date formats (DD-MMM-YYYY, YYYY-MM-DD, DD/MM/YYYY). Multiple consistent dates across the document boost confidence.",
  },
  invoice_numbers: {
    label: "Invoice Numbers",
    explanation:
      "97% confidence when an invoice reference pattern (e.g. INV-, INV followed by digits) is detected in the document header region.",
  },
  overall: {
    label: "Overall",
    explanation:
      "Composite score based on data richness: 3+ commodities with 4+ header fields = 88%; 2+ commodities = 80%; 1 commodity = 70%. Max 95% with detected HS codes.",
  },
};

const THRESHOLDS = [
  { min: 0.95, label: "Auto-approved", color: "text-emerald-700", bar: "bg-emerald-500" },
  { min: 0.8, label: "Needs review", color: "text-amber-700", bar: "bg-amber-500" },
  { min: 0, label: "Review required", color: "text-red-700", bar: "bg-red-500" },
];

function getThreshold(score: number) {
  if (score >= 0.95) return THRESHOLDS[0];
  if (score >= 0.8) return THRESHOLDS[1];
  return THRESHOLDS[2];
}

export default function ConfidenceExplainer({
  scores,
  showHeader = true,
}: {
  scores: Record<string, number>;
  showHeader?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const fieldKeys = Object.keys(SCORE_INFO).filter((k) => k !== "overall" && scores[k] != null);

  return (
    <div>
      {showHeader && (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
        >
          <Info weight="bold" className="h-3.5 w-3.5" />
          How are these scores calculated?
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <CaretDown weight="bold" className="h-3 w-3" />
          </motion.span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl border border-line bg-surface space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                  Thresholds
                </p>
                <div className="space-y-1.5">
                  {THRESHOLDS.map((t) => (
                    <div key={t.label} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${t.bar}`} />
                      <span className="font-medium text-ink">{t.label}</span>
                      <span className="text-muted">≥{(t.min * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">
                  Per-field breakdown
                </p>
                <div className="space-y-1">
                  {fieldKeys.map((key) => {
                    const info = SCORE_INFO[key];
                    const isExpanded = expandedKey === key;
                    const thresh = getThreshold(scores[key]);
                    return (
                      <div key={key} className="border border-line rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedKey(isExpanded ? null : key)}
                          className="flex items-center justify-between w-full px-3 py-2 text-left text-xs hover:bg-accent-soft transition-colors"
                        >
                          <span className="font-medium text-ink">{info.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={thresh.color}>
                              {(scores[key] * 100).toFixed(0)}%
                            </span>
                            <motion.span
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <CaretDown weight="bold" className="h-3 w-3 text-muted" />
                            </motion.span>
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <p className="px-3 pb-2 text-xs text-muted leading-relaxed border-t border-line pt-2">
                                {info.explanation}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
