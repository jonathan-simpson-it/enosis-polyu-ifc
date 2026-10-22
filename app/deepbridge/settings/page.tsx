"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trading/api";
import type { Settings } from "@/lib/trading/types";
import { Pill } from "@/components/trading/badges";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  useEffect(() => {
    api.get<Settings>("/settings").then(setSettings).catch((e) => setStatus(String(e)));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await api.put<{ settings: Settings; batch: { buyers_scored: number; config_hash: string } }>("/settings", {
        weights: settings.weights,
        mmr_lambda: settings.mmr_lambda,
        cap: settings.cap,
        cap_cluster: settings.cap_cluster,
        ranker: settings.ranker,
        alpha: settings.alpha,
        beta: settings.beta,
      });
      setSettings(res.settings);
      setStatus(`Saved & re-scored ${res.batch.buyers_scored} buyers globally (config ${res.batch.config_hash})`);
    } catch (e) {
      setStatus(String(e));
    }
    setSaving(false);
  }

  if (!settings)
    return <div className="p-8 text-center text-[13px] text-zinc-400">{status ?? "Loading settings…"}</div>;

  const blocks = ["content", "market", "feasibility", "visual", "margin", "risk"];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Settings</h1>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          Persisted to the shared SQLite store and used by every ranking. Saving triggers a global batch re-score so the
          concentration caps and stored top-10s stay consistent.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Feature block weights</div>
        <div className="mt-3 space-y-3">
          {blocks.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-[12px] text-zinc-600">
                {k}
                {(k === "margin" || k === "risk") && <span className="ml-1 text-[10px] text-amber-600">stub</span>}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.weights[k] ?? 0}
                onChange={(e) => setSettings({ ...settings, weights: { ...settings.weights, [k]: Number(e.target.value) } })}
                className="flex-1 accent-indigo-600"
              />
              <span className="tabular w-12 text-right text-[12px] text-zinc-700">{(settings.weights[k] ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-zinc-400">
          margin & risk default to 0: including them without cost/credit data would just add noise (they appear in the UI
          as flagged stubs).
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Policy</div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="text-[12px] text-zinc-600">
            MMR lambda (diversity vs relevance)
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.mmr_lambda}
              onChange={(e) => setSettings({ ...settings, mmr_lambda: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 tabular text-[13px]"
            />
          </label>
          <label className="text-[12px] text-zinc-600">
            Shortlist cap: same product per country
            <input
              type="number"
              min={1}
              max={50}
              value={settings.cap}
              onChange={(e) => setSettings({ ...settings, cap: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 tabular text-[13px]"
            />
          </label>
          <label className="text-[12px] text-zinc-600">
            Shortlist cap: same cluster per country
            <input
              type="number"
              min={1}
              max={60}
              value={settings.cap_cluster}
              onChange={(e) => setSettings({ ...settings, cap_cluster: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 tabular text-[13px]"
            />
          </label>
          <label className="text-[12px] text-zinc-600">
            Ranker
            <select
              value={settings.ranker}
              onChange={(e) => setSettings({ ...settings, ranker: e.target.value })}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-[13px]"
            >
              <option value="linear">linear (cold-start prior, exact contributions)</option>
              <option value="ridge">ridge regression (fitted on weak grades, exact contributions)</option>
              <option value="lgbm">LightGBM LambdaMART (falls back if untrained)</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="zinc">MMR caps the conc. of the same product within a country&apos;s top-3 shortlist</Pill>
          <Pill tone="stub">margin floor control: requires cost data</Pill>
          <Pill tone="stub">regional price-tier spacing: requires cost data</Pill>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving & re-scoring…" : "Save & re-score all buyers"}
        </button>
        <button
          onClick={async () => {
            setRecomputing(true);
            try {
              const r = await api.post<{ buyers_scored: number; config_hash: string }>("/score/batch");
              setStatus(`Recomputed: ${r.buyers_scored} buyers, config ${r.config_hash}`);
            } catch (e) {
              setStatus(String(e));
            }
            setRecomputing(false);
          }}
          disabled={recomputing}
          className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-[13px] text-zinc-600 hover:border-zinc-300 disabled:opacity-50"
        >
          {recomputing ? "Recomputing…" : "Recompute batch only"}
        </button>
        {status && <span className="text-[12px] text-zinc-500">{status}</span>}
      </div>

      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-[12px] leading-relaxed text-zinc-500">
        <span className="font-medium text-zinc-600">Upgrade path:</span> when transaction history, factory cost sheets,
        credit data and inventory arrive, the margin/risk weights become live, the α/β profit slider activates, and the
        LTR re-ranker retrains on real conversion labels (repeat=3, order=2, sample=1.5, inquiry=1). The feedback buttons
        on each card are already writing the first labels into the database.
      </div>
    </div>
  );
}