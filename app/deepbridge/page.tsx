"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, fmtInt } from "@/lib/trading/api";
import type { BuyerSummary, Health, ProductSummary } from "@/lib/trading/types";
import { Thumb } from "@/components/trading/Thumb";
import { Pill } from "@/components/trading/badges";
import { TRADING_BASE } from "@/lib/trading/base";

export default function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [buyers, setBuyers] = useState<BuyerSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get<Health>("/health"), api.get<BuyerSummary[]>("/buyers"), api.get<ProductSummary[]>("/products")])
      .then(([h, b, p]) => {
        setHealth(h);
        setBuyers(b);
        setProducts(p);
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        ML service unreachable. Start it with <code className="font-mono">npm run dev:ml</code> (port 8000). {error}
      </div>
    );

  const topBuyers = [...buyers].sort((a, b) => (b.n_products ?? 0) - (a.n_products ?? 0)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Recommendation engine overview</h1>
          <Link
            href={`${TRADING_BASE}/tour`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700"
          >
            Start the explainability tour →
          </Link>
        </div>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-zinc-500">
          Two-stage explainable recommender matching 100 Canton Fair factory products to 65 overseas buyers who already
          sell pet products. Every score is decomposed into its features, weights and matched evidence. This is a sales
          tool, not a black box.
        </p>
      </div>

      {health && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Supplier products", value: health.counts.supplier_products, note: `${health.counts.suppliers} Chinese suppliers` },
            { label: "Buyers", value: health.counts.buyers, note: `${health.counts.buyer_products} catalog products` },
            { label: "Pair scores computed", value: health.counts.pair_features, note: "buyer x product feature rows" },
            { label: "Recommendations generated", value: health.counts.matches, note: "top-10 per buyer, batch" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{s.label}</div>
              <div className="tabular mt-1 text-xl font-semibold text-zinc-900">{fmtInt(s.value ?? 0)}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{s.note}</div>
            </div>
          ))}
        </div>
      )}

      {health && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Pipeline status</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill tone={health.vision.pairs_with_visual > 0 ? "indigo" : "stub"}>
              vision: {health.vision.pairs_with_visual > 0 ? `${health.vision.pairs_with_visual} pairs with CLIP visual similarity` : "not precomputed yet; run npm run vision"}
            </Pill>
            <Pill tone="zinc">ranker: {health.ranker}</Pill>
            <Pill tone={health.lgbm.trained ? "indigo" : "stub"}>
              LTR: {health.lgbm.trained ? `trained (synthetic labels, NDCG@10 ${health.lgbm.valid_ndcg_at_10})` : "scaffold only: linear fallback active"}
            </Pill>
            <Pill tone="zinc">config {health.config_hash}</Pill>
          </div>
          <div className="mt-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-[12px] leading-relaxed text-zinc-500">
            <span className="font-medium text-zinc-600">Data honesty:</span> the provided dataset has no transactions and no
            conversion labels. Phase-1 runs on content similarity + a weighted linear scorer (exact contribution waterfall).
            LightGBM LambdaMART is wired as a pluggable re-ranker trained on weak labels. Margin, credit risk, seasonality
            and bulk pricing are shown as stubs until cost/transaction data exists.
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Buyers with richest catalogs</div>
            <Link href={`${TRADING_BASE}/buyers`} className="text-[12px] text-indigo-600 hover:underline">
              all buyers
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {topBuyers.map((b) => (
              <Link key={b.id} href={`${TRADING_BASE}/buyers/${b.id}`} className="flex items-center gap-3 rounded-md p-1 hover:bg-zinc-50">
                <Thumb src={b.top_match?.image ?? b.image} alt={b.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-zinc-800">{b.name}</div>
                  <div className="text-[11px] text-zinc-400">
                    {b.country} · {b.n_products} products · {b.subcluster_name?.split(",")[0] ?? ""}
                  </div>
                </div>
                <span className="text-[11px] text-zinc-400">top match {b.top_match?.name.slice(0, 24) ?? "n/a"}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">How a recommendation is built</div>
            <Link href={`${TRADING_BASE}/model`} className="text-[12px] text-indigo-600 hover:underline">
              model details
            </Link>
          </div>
          <ol className="mt-3 space-y-3 text-[12px] leading-relaxed text-zinc-600">
            <li>
              <span className="font-semibold text-zinc-800">1 · Candidate generation.</span> BM25 + TF-IDF (word + char
              n-grams) + structured attribute cosine + CLIP visual similarity produce ~40 candidates per buyer. Cold-start
              safe: no transaction history needed.
            </li>
            <li>
              <span className="font-semibold text-zinc-800">2 · Re-ranking.</span> Weighted linear scorer (or LightGBM
              LambdaMART when labels exist) combines content, market fit, feasibility and visual blocks. Contributions are
              exact: weight x value.
            </li>
            <li>
              <span className="font-semibold text-zinc-800">3 · Business policy.</span> MMR diversity, shortlist
              concentration caps per region, MOQ feasibility notes. Margin floor and risk-adjusted profit are stubs until
              cost data arrives.
            </li>
          </ol>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Example catalog products</div>
        <div className="mt-2 grid gap-2 md:grid-cols-5">
          {products.slice(0, 10).map((p) => (
            <Link key={p.id} href={`${TRADING_BASE}/products/${p.id}`} className="rounded-md border border-zinc-100 p-2 hover:border-zinc-300">
              <Thumb src={p.image} alt={p.name} size={54} />
              <div className="mt-1 line-clamp-2 text-[11px] leading-tight text-zinc-600">{p.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}