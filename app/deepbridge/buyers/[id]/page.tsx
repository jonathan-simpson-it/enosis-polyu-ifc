"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, fmtInt, fmtUsd } from "@/lib/trading/api";
import type { BuyerDetail } from "@/lib/trading/types";
import { RecommendationCard } from "@/components/trading/RecommendationCard";
import { Pill } from "@/components/trading/badges";
import { Thumb } from "@/components/trading/Thumb";
import { TRADING_BASE } from "@/lib/trading/base";

export default function BuyerDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<BuyerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    api
      .get<BuyerDetail>(`/buyers/${params.id}`)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [params?.id]);

  if (error) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>;
  if (!data) return <div className="p-8 text-center text-[13px] text-zinc-400">Loading buyer…</div>;

  const b = data.buyer;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Thumb src={b.image} alt={b.name} size={56} rounded="rounded-lg" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">{b.name}</h1>
            <div className="mt-0.5 text-[13px] text-zinc-500">
              {b.country} · {b.region} · {b.trade_bloc !== "Unknown" ? b.trade_bloc : "n/a"} · {b.brand_tier} tier
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Pill tone="zinc">{b.n_products} catalog products</Pill>
              {b.price_band?.[1] != null && <Pill tone="zinc">price band mid {fmtUsd(b.price_band[1])}</Pill>}
              {b.est_monthly_volume != null && <Pill tone="zinc">est. volume {fmtInt(b.est_monthly_volume)}/mo (heuristic)</Pill>}
              {(b.certs_required ?? []).map((c) => (
                <Pill key={c} tone="indigo">
                  requires {c}
                </Pill>
              ))}
              {b.subcluster_name && <Pill tone="zinc">cluster: {b.subcluster_name.split(",").slice(0, 3).join(", ")}</Pill>}
            </div>
          </div>
        </div>
        <Link href={`${TRADING_BASE}/matches?buyer=${b.id}`} className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] text-zinc-600 hover:border-zinc-300">
          Explore a specific pair
        </Link>
      </div>

      {data.batch_stale && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-800">
          Batch policy (caps) was computed with older settings. Re-run recompute on the Settings page to refresh global
          constraints.
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Their catalog: the revealed-preference signal
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {data.products.map((p) => (
            <div key={p.id} className="rounded-md border border-zinc-100 p-3">
              <div className="flex items-center gap-2">
                <Thumb src={p.image} alt={p.name} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-zinc-700">{p.name}</div>
                  <div className="text-[11px] text-zinc-400">
                    {p.species} · {p.product_type} · {p.price_usd != null ? fmtUsd(p.price_usd) : "no price"} ({p.currency || "?"})
                  </div>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wide text-zinc-400">closest supplier products</div>
                {p.top_supplier_matches.map((m) => (
                  <Link
                    key={m.product_id}
                    href={`${TRADING_BASE}/products/${m.product_id}`}
                    className="flex items-center gap-2 rounded p-1 hover:bg-zinc-50"
                  >
                    <Thumb src={m.image} alt={m.name} size={26} />
                    <span className="max-w-[220px] truncate text-[11px] text-zinc-500">{m.name}</span>
                    <span className="tabular ml-auto text-[10px] text-zinc-400">{m.sim.toFixed(3)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500">
            Top 10 recommendations, each score fully decomposed
          </h2>
          <Link href={`${TRADING_BASE}/model?buyer=${b.id}`} className="text-[12px] text-indigo-600 hover:underline">
            re-rank live on the Model page
          </Link>
        </div>
        <div className="space-y-3">
          {data.recommendations.map((r) => (
            <RecommendationCard key={`${r.buyerId}-${r.productId}`} rec={r} />
          ))}
        </div>
      </div>

      {data.why_not && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Why not this?</div>
          <div className="mt-2 flex items-center gap-3">
            <Thumb src={data.why_not.product.image} alt={data.why_not.product.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-zinc-800">{data.why_not.product.name}</div>
              <div className="text-[12px] text-amber-700">{data.why_not.reason}</div>
              <div className="text-[11px] text-zinc-400">{data.why_not.note}</div>
            </div>
            <div className="text-right">
              <div className="tabular text-sm font-semibold text-zinc-700">{data.why_not.score.toFixed(3)}</div>
              <div className="text-[10px] text-zinc-400">score</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(data.why_not.breakdown)
              .filter(([, v]) => v !== null)
              .map(([k, v]) => (
                <span key={k} className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500">
                  {k} <span className="tabular font-medium text-zinc-700">{(v as number).toFixed(2)}</span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}