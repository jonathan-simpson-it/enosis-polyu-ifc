"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trading/api";
import type { Metrics } from "@/lib/trading/types";
import { Pill } from "@/components/trading/badges";

const ORDER = [
  "random",
  "content-only",
  "+market",
  "+feasibility",
  "+visual",
  "full linear (no MMR)",
  "full + MMR",
  "full + MMR + caps (batch)",
  "ridge regression (fitted, weak labels)",
];

function Bar({ value, max, tone }: { value: number; max: number; tone: string }) {
  return (
    <div className="h-2.5 w-full rounded-sm bg-zinc-50">
      <div className={`h-full rounded-sm ${tone}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

export default function EvaluationPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Metrics>("/metrics").then(setMetrics).catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>;
  if (!metrics) return <div className="p-8 text-center text-[13px] text-zinc-400">Running evaluation…</div>;

  const variants = ORDER.filter((k) => k in metrics.variants);
  const maxRecall = Math.max(...Object.values(metrics.variants).map((v) => v.recall_at_10));
  const maxNdcg = Math.max(...Object.values(metrics.variants).map((v) => v.ndcg_at_10));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Offline evaluation & ablations</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-zinc-500">
          Generated {new Date(metrics.generated_at).toLocaleString()}. Each row adds one component to the scorer and is
          evaluated over all 65 buyers: this is the honest ablation table, showing which block actually earns its weight.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Weak-supervision disclosure</span>
          <Pill tone="amber">no real conversion labels</Pill>
        </div>
        <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-zinc-500">
          {metrics.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-zinc-100 text-[11px] uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-2.5 font-medium">Variant</th>
              <th className="px-3 py-2.5 font-medium">Recall@10 (proxy)</th>
              <th className="px-3 py-2.5 font-medium">NDCG@10 (weak)</th>
              <th className="px-3 py-2.5 font-medium">Catalog coverage</th>
              <th className="px-3 py-2.5 font-medium">Intra-list diversity</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((k) => {
              const v = metrics.variants[k];
              return (
                <tr key={k} className="border-b border-zinc-50">
                  <td className="px-4 py-2.5 font-medium text-zinc-700">{k}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="tabular w-10 text-zinc-700">{v.recall_at_10.toFixed(3)}</span>
                      <Bar value={v.recall_at_10} max={maxRecall} tone="bg-indigo-500/80" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="tabular w-10 text-zinc-700">{v.ndcg_at_10.toFixed(3)}</span>
                      <Bar value={v.ndcg_at_10} max={maxNdcg} tone="bg-sky-500/80" />
                    </div>
                  </td>
                  <td className="tabular px-3 py-2.5 text-zinc-600">{(v.coverage * 100).toFixed(0)}%</td>
                  <td className="tabular px-3 py-2.5 text-zinc-600">{(v.intra_list_diversity * 100).toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">How to read this</div>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-zinc-500">
            <li>
              <span className="font-medium text-zinc-700">Content-only</span> aces the similarity-derived proxy labels by
              construction: the interesting comparisons are policy rows.
            </li>
            <li>
              <span className="font-medium text-zinc-700">+market / +feasibility</span> trade a little proxy recall for
              commercial realism (certs, MOQ) that the proxy cannot see.
            </li>
            <li>
              <span className="font-medium text-zinc-700">MMR & caps</span> buy diversity (+7pp) and coverage, at a recall
              cost on a proxy metric that does not reward diversification.
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Baselines</div>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-zinc-500">
            <li>
              <span className="font-medium text-zinc-700">Random</span>: the floor every component must beat. It beats
              the business baseline only by luck.
            </li>
            <li>
              <span className="font-medium text-zinc-700">Category-match only</span>: collapses on this dataset, all 100
              buyer products share the same category, so it degenerates to a weaker random.
            </li>
            <li>
              <span className="font-medium text-zinc-700">Top-selling stand-in</span>: needs transaction logs; flagged as
              Phase 2 when sales-rep data arrives.
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Online plan (pilot)</div>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-zinc-500">
            <li>Primary: conversion lift relative to each buyer&apos;s own trailing baseline (per the brief).</li>
            <li>Secondary: reply rate, sample requests, risk-adjusted profit per recommendation.</li>
            <li>Guardrails: concentration caps, margin floor violations, complaint rate.</li>
            <li>Evidence: salesperson acceptance rate of the explanation reasons.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}