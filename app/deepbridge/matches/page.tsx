"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/trading/api";
import type { BuyerSummary, ProductSummary, Recommendation } from "@/lib/trading/types";
import { RecommendationCard } from "@/components/trading/RecommendationCard";
import { Thumb } from "@/components/trading/Thumb";

function MatchExplorerInner() {
  const search = useSearchParams();
  const [buyers, setBuyers] = useState<BuyerSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [buyerId, setBuyerId] = useState<string>("");
  const [productId, setProductId] = useState<number | "">("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    key: string;
    reco: Recommendation | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    Promise.all([api.get<BuyerSummary[]>("/buyers"), api.get<ProductSummary[]>("/products")])
      .then(([b, p]) => {
        setBuyers(b);
        setProducts(p);
        const pre = search.get("buyer");
        setBuyerId(pre && b.some((x) => x.id === pre) ? pre : b[0]?.id ?? "");
      })
      .catch((e) => setLoadError(String(e)));
  }, [search]);

  const sortedProducts = useMemo(() => products, [products]);
  const selectedKey = buyerId !== "" && productId !== "" ? `${buyerId}|${productId}` : null;

  useEffect(() => {
    if (!selectedKey) return;
    let cancelled = false;
    const key = selectedKey;
    api
      .get<Recommendation>(`/explain?buyer_id=${buyerId}&product_id=${productId}`)
      .then((r) => {
        if (!cancelled) setResult({ key, reco: r, error: null });
      })
      .catch((e) => {
        if (!cancelled) setResult({ key, reco: null, error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedKey, buyerId, productId]);

  const buyer = buyers.find((b) => b.id === buyerId);
  const product = products.find((p) => p.id === productId);
  const reco = result && result.key === selectedKey ? result.reco : null;
  const error = loadError ?? (result && result.key === selectedKey ? result.error : null);
  const loading = selectedKey !== null && (!result || result.key !== selectedKey);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Match explorer</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-zinc-500">
          Pick any buyer and any supplier product to see the complete decomposition for that exact pair, including pairs
          the model did not rank highly. This is the audit view: nothing is hidden.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <label className="text-[12px] font-medium text-zinc-600">
          Buyer
          <select
            value={buyerId}
            onChange={(e) => setBuyerId(e.target.value)}
            className="ml-2 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[13px]"
          >
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.country}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px] font-medium text-zinc-600">
          Product
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
            className="ml-2 max-w-[380px] rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[13px]"
          >
            <option value="">Select a product…</option>
            {sortedProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.slice(0, 70)}
              </option>
            ))}
          </select>
        </label>
        {buyer && (
          <div className="ml-auto flex items-center gap-2 text-[12px] text-zinc-500">
            <Thumb src={buyer.image} alt={buyer.name} size={28} />
            {buyer.country} · {buyer.n_products} catalog products
          </div>
        )}
      </div>

      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}
      {loading && <div className="p-6 text-center text-[13px] text-zinc-400">Scoring pair…</div>}
      {reco && !loading && <RecommendationCard rec={reco} showBuyer />}
      {!reco && !loading && productId === "" && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-[13px] text-zinc-400">
          Select a product to score the pair. Tip: start from a buyer page to see their ranked list first.
          {product && <span> · {product.name}</span>}
        </div>
      )}
    </div>
  );
}

export default function MatchExplorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[13px] text-zinc-400">Loading match explorer…</div>}>
      <MatchExplorerInner />
    </Suspense>
  );
}