"use client";

import { useMemo, useState } from "react";
import { api, fmtInt, fmtPct } from "@/lib/trading/api";
import type { Recommendation } from "@/lib/trading/types";
import { ConfidenceBadge, Pill, ScoreRing, TagChip } from "@/components/trading/badges";
import { Thumb } from "@/components/trading/Thumb";
import { Tex } from "@/components/trading/Tex";

const BLOCK_COLORS: Record<string, string> = {
  content: "bg-indigo-500",
  market: "bg-sky-500",
  feasibility: "bg-violet-500",
  visual: "bg-fuchsia-500",
  margin: "bg-zinc-300",
  risk: "bg-zinc-300",
};

const BLOCK_LABELS: Record<string, string> = {
  content: "content",
  market: "market",
  feasibility: "feasibility",
  visual: "visual",
  margin: "margin (stub)",
  risk: "risk (stub)",
};

export function ScoreBreakdownBar({ rec, large = false }: { rec: Recommendation; large?: boolean }) {
  const blocks = useMemo(() => {
    const agg: Record<string, number> = {};
    for (const c of rec.contributions) {
      if (c.data_status === "stub") continue;
      agg[c.block] = (agg[c.block] ?? 0) + c.contribution;
    }
    const total = Object.values(agg).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(agg)
      .map(([block, v]) => ({ block, value: rec.breakdown[block] ?? 0, share: v / total }))
      .sort((a, b) => b.share - a.share);
  }, [rec]);

  return (
    <div>
      <div className={`flex w-full overflow-hidden rounded-full bg-zinc-100 ${large ? "h-4" : "h-2.5"}`}>
        {blocks.map((b) => (
          <div
            key={b.block}
            className={`${BLOCK_COLORS[b.block] ?? "bg-zinc-300"} h-full`}
            style={{ width: `${b.share * 100}%` }}
            title={`${BLOCK_LABELS[b.block]} block · value ${(b.value ?? 0).toFixed(2)} · ${(b.share * 100).toFixed(0)}% of score`}
          />
        ))}
      </div>
      <div className={`flex flex-wrap gap-x-3 gap-y-1 ${large ? "mt-2.5" : "mt-1.5"}`}>
        {blocks.map((b) => (
          <span key={b.block} className={`flex items-center gap-1.5 text-zinc-500 ${large ? "text-[13px]" : "text-[11px]"}`}>
            <span className={`rounded-sm ${BLOCK_COLORS[b.block] ?? "bg-zinc-300"} ${large ? "h-2.5 w-2.5" : "h-2 w-2"}`} />
            {BLOCK_LABELS[b.block]} <span className="tabular text-zinc-700">{(b.value ?? 0).toFixed(2)}</span>
            <span className="tabular text-zinc-400">({(b.share * 100).toFixed(0)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Waterfall({ rec, large = false }: { rec: Recommendation; large?: boolean }) {
  const items = [...rec.contributions].sort((a, b) => b.contribution - a.contribution);
  const max = Math.max(...items.map((i) => i.contribution), 0.0001);
  return (
    <div className={large ? "space-y-1.5" : "space-y-1"}>
      {items.map((c) => (
        <div key={c.feature} className={`flex items-center gap-2 ${large ? "text-[12px]" : "text-[11px]"}`}>
          <span className={`shrink-0 text-right font-medium text-zinc-600 ${large ? "w-32" : "w-28"}`}>{c.feature}</span>
          <div className={`flex-1 rounded-sm bg-zinc-50 ${large ? "h-4" : "h-3"}`}>
            <div
              className={`h-full rounded-sm ${c.data_status === "stub" ? "bg-zinc-300" : "bg-indigo-500/80"}`}
              style={{ width: `${(c.contribution / max) * 100}%` }}
            />
          </div>
          <span className="tabular w-12 shrink-0 text-zinc-500">{c.value.toFixed(2)}</span>
          <span className="tabular w-14 shrink-0 text-right text-zinc-400">w {c.weight.toFixed(3)}</span>
          <span className="tabular w-14 shrink-0 text-right font-medium text-zinc-700">+{c.contribution.toFixed(3)}</span>
          {c.data_status === "stub" && <span className="text-[10px] text-amber-600">stub</span>}
        </div>
      ))}
    </div>
  );
}

export function MatchedEvidence({ rec }: { rec: Recommendation }) {
  return (
    <div className="space-y-2">
      {rec.evidence.matchedBuyerProducts.map((m) => (
        <div key={m.id} className="flex items-center gap-2">
          <Thumb src={m.image} alt={m.name} size={36} />
          <div className="min-w-0">
            <div className="truncate text-[12px] text-zinc-700">{m.name}</div>
            <div className="tabular text-[11px] text-zinc-400">similarity {m.sim.toFixed(3)}</div>
          </div>
        </div>
      ))}
      {rec.evidence.matchedTokens.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {rec.evidence.matchedTokens.map((t) => (
            <span key={t} className="rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[11px] text-indigo-700">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function VisualEvidence({
  rec,
  large = false,
}: {
  rec: Recommendation;
  large?: boolean;
}) {
  const v = rec.evidence.visualEvidence;
  if (!v) return <div className="text-[12px] text-zinc-400">No visual signal for this pair (image missing or vision not precomputed).</div>;
  const size = large ? 120 : 56;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <Thumb src={v.supplierImage} alt="supplier product" size={size} rounded="rounded-lg" />
          <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-400">supplier</div>
        </div>
        <div className="text-center">
          <div className={`tabular font-semibold text-zinc-700 ${large ? "text-lg" : "text-[11px]"}`}>{v.visualSim.toFixed(3)}</div>
          <div className="text-[10px] text-zinc-400">cosine</div>
        </div>
        <div className="text-center">
          <Thumb src={v.buyerImage} alt="buyer's product" size={size} rounded="rounded-lg" />
          <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-400">buyer&apos;s item</div>
        </div>
      </div>
      <div className="text-[11px] text-zinc-400">{v.source}</div>
    </div>
  );
}

export function CommercialReasoning({ rec }: { rec: Recommendation }) {
  return (
    <ul className="space-y-1 text-[12px] leading-snug text-zinc-600">
      {rec.evidence.marketNotes.map((n, i) => (
        <li key={i}>{n}</li>
      ))}
    </ul>
  );
}

export function EvidencePanel({ rec }: { rec: Recommendation }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Matched evidence from buyer catalog
        </div>
        <MatchedEvidence rec={rec} />
      </div>
      <div className="space-y-3">
        {rec.evidence.visualEvidence && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Visual similarity</div>
            <VisualEvidence rec={rec} />
          </div>
        )}
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Commercial reasoning
          </div>
          <CommercialReasoning rec={rec} />
        </div>
      </div>
    </div>
  );
}

export function ConstraintsPanel({ rec }: { rec: Recommendation }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {rec.constraints.passed.map((c, i) => (
        <Pill key={`p${i}`} tone="zinc">{c}</Pill>
      ))}
      {rec.constraints.failed.map((c, i) => (
        <Pill key={`f${i}`} tone="amber">{c}</Pill>
      ))}
      {rec.constraints.policy.map((c, i) => (
        <Pill key={`pol${i}`} tone="indigo">{c}</Pill>
      ))}
    </div>
  );
}

export function ProfitPanel({ rec }: { rec: Recommendation }) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Profit equation</span>
        <Pill tone="amber">requires cost data</Pill>
      </div>
      <div className="mt-1.5">
        <Tex tex={rec.profit.formula} block className="text-zinc-700" />
      </div>
      <ul className="mt-2 space-y-0.5">
        {Object.entries(rec.profit.assumptions).map(([k, v]) => (
          <li key={k} className="text-[11px] text-zinc-500">
            <span className="font-medium text-zinc-600">{k}:</span> {v}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeedbackButtons({ rec }: { rec: Recommendation }) {
  const [sent, setSent] = useState<string | null>(null);
  const actions = [
    { key: "send", label: "Send to buyer" },
    { key: "quote", label: "Add to quote" },
    { key: "not_relevant", label: "Not relevant" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => (
        <button
          key={a.key}
          onClick={async () => {
            try {
              await api.post("/feedback", { buyer_id: rec.buyerId, product_id: rec.productId, action: a.key });
              setSent(a.key);
            } catch {
              setSent("error");
            }
          }}
          className={`rounded-md border px-2.5 py-1 text-[12px] ${
            sent === a.key
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
          }`}
        >
          {sent === a.key ? `${a.label} · logged` : a.label}
        </button>
      ))}
      {sent === "error" && <span className="text-[11px] text-amber-600">feedback failed to store</span>}
    </div>
  );
}

export function RecommendationCard({ rec, showBuyer = false }: { rec: Recommendation; showBuyer?: boolean }) {
  const [open, setOpen] = useState(false);
  const p = rec.product;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex gap-4">
        <Thumb src={p.image} alt={p.name} size={72} rounded="rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {rec.rank !== undefined && (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500">
                    #{rec.rank}
                  </span>
                )}
                <span className="truncate text-[13px] font-semibold text-zinc-900">{p.name}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
                <span>{p.supplier_name}</span>
                <span className="text-zinc-300">|</span>
                <span>{p.supplier_type ?? "unknown type"} · est. {p.supplier_since ?? "n/a"}</span>
                <span className="text-zinc-300">|</span>
                <span>MOQ {fmtInt(p.moq)} {p.moq_unit}</span>
                <span className="text-zinc-300">|</span>
                <span className={p.price_source === "real" ? "text-zinc-600" : "text-amber-600"}>{p.price_display}</span>
                {showBuyer && (
                  <>
                    <span className="text-zinc-300">|</span>
                    <span className="font-medium text-zinc-700">{rec.buyer.name}</span>
                    <span>{rec.buyer.country}</span>
                  </>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <TagChip label="species" value={rec.tags.species} />
                <TagChip label="type" value={rec.tags.productType} />
                <TagChip label="color" value={rec.tags.color} />
                {p.certs.slice(0, 3).map((c) => (
                  <Pill key={c} tone="zinc">{c}</Pill>
                ))}
                {p.tags_source === "clip" && <Pill tone="indigo">tags: CLIP zero-shot</Pill>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <ScoreRing score={rec.score} />
              <div className="mt-1 text-[11px] text-zinc-500">
                P(convert) <span className="tabular font-medium text-zinc-700">{fmtPct(rec.calibratedConversion)}</span>
              </div>
              <div className="mt-1">
                <ConfidenceBadge level={rec.confidence} density={rec.confidenceDensity} />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <ScoreBreakdownBar rec={rec} />
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="mt-3 w-full rounded-md border border-zinc-200 bg-zinc-50 py-1.5 text-[12px] font-medium text-zinc-600 hover:border-zinc-300"
      >
        {open ? "Hide explanation" : "Why this?"}
      </button>

      {open && (
        <div className="mt-3 space-y-4 border-t border-zinc-100 pt-3">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Score decomposition: exact contribution waterfall (weight x value)
            </div>
            <Waterfall rec={rec} />
          </div>
          <EvidencePanel rec={rec} />
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Constraints & policy
            </div>
            <ConstraintsPanel rec={rec} />
          </div>
          <ProfitPanel rec={rec} />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span>ranker: {rec.rankerVersion}</span>
              <span>·</span>
              <span>labels: {rec.labelSource}</span>
              <span>·</span>
              <span>model: {rec.modelVersion}</span>
            </div>
            <FeedbackButtons rec={rec} />
          </div>
        </div>
      )}
    </div>
  );
}