"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, fmtInt } from "@/lib/trading/api";
import type { ProductSummary } from "@/lib/trading/types";
import { Pill } from "@/components/trading/badges";
import { Thumb } from "@/components/trading/Thumb";
import { TRADING_BASE } from "@/lib/trading/base";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");

  useEffect(() => {
    api.get<ProductSummary[]>("/products").then(setProducts).catch(() => setProducts([]));
  }, []);

  const types = useMemo(() => ["all", ...Array.from(new Set(products.map((p) => p.product_type))).sort()], [products]);
  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return products.filter(
      (p) =>
        (type === "all" || p.product_type === type) &&
        (!needle ||
          p.name.toLowerCase().includes(needle) ||
          p.supplier_name.toLowerCase().includes(needle) ||
          (p.subcluster_name ?? "").toLowerCase().includes(needle)),
    );
  }, [products, q, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Supplier products</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {products.length} Canton Fair factory products. Tags are keyword-derived today, CLIP zero-shot after vision
            precompute. Click a product for the reverse view: which buyers should carry it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[13px]"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter products…"
            className="w-56 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-indigo-300"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-zinc-100 text-[11px] uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-3 py-2.5 font-medium">Supplier</th>
              <th className="px-3 py-2.5 font-medium">Tags</th>
              <th className="px-3 py-2.5 font-medium">MOQ</th>
              <th className="px-3 py-2.5 font-medium">Price</th>
              <th className="px-3 py-2.5 font-medium">Cluster</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                <td className="px-4 py-2">
                  <Link href={`${TRADING_BASE}/products/${p.id}`} className="flex items-center gap-2 font-medium text-zinc-800 hover:text-indigo-600">
                    <Thumb src={p.image} alt={p.name} size={34} />
                    <span className="max-w-[320px] truncate">{p.name}</span>
                  </Link>
                </td>
                <td className="max-w-[180px] truncate px-3 py-2 text-zinc-500">{p.supplier_name}</td>
                <td className="px-3 py-2">
                  <span className="flex gap-1">
                    <Pill tone="zinc">{p.species}</Pill>
                    <Pill tone="zinc">{p.product_type}</Pill>
                  </span>
                </td>
                <td className="tabular px-3 py-2 text-zinc-600">
                  {fmtInt(p.moq)} {p.moq_unit}
                </td>
                <td className={`px-3 py-2 ${p.price_display === "Contact for quotation" ? "text-amber-600" : "text-zinc-600"}`}>
                  {p.price_display}
                </td>
                <td className="px-3 py-2 text-[11px] text-zinc-400">{p.subcluster_name?.split(",").slice(0, 2).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-6 text-center text-[13px] text-zinc-400">No products match.</div>}
      </div>
    </div>
  );
}