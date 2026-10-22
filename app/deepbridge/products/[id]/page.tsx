"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, fmtInt } from "@/lib/trading/api";
import type { Recommendation } from "@/lib/trading/types";
import { RecommendationCard } from "@/components/trading/RecommendationCard";
import { Pill, TagChip } from "@/components/trading/badges";
import { Thumb } from "@/components/trading/Thumb";
import { TRADING_BASE } from "@/lib/trading/base";

interface ProductDetailResponse {
  product: Recommendation["product"];
  subcluster_name: string;
  buyers: Recommendation[];
  stats: { scored_buyers: number; batch_top10_count: number };
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    api
      .get<ProductDetailResponse>(`/products/${params.id}`)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [params?.id]);

  if (error) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>;
  if (!data) return <div className="p-8 text-center text-[13px] text-zinc-400">Loading product…</div>;

  const p = data.product;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex gap-2">
          {(p.images.length > 0 ? p.images : [p.image]).filter(Boolean).slice(0, 3).map((img, i) => (
            <Thumb key={i} src={img} alt={p.name} size={i === 0 ? 88 : 56} rounded="rounded-lg" />
          ))}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">{p.name}</h1>
          <div className="mt-0.5 text-[13px] text-zinc-500">
            {p.supplier_name} · {p.supplier_type ?? "type n/a"} · established {p.supplier_since ?? "n/a"} · {p.supplier_country}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <TagChip label="species" value={p.species} />
            <TagChip label="type" value={p.product_type} />
            <TagChip label="color" value={p.color} />
            <Pill tone="zinc">
              MOQ {fmtInt(p.moq)} {p.moq_unit}
            </Pill>
            <Pill tone={p.price_source === "real" ? "zinc" : "amber"}>{p.price_display}</Pill>
            {p.certs.map((c) => (
              <Pill key={c} tone="zinc">
                {c}
              </Pill>
            ))}
            <Pill tone="zinc">cluster: {data.subcluster_name?.split(",").slice(0, 3).join(", ")}</Pill>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            Batch status: in {data.stats.batch_top10_count} of {data.stats.scored_buyers} buyers&apos; stored top-10 ·
            ranked list below is scored for all buyers with the current settings
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Parsed specification</div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
            {Object.entries(p.specs).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-zinc-400">{k}</span>
                <span className="truncate text-zinc-700">{v}</span>
              </div>
            ))}
            {Object.keys(p.specs).length === 0 && <span className="text-zinc-400">No structured spec parsed.</span>}
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Data notes</div>
          <ul className="mt-2 space-y-1 text-[12px] text-zinc-500">
            <li>Price source: {p.price_source}. {p.price_source === "real" ? "Parsed from the listing." : "86% of the supplier catalog shows 'Contact for Quotation'."}</li>
            <li>Tags source: {p.tags_source} {p.tag_confidence != null ? `(confidence ${(p.tag_confidence * 100).toFixed(0)}%)` : ""}. Keyword-derived baseline; CLIP zero-shot refines gaps after vision precompute.</li>
            <li>MOQ units normalized from raw remark text; unit kept as categorical to avoid comparing bags to pieces blindly</li>
          </ul>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-zinc-500">
          Ranked buyers for this product, same explanation components
        </h2>
        <div className="space-y-3">
          {data.buyers.map((r) => (
            <RecommendationCard key={`${r.buyerId}-${r.productId}`} rec={r} showBuyer />
          ))}
        </div>
        <div className="mt-3 text-center">
          <Link href={`${TRADING_BASE}/buyers`} className="text-[12px] text-indigo-600 hover:underline">
            browse all buyers
          </Link>
        </div>
      </div>
    </div>
  );
}