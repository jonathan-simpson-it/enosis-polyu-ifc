"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trading/api";
import type { BuyerDetail, Health, Metrics, Recommendation, Settings } from "@/lib/trading/types";
import {
  CommercialReasoning,
  ConstraintsPanel,
  FeedbackButtons,
  MatchedEvidence,
  ProfitPanel,
  RecommendationCard,
  ScoreBreakdownBar,
  VisualEvidence,
  Waterfall,
} from "@/components/trading/RecommendationCard";
import { ConfidenceBadge, Pill, TagChip } from "@/components/trading/badges";
import { Thumb } from "@/components/trading/Thumb";
import { Tex } from "@/components/trading/Tex";
import { TRADING_BASE } from "@/lib/trading/base";

const BUYER = "zuvo";
const PRODUCT = 88;

interface TourData {
  rec: Recommendation;
  buyer: BuyerDetail;
  metrics: Metrics;
  health: Health;
  settings: Settings;
}

interface MathBlock {
  label?: string;
  tex: string;
  note?: string;
  wide?: boolean;
}

interface Step {
  kicker: string;
  title: string;
  bullets: string[];
  math?: MathBlock[];
  tip?: string;
  visual: React.ReactNode;
}

function TourRerankWidget({ settings }: { settings: Settings }) {
  const [weights, setWeights] = useState({
    content: settings.weights.content ?? 0.5,
    market: settings.weights.market ?? 0.2,
    feasibility: settings.weights.feasibility ?? 0.2,
    visual: settings.weights.visual ?? 0.1,
  });
  const [lam, setLam] = useState(settings.mmr_lambda ?? 0.7);
  const [list, setList] = useState<Recommendation[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function rerank(w = weights, l = lam) {
    setBusy(true);
    try {
      const r = await api.post<{ recommendations: Recommendation[] }>("/rank", {
        buyer_id: BUYER,
        weights: w,
        mmr_lambda: l,
        limit: 5,
      });
      setList(r.recommendations);
    } catch {
      setList(null);
    }
    setBusy(false);
  }

  useEffect(() => {
    let cancelled = false;
    api
      .post<{ recommendations: Recommendation[] }>("/rank", {
        buyer_id: BUYER,
        weights: settings.weights,
        mmr_lambda: settings.mmr_lambda ?? 0.7,
        limit: 5,
      })
      .then((r) => {
        if (!cancelled) setList(r.recommendations);
      })
      .catch(() => {
        if (!cancelled) setList(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-4">
        {(
          [
            ["content", "Content similarity"],
            ["market", "Market fit"],
            ["feasibility", "Feasibility"],
            ["visual", "Visual similarity (CLIP)"],
          ] as const
        ).map(([k, label]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-[13px] text-zinc-600">{label}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={weights[k]}
              onChange={(e) => {
                const nw = { ...weights, [k]: Number(e.target.value) };
                setWeights(nw);
                rerank(nw, lam);
              }}
              className="flex-1 accent-indigo-600"
            />
            <span className="tabular w-10 text-right text-[13px] text-zinc-700">{weights[k].toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0 text-[13px] text-zinc-600">MMR lambda (diversity)</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={lam}
            onChange={(e) => {
              setLam(Number(e.target.value));
              rerank(weights, Number(e.target.value));
            }}
            className="flex-1 accent-indigo-600"
          />
          <span className="tabular w-10 text-right text-[13px] text-zinc-700">{lam.toFixed(2)}</span>
        </div>
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-2 text-[11px] text-zinc-500">
          Each move re-scores all 100 candidate products for Zuvo from precomputed pair features (6,500 rows in memory).
          No re-encoding, no model reload: the scorer is a weighted sum.
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Zuvo top 5, live (MMR-diversified final order)
          </span>
          {busy && <span className="text-[11px] text-zinc-400">scoring…</span>}
        </div>
        <div className="space-y-2">
          {list?.map((r, i) => (
            <div key={r.productId} className="flex items-center gap-2 rounded-md border border-zinc-100 p-2">
              <span className="w-6 text-[12px] text-zinc-400">#{i + 1}</span>
              <Thumb src={r.product.image} alt={r.product.name} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] text-zinc-700">{r.product.name}</div>
                <div className="tabular text-[10px] text-zinc-400">
                  score {r.score.toFixed(3)} · content {(r.breakdown.content ?? 0).toFixed(2)} · visual{" "}
                  {r.breakdown.visual != null ? r.breakdown.visual.toFixed(2) : "n/a"}
                </div>
              </div>
              <ConfidenceBadge level={r.confidence} />
            </div>
          ))}
          {!list && <div className="text-[12px] text-zinc-400">Waiting for the ML service…</div>}
        </div>
      </div>
    </div>
  );
}

export default function TourPage() {
  const [data, setData] = useState<TourData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get<Recommendation>(`/explain?buyer_id=${BUYER}&product_id=${PRODUCT}`),
      api.get<BuyerDetail>(`/buyers/${BUYER}`),
      api.get<Metrics>("/metrics"),
      api.get<Health>("/health"),
      api.get<Settings>("/settings"),
    ])
      .then(([rec, buyer, metrics, health, settings]) => {
        setData({ rec: { ...rec, rank: 1 }, buyer, metrics, health, settings });
        const q = Number(new URLSearchParams(window.location.search).get("step") || "1");
        if (q >= 1) setStep(Math.min(q - 1, 20));
      })
      .catch((e) => setError(String(e)));
  }, []);

  const steps: Step[] = useMemo(() => {
    if (!data) return [];
    const { rec, buyer, metrics, health, settings } = data;

    const sumCheck = rec.contributions
      .filter((c) => c.data_status !== "stub")
      .reduce((a, b) => a + b.contribution, 0);

    return [
      {
        kicker: "Problem formulation",
        title: "The estimation problem",
        bullets: [
          `${health.counts.supplier_products} factory SKUs, ${health.counts.buyers} buyers with an existing pet assortment. The full cross product gives ${health.counts.pair_features.toLocaleString()} scorable (buyer, product) pairs: exhaustive batch scoring, no sampling.`,
          "No transaction stream, no conversion labels: this is a cold-start, content-based ranking problem by construction, not a modelling choice.",
          "Pipeline: candidate retrieval, then re-ranking, then a constrained policy layer. Retrieve-rerank is the standard split because retrieval is cheap and recall-oriented, ranking is expensive and precision-oriented.",
          "Model family chosen for identifiability and auditability: additive scores over normalized features, where per-item attribution is exact rather than approximate.",
        ],
        math: [
          {
            label: "Ranking function",
            tex: String.raw`\hat{s}(u,i) = f\!\left(\mathbf{v}(u,i);\, \mathbf{w}\right), \qquad \mathbf{v}(u,i) \in [0,1]^{K}`,
          },
          {
            label: "Constrained shortlist",
            tex: String.raw`\mathrm{shortlist}(u) = \operatorname*{ArgTopK}_{i \in \mathcal{C}} \hat{s}(u,i) \;\; \text{s.t.} \; \mathrm{feas}(u,i) \wedge \mathrm{cert}(u,i) \wedge \mathrm{cap}(c_u, i) \leq \kappa`,
            wide: true,
          },
        ],
        tip: "Advance with the Next button, arrow keys, or Space. Every step is live data.",
        visual: (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Supplier products", health.counts.supplier_products.toLocaleString(), `${health.counts.suppliers} suppliers`],
                ["Buyers", health.counts.buyers.toLocaleString(), `${health.counts.buyer_products} catalog items`],
                ["Pair scores", health.counts.pair_features.toLocaleString(), "buyer x product, exhaustive"],
                ["Recs / batch", health.counts.matches.toLocaleString(), "top-10 per buyer"],
              ].map(([label, value, note]) => (
                <div key={String(label)} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</div>
                  <div className="tabular mt-1 text-2xl font-semibold text-zinc-900">{String(value)}</div>
                  <div className="text-[11px] text-zinc-500">{note}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                "Stage 1 · candidate retrieval (recall-oriented)",
                "Stage 2 · re-ranking (precision-oriented)",
                "Stage 3 · constrained policy (business rules)",
              ].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="rounded-md border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-[12px] font-medium text-indigo-800">
                    {s}
                  </div>
                  {i < 2 && <span className="text-zinc-300">→</span>}
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        kicker: "Features · retrieval",
        title: "How matching works: features and similarity",
        bullets: [
          "Buyer profile vector: the mean of TF-IDF vectors of the buyer's catalog items. With |catalog| in {1, 2} this mean has high variance, which we handle with shrinkage toward country and subcluster centroids instead of pretending rich history exists.",
          "Lexical channel: BM25 (Okapi) over tokenized supplier text, plus TF-IDF cosine with word 1-2 grams and character 3-5 grams. The character n-grams absorb factory English spelling variance and compounds.",
          "Structured channel: weighted categorical agreement over species, product type, color and material tokens. This captures same-item-different-words that lexical overlap misses.",
          "Why content-based first: with zero positives, collaborative filtering is unidentifiable. Content features are estimable for unseen products and unseen buyers on day one.",
        ],
        math: [
          {
            label: "Profile vector and cosine",
            tex: String.raw`\mathbf{q}_u = \frac{1}{|\mathcal{C}_u|} \sum_{j \in \mathcal{C}_u} \mathbf{x}_j, \qquad \cos(\mathbf{q}_u, \mathbf{x}_i) = \frac{\mathbf{q}_u^{\top} \mathbf{x}_i}{\lVert \mathbf{q}_u \rVert_2 \, \lVert \mathbf{x}_i \rVert_2}`,
          },
          {
            label: "BM25 with IDF",
            tex: String.raw`\mathrm{BM25}(q,d) = \sum_{t \in q} \mathrm{IDF}(t) \cdot \frac{f(t,d)\,(k_1 + 1)}{f(t,d) + k_1\bigl(1 - b + b\,|d|/\overline{|d|}\bigr)}, \quad \mathrm{IDF}(t) = \ln\!\left(1 + \frac{N - n_t + 0.5}{n_t + 0.5}\right)`,
            wide: true,
          },
          {
            label: "Structured agreement",
            tex: String.raw`v_{\mathrm{struct}} = 0.45\,\mathbb{1}[sp_u = sp_i] + 0.40\,\mathbb{1}[ty_u = ty_i] + 0.10\,\mathbb{1}[col] + 0.05\,J(\mathrm{materials})`,
          },
        ],
        visual: (
          <div className="grid gap-4 md:grid-cols-2">
            {buyer.products.map((p) => (
              <div key={p.id} className="rounded-md border border-zinc-100 p-4">
                <div className="flex items-center gap-3">
                  <Thumb src={p.image} alt={p.name} size={48} />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-zinc-800">{p.name}</div>
                    <div className="text-[11px] text-zinc-400">
                      {p.species} · {p.product_type} · sold at {p.price_usd != null ? `$${p.price_usd}` : "n/a"} ({p.currency || "?"})
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-zinc-400">
                    nearest supplier products (TF-IDF + BM25 + structured, live)
                  </div>
                  {p.top_supplier_matches.map((m) => (
                    <Link key={m.product_id} href={`${TRADING_BASE}/products/${m.product_id}`} className="flex items-center gap-2 rounded p-1 hover:bg-zinc-50">
                      <Thumb src={m.image} alt={m.name} size={30} />
                      <span className="max-w-[260px] truncate text-[12px] text-zinc-600">{m.name}</span>
                      <span className="tabular ml-auto text-[11px] text-zinc-400">{m.sim.toFixed(3)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        kicker: "Scoring",
        title: "The score and its uncertainty",
        bullets: [
          "The score is a convex combination over active feature blocks. Weights renormalize to 1 over available blocks, so a missing channel (for example, no image) redistributes weight instead of biasing the score downward.",
          "P(convert) is a monotone squashing of the score, explicitly uncalibrated. Probability calibration (Platt scaling or isotonic regression) requires positive examples; until labels exist this is a monotone transform only, and it is labelled as such everywhere.",
          "Confidence badge is a data-density proxy for feature availability: image present, price parsed, certifications extracted, catalog size, visual signal. It quantifies evidence support, not model preference.",
        ],
        math: [
          {
            label: "Uncalibrated conversion transform",
            tex: String.raw`\hat{p}(u,i) = \sigma\!\left(\gamma\,(\hat{s}(u,i) - 0.5)\right), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}, \qquad \gamma = 6`,
          },
          {
            label: "Renormalized block weights",
            tex: String.raw`\tilde{w}_k = \frac{w_k}{\sum_{l \in A} w_l}, \qquad A = \{\text{blocks with available features}\}`,
          },
        ],
        tip: "You can click Why this? on this card live. Every panel in the next steps is inside it.",
        visual: <RecommendationCard rec={rec} />,
      },
      {
        kicker: "Attribution",
        title: "Exact additive attribution",
        bullets: [
          "For a linear scorer, attribution is exact: the score is the sum of per-feature contributions, contribution = weight x value. No surrogate model, no sampling error, no approximation gap between explanation and score.",
          "This is the linear Shapley property: for an additive model, Shapley values reduce to weight x value up to a baseline constant. Exact attribution is why linear and tree models are preferred here over neural scorers.",
          "The weights shown in the UI are the same vector used by the batch scorer. There is no train-serve skew: explanations are computed from the served parameterization.",
        ],
        math: [
          {
            label: "Additive decomposition",
            tex: String.raw`\hat{s}(u,i) = \frac{\sum_{k \in A} w_k \, v_k(u,i)}{\sum_{k \in A} w_k}, \qquad c_k = \tilde{w}_k \, v_k, \qquad \sum_k c_k = \hat{s}(u,i)`,
            wide: true,
          },
          {
            label: "Consistency check (this pair, live)",
            tex: String.raw`\sum_k c_k = ${sumCheck.toFixed(4)} \; \approx \; \hat{s}(u,i) = ${rec.score.toFixed(4)}`,
          },
        ],
        visual: (
          <div className="space-y-5">
            <ScoreBreakdownBar rec={rec} large />
            <Waterfall rec={rec} large />
          </div>
        ),
      },
      {
        kicker: "Evidence",
        title: "Evidence: same statistics as the score",
        bullets: [
          "Matched tokens are ranked by IDF from the same TF-IDF vectorizer that scores pairs. Evidence and objective share one statistic, so explanations cannot drift from the model.",
          "Neighbor evidence uses the same cosine geometry as retrieval: the similarity shown is the similarity scored.",
          "Design principle: errors stay visible. Token overlap can be audited by eye; a dense embedding neighborhood cannot.",
        ],
        math: [
          {
            label: "Evidence selection",
            tex: String.raw`\mathcal{T}(u,i) = \operatorname*{top-}8_{t \in \mathcal{V}(q_u) \cap \mathcal{V}(d_i)} \mathrm{IDF}(t)`,
          },
        ],
        visual: (
          <div className="max-w-2xl">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Matched evidence for this pair
            </div>
            <MatchedEvidence rec={rec} />
          </div>
        ),
      },
      {
        kicker: "Vision",
        title: "Visual channel: frozen CLIP as a feature extractor",
        bullets: [
          "Visual similarity is cosine between CLIP ViT-B/32 image embeddings, the same geometry as the text channel, so blocks are comparable after min-max normalization.",
          "Zero-shot tagging is a softmax classification over prompt embeddings at the model's learned temperature. Only cells where keyword rules yield general/other/empty are filled (51 of 600 tag cells here): CLIP augments the rule-based classifier instead of displacing higher-precision keyword tags.",
          "Why CLIP stays a feature extractor: weights are frozen, there is no gradient path through it. The ranking objective stays linear and attribution stays exact. Neuro models behind a flag, never in the scoring core.",
          "Fill-rate context: only about 20 percent of supplier specs mention a species and 13 percent of buyer rows carry materials, so this channel closes a real feature gap rather than decorating rich data.",
        ],
        math: [
          {
            label: "Visual similarity",
            tex: String.raw`v_{\mathrm{vis}}(u,i) = \cos\!\left(f_{\mathrm{img}}(i),\; f_{\mathrm{img}}(\mathcal{C}_u)\right)`,
          },
          {
            label: "Zero-shot tag posterior",
            tex: String.raw`p(y = c \mid \mathrm{img}) = \mathrm{softmax}_c\!\left(\tau \,\bigl\langle f_{\mathrm{img}},\, f_{\mathrm{text}}(c) \bigr\rangle\right), \qquad \tau = \text{learned logit scale}`,
          },
        ],
        visual: (
          <div className="space-y-5">
            <VisualEvidence rec={rec} large />
            <div className="flex flex-wrap items-center gap-2">
              <TagChip label="species" value={rec.tags.species} confidence={rec.tags.confidence} />
              <TagChip label="type" value={rec.tags.productType} />
              <TagChip label="color" value={rec.tags.color} />
              <Pill tone="indigo">tags: hybrid, keyword base + CLIP gap-fill (this row: {rec.tags.source})</Pill>
            </div>
          </div>
        ),
      },
      {
        kicker: "Policy",
        title: "Constrained selection: MMR and concentration caps",
        bullets: [
          "The policy layer is a constrained selection problem, not plain ranking: MOQ feasibility, certification coverage, per-country caps on shortlist slots, and diversification.",
          "MMR greedily maximizes relevance minus redundancy against already selected items. Lambda controls the trade-off; lambda = 1 degenerates to pure ranking. This is a greedy 1-1/e style approximation, which is standard and sufficient at this candidate scale.",
          "Concentration caps limit how many buyers in the same country may see the same product in their shortlist slots. Implemented as a greedy post-filter in score order: exact ILP assignment adds no value at n = 65 buyers and would hurt auditability.",
          "Feasibility compares MOQ against an estimated monthly volume: the estimate is a heuristic from catalog size and price band, and it is flagged as such on every card.",
        ],
        math: [
          {
            label: "MMR selection",
            tex: String.raw`i^{\star} = \operatorname*{argmax}_{i \in \mathcal{C} \setminus S} \left[\, \lambda \, \hat{s}(u,i) \; - \; (1 - \lambda) \max_{j \in S} \mathrm{sim}(i, j) \right]`,
          },
          {
            label: "Per-country concentration constraint",
            tex: String.raw`\Bigl| \bigl\{ u : c_u = c,\; i \in \mathrm{shortlist}_{1:3}(u) \bigr\} \Bigr| \;\leq\; \kappa`,
            note: "shortlist slots 1..3 only; deeper slots are exploratory",
          },
        ],
        visual: (
          <div className="space-y-5">
            <div className="max-w-2xl">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Commercial reasoning (certification and market coverage)
              </div>
              <CommercialReasoning rec={rec} />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Constraints and policy state for this pair
              </div>
              <ConstraintsPanel rec={rec} />
            </div>
          </div>
        ),
      },
      {
        kicker: "Identifiability",
        title: "What we refuse to estimate",
        bullets: [
          "86 of 100 supplier prices are non numeric ('Contact for Quotation'). With n = 4 observed prices, a price model is statistically indefensible, so the margin block weight is set to 0 and marked unidentified.",
          "The secondary objective is stated but not evaluated: expected profit requires landed cost, expected quantity and a risk penalty, none of which are observed. Inventing them would create unexplained variance.",
          "Missingness is treated as a first-class output: zero weights, visible flags, stated assumptions. Silent imputation converts a data gap into fake precision.",
        ],
        math: [
          {
            label: "Risk-adjusted expected profit (not evaluated)",
            tex: String.raw`E[\pi \mid u,i] = P(c = 1 \mid u, i) \, \bigl(p - c_{\mathrm{landed}}\bigr) \, E[q \mid u, i] \, (1 - \rho)`,
            note: "p, c_landed and rho are unobserved in this dataset",
            wide: true,
          },
        ],
        visual: (
          <div className="max-w-2xl space-y-4">
            <ProfitPanel rec={rec} />
            <div className="grid gap-2 md:grid-cols-3">
              {[
                ["Cost sheets arrive", "margin weight becomes estimable"],
                ["Credit data arrives", "risk penalty rho activates"],
                ["Transactions arrive", "alpha/beta profit objective goes live"],
              ].map(([a, b]) => (
                <div key={a} className="rounded-md border border-zinc-200 bg-white p-3">
                  <div className="text-[12px] font-medium text-zinc-700">{a}</div>
                  <div className="text-[11px] text-zinc-400">→ {b}</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        kicker: "Negative space",
        title: "Why NOT this: symmetric auditability",
        bullets: [
          "The highest-scoring excluded candidate is also ranked and shown, with its exclusion cause: MMR displacement or the top-K cut.",
          "The same additive decomposition applies to rejected items, so acceptance and rejection are symmetric: both sides of the decision are auditable.",
          "This closes the loop for a skeptical reviewer: the negative space can be interrogated with the same tooling.",
        ],
        math: [
          {
            label: "Highest-scoring excluded candidate",
            tex: String.raw`i^{-} = \operatorname*{argmax}_{i \notin \mathrm{shortlist}(u)} \hat{s}(u,i)`,
          },
        ],
        visual: buyer.why_not ? (
          <div className="max-w-2xl rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Thumb src={buyer.why_not.product.image} alt={buyer.why_not.product.name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-zinc-800">{buyer.why_not.product.name}</div>
                <div className="text-[12px] text-amber-700">{buyer.why_not.reason}</div>
                <div className="text-[11px] text-zinc-400">{buyer.why_not.note}</div>
              </div>
              <div className="text-right">
                <div className="tabular text-sm font-semibold text-zinc-700">{buyer.why_not.score.toFixed(3)}</div>
                <div className="text-[10px] text-zinc-400">score</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(buyer.why_not.breakdown)
                .filter(([, v]) => v !== null)
                .map(([k, v]) => (
                  <span key={k} className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500">
                    {k} <span className="tabular font-medium text-zinc-700">{(v as number).toFixed(2)}</span>
                  </span>
                ))}
            </div>
          </div>
        ) : (
          <div className="text-[12px] text-zinc-400">No rejected candidate available.</div>
        ),
      },
      {
        kicker: "Interactive",
        title: "Re-rank live: sensitivity of a linear scorer",
        bullets: [
          "The scorer is linear in the weights, so re-ranking is one dot product per pair over precomputed features. All 6,500 pairs re-score in milliseconds, and the list permutations are exact.",
          "Sensitivity of the score to a weight is proportional to the feature value minus the score: features above the current score push up when their weight increases, features below push down. That is exactly what you see when you drag a slider.",
          "The same weight vector is persisted and applied to the global batch policy: one parameterization for demo and batch, no train-serve skew.",
        ],
        math: [
          {
            label: "Score sensitivity to a block weight",
            tex: String.raw`\frac{\partial \hat{s}}{\partial w_k} = \frac{v_k - \hat{s}(u,i)}{\sum_{l \in A} w_l}`,
          },
        ],
        tip: "Drag Visual similarity up and watch the order change: the top list is recomputed, not animated.",
        visual: <TourRerankWidget settings={settings} />,
      },
      {
        kicker: "Evaluation",
        title: "Ablations under weak supervision",
        bullets: [
          "No labels exist, so evaluation uses weak supervision: proxy relevance R_u is the top-5 TF-IDF neighbors of the buyer's own catalog (self-recovery). Recall@10 measures overlap with that recoverable set and is correlated with the content channel by construction; it is labelled as a proxy.",
          "NDCG@10 as implemented: linear gain, relevance graded 2 for proxy-relevant, 1 for structured agreement above 0.75, 0 otherwise; discount 1/log2(1+rank). IDCG comes from the ideal ordering of the same grades.",
          "Label-free metrics carry the real weight: coverage is the share of the catalog surfaced across all buyers, and intra-list diversity is one minus mean pairwise TF-IDF cosine.",
          "Ablations isolate each block (random, content, +market, +feasibility, +visual, full, +MMR, +caps), plus a ridge regression whose weights are fitted by least squares on the weak grades instead of hand-set. Policy rows trade proxy recall for diversity and coverage under stated assumptions: for example MMR adds roughly 7 percentage points of diversity. Business decisions stay visible instead of being baked in silently.",
        ],
        math: [
          {
            label: "Recall@10 (proxy relevance)",
            tex: String.raw`\mathrm{Recall@}10 = \frac{\lvert \mathrm{top}_{10}(u) \cap R_u \rvert}{\lvert R_u \rvert}`,
          },
          {
            label: "NDCG@10 (linear gain)",
            tex: String.raw`\mathrm{NDCG@}10 = \frac{\mathrm{DCG@}10}{\mathrm{IDCG@}10}, \qquad \mathrm{DCG@}10 = \sum_{i=1}^{10} \frac{rel_i}{\log_2(1 + i)}`,
          },
          {
            label: "Intra-list diversity (label-free)",
            tex: String.raw`\mathrm{div}(T_u) = 1 - \frac{2}{|T_u|(|T_u| - 1)} \sum_{i < j \in T_u} \cos(\mathbf{x}_i, \mathbf{x}_j)`,
          },
        ],
        visual: (
          <div className="max-w-3xl space-y-3">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide text-zinc-400">
                  <th className="py-2 font-medium">Variant</th>
                  <th className="py-2 font-medium">Recall@10 (proxy)</th>
                  <th className="py-2 font-medium">NDCG@10 (weak)</th>
                  <th className="py-2 font-medium">Coverage</th>
                  <th className="py-2 font-medium">Diversity</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.variants).map(([k, v]) => (
                  <tr key={k} className="border-b border-zinc-50">
                    <td className="py-1.5 pr-3 font-medium text-zinc-700">{k}</td>
                    <td className="tabular py-1.5 text-zinc-600">{v.recall_at_10.toFixed(3)}</td>
                    <td className="tabular py-1.5 text-zinc-600">{v.ndcg_at_10.toFixed(3)}</td>
                    <td className="tabular py-1.5 text-zinc-600">{(v.coverage * 100).toFixed(0)}%</td>
                    <td className="tabular py-1.5 text-zinc-600">{(v.intra_list_diversity * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-2 text-[11px] text-zinc-500">
              Weak-supervision disclosure: {metrics.notes.length} stated limitations on the Evaluation page, including the
              impossibility of a temporal split (no timestamps in this dataset).
            </div>
          </div>
        ),
      },
      {
        kicker: "Learning",
        title: "From explanations to supervised learning",
        bullets: [
          "Feedback events (view, send, quote, sample, not_relevant) accumulate as implicit labels. With enough volume, inverse propensity weighting corrects for position bias in what got viewed.",
          "The LTR stage is wired as LambdaMART with pairwise lambdarank gradients and NDCG gains, currently trained on weak synthetic grades as a pipeline scaffold. It activates by configuration, with no code change and automatic fallback to the linear scorer.",
          "Next statistical steps once positives exist: probability calibration (isotonic or Platt), then the risk-adjusted objective activates with cost and credit data. Until then, the system stays honest about what it does not know.",
        ],
        math: [
          {
            label: "LambdaMART pairwise objective (scaffold)",
            tex: String.raw`\mathcal{L} = \sum_{i \prec j} \lvert \Delta \mathrm{NDCG} \rvert \, \log\!\left(1 + e^{-\varsigma (F_i - F_j)}\right)`,
            note: "F are model scores, i < j means item j should be ranked above i",
          },
        ],
        visual: (
          <div className="max-w-2xl space-y-5">
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Log feedback on this pair (writes a label row now)
              </div>
              <div className="mt-2">
                <FeedbackButtons rec={rec} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="indigo">vision: {health.vision.pairs_with_visual.toLocaleString()} pairs with CLIP</Pill>
              <Pill tone="zinc">ranker: {health.ranker}</Pill>
              <Pill tone={health.lgbm.trained ? "indigo" : "stub"}>
                LTR: {health.lgbm.trained ? `trained (weak labels, NDCG@10 ${health.lgbm.valid_ndcg_at_10})` : "scaffold only"}
              </Pill>
              <Pill tone="zinc">config {health.config_hash}</Pill>
            </div>
            <div className="rounded-md border border-zinc-200 bg-white p-3 text-[12px] text-zinc-600">
              Hands on the wheel:{" "}
              <Link href={`${TRADING_BASE}/buyers`} className="text-indigo-600 hover:underline">
                browse any buyer
              </Link>
              ,{" "}
              <Link href={`${TRADING_BASE}/model`} className="text-indigo-600 hover:underline">
                inspect and tune the model
              </Link>
              , or{" "}
              <Link href={`${TRADING_BASE}/evaluation`} className="text-indigo-600 hover:underline">
                audit the metrics
              </Link>
              .
            </div>
          </div>
        ),
      },
    ];
  }, [data]);

  const total = steps.length;
  const clamped = Math.min(step, Math.max(total - 1, 0));

  function go(n: number) {
    const nextIdx = Math.max(0, Math.min(n, total - 1));
    setStep(nextIdx);
    window.history.replaceState(null, "", `${TRADING_BASE}/tour?step=${nextIdx + 1}`);
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(clamped + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(clamped - 1);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped, total]);

  if (error)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        ML service unreachable. Start it with npm run dev. {error}
      </div>
    );
  if (!data) return <div className="p-10 text-center text-[13px] text-zinc-400">Preparing the tour…</div>;

  const s = steps[clamped];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="rounded-md bg-indigo-600 px-2.5 py-1 text-[12px] font-semibold text-white">
            Step {clamped + 1} / {total}
          </span>
          <div className="hidden items-center gap-1.5 md:flex">
            {steps.map((st, i) => (
              <button
                key={st.title}
                onClick={() => go(i)}
                title={st.title}
                className={`h-2 rounded-full transition-all ${i === clamped ? "w-5 bg-indigo-600" : "w-2 bg-zinc-300 hover:bg-zinc-400"}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-zinc-400 md:inline">keys: left/right arrows or Space</span>
          <Link href={TRADING_BASE} className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12px] text-zinc-600 hover:border-zinc-300">
            Exit tour
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="min-h-[430px] rounded-lg border border-zinc-200 bg-white p-5">{s.visual}</div>
        <aside className="space-y-3 self-start rounded-lg border border-indigo-100 bg-indigo-50/40 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">{s.kicker}</div>
          <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900">{s.title}</h2>
          <ul className="space-y-2.5">
            {s.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-zinc-600">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {s.tip && (
            <div className="rounded-md border border-indigo-200 bg-white p-3 text-[12px] leading-relaxed text-indigo-700">
              <span className="font-semibold">Demo tip:</span> {s.tip}
            </div>
          )}
        </aside>
      </div>

      {s.math && s.math.length > 0 && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
            The math on this step
          </div>
          <div className={`grid gap-3 ${s.math.length > 1 ? "md:grid-cols-2" : ""}`}>
            {s.math.map((m, i) => (
              <div key={i} className={`rounded-md border border-indigo-100 bg-white px-4 py-3 ${m.wide ? "md:col-span-2" : ""}`}>
                {m.label && (
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{m.label}</div>
                )}
                <Tex tex={m.tex} block className="text-zinc-800" />
                {m.note && <div className="mt-1.5 text-[11px] text-zinc-400">{m.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <button
          onClick={() => go(clamped - 1)}
          disabled={clamped === 0}
          className="rounded-md border border-zinc-200 bg-white px-5 py-2.5 text-[13px] font-medium text-zinc-600 hover:border-zinc-300 disabled:opacity-40"
        >
          Back
        </button>
        <span className="hidden text-[12px] text-zinc-400 md:inline">
          {clamped === total - 1 ? "End of tour" : `Next: ${steps[clamped + 1]?.title ?? ""}`}
        </span>
        <button
          onClick={() => go(clamped + 1)}
          disabled={clamped === total - 1}
          className="rounded-md bg-indigo-600 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}