"use client";

import type { Confidence } from "@/lib/trading/types";

const CONF_STYLES: Record<Confidence, string> = {
  high: "border-indigo-200 bg-indigo-50 text-indigo-700",
  medium: "border-zinc-200 bg-zinc-100 text-zinc-600",
  low: "border-amber-200 bg-amber-50 text-amber-700",
};

export function ConfidenceBadge({ level, density }: { level: Confidence; density?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${CONF_STYLES[level]}`}
      title={density !== undefined ? `data density ${(density * 100).toFixed(0)}% (image, price, certs, catalog size, visual signal)` : undefined}
    >
      {level} confidence{density !== undefined ? ` · ${(density * 100).toFixed(0)}%` : ""}
    </span>
  );
}

export function Pill({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "zinc" | "amber" | "stub" | "indigo" }) {
  const styles = {
    zinc: "border-zinc-200 bg-white text-zinc-600",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    stub: "border-dashed border-zinc-300 bg-zinc-50 text-zinc-500",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  }[tone];
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] ${styles}`}>{children}</span>;
}

export function TagChip({ label, value, confidence }: { label: string; value: string | null; confidence?: number | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] text-zinc-600">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-700">{value}</span>
      {confidence !== null && confidence !== undefined && (
        <span className="text-zinc-400">{(confidence * 100).toFixed(0)}%</span>
      )}
    </span>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular text-sm font-semibold text-zinc-900">{score.toFixed(3)}</span>
    </div>
  );
}