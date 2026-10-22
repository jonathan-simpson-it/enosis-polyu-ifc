"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, fmtUsd } from "@/lib/trading/api";
import type { BuyerSummary } from "@/lib/trading/types";
import { Thumb } from "@/components/trading/Thumb";
import { TRADING_BASE } from "@/lib/trading/base";

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<BuyerSummary[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get<BuyerSummary[]>("/buyers").then(setBuyers).catch(() => setBuyers([]));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return buyers.filter(
      (b) =>
        !needle ||
        b.name.toLowerCase().includes(needle) ||
        b.country.toLowerCase().includes(needle) ||
        (b.subcluster_name ?? "").toLowerCase().includes(needle),
    );
  }, [buyers, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Buyers</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {buyers.length} overseas buyers extracted from the catalog ({buyers.filter((b) => b.n_products > 1).length}{" "}
            with 2 products, the rest singletons). Click through for ranked, explained recommendations.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name, country, cluster…"
          className="w-64 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-indigo-300"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-zinc-100 text-[11px] uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-2.5 font-medium">Buyer</th>
              <th className="px-3 py-2.5 font-medium">Country / region</th>
              <th className="px-3 py-2.5 font-medium">Catalog</th>
              <th className="px-3 py-2.5 font-medium">Price band (USD)</th>
              <th className="px-3 py-2.5 font-medium">Tier</th>
              <th className="px-3 py-2.5 font-medium">Cluster</th>
              <th className="px-3 py-2.5 font-medium">Top match</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-4 py-2">
                  <Link href={`${TRADING_BASE}/buyers/${b.id}`} className="flex items-center gap-2 font-medium text-zinc-800 hover:text-indigo-600">
                    <Thumb src={b.image} alt={b.name} size={30} />
                    <span className="truncate">{b.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-2 text-zinc-600">
                  {b.country}
                  <span className="ml-1 text-[11px] text-zinc-400">{b.trade_bloc !== "Unknown" ? b.trade_bloc : ""}</span>
                </td>
                <td className="tabular px-3 py-2 text-zinc-600">{b.n_products}</td>
                <td className="tabular px-3 py-2 text-zinc-600">
                  {b.price_band?.[0] != null ? `${fmtUsd(b.price_band[0])} to ${fmtUsd(b.price_band[2])}` : "n/a"}
                </td>
                <td className="px-3 py-2 text-zinc-600">{b.brand_tier}</td>
                <td className="px-3 py-2 text-[11px] text-zinc-400">{b.subcluster_name?.split(",").slice(0, 2).join(", ")}</td>
                <td className="px-3 py-2">
                  {b.top_match ? (
                    <Link href={`${TRADING_BASE}/products/${b.top_match.product_id}`} className="flex items-center gap-2 text-zinc-500 hover:text-indigo-600">
                      <Thumb src={b.top_match.image} alt={b.top_match.name} size={26} />
                      <span className="max-w-[180px] truncate text-[12px]">{b.top_match.name}</span>
                    </Link>
                  ) : (
                    <span className="text-zinc-300">n/a</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-6 text-center text-[13px] text-zinc-400">No buyers match.</div>}
      </div>
    </div>
  );
}