"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/trading/api";
import type { BuyerSummary, FeaturesGlobal, Health, Recommendation, RegressionMeta } from "@/lib/trading/types";
import { Pill, ConfidenceBadge } from "@/components/trading/badges";
import { Thumb } from "@/components/trading/Thumb";
import { Tex } from "@/components/trading/Tex";
import { TRADING_BASE } from "@/lib/trading/base";

const RIDGE_BLOCKS: Record<string, string> = {
  bm25_norm: "content",
  tfidf_norm: "content",
  profile_norm: "content",
  struct_norm: "content",
  visual_norm: "visual",
  market_fit: "market",
  export_match: "market",
  cert_fit: "market",
  target_bonus: "market",
  feasibility: "feasibility",
  moq_log: "feasibility",
};

function regressionEquation(reg: RegressionMeta): string {
  const entries = Object.entries(reg.coefficients ?? {});
  const half = Math.ceil(entries.length / 2);
  const term = ([f, b]: [string, number]) => `${b >= 0 ? "+" : "-"}${Math.abs(b).toFixed(3)}\\,\\text{${f.replace(/_/g, "\\_")}}`;
  const line1 = entries.slice(0, half).map(term).join(" ");
  const line2 = entries.slice(half).map(term).join(" ");
  return `\\begin{aligned}\\hat{g}(u,i) =\\;& ${(reg.intercept ?? 0).toFixed(3)} \\; ${line1} \\\\[2pt] & ${line2}\\end{aligned}`;
}

const BLOCK_LABELS: Record<string, string> = {
  content: "Content similarity (BM25 + TF-IDF + structured)",
  market: "Market fit (export markets + regional certs)",
  feasibility: "Feasibility (MOQ vs estimated volume)",
  visual: "Visual similarity (CLIP embeddings)",
  margin: "Margin floor",
  risk: "Risk penalty",
};

const EQUATIONS: { label: string; tex: string; note?: string; wide?: boolean }[] = [
  {
    label: "Scoring function (weighted average over active blocks)",
    tex: String.raw`\hat{s}(u,i) = \frac{\sum_{k \in A} w_k \, v_k(u,i)}{\sum_{k \in A} w_k}, \qquad A = \{\text{blocks with available features}\}`,
    note: "Weights renormalize over available data: a missing channel redistributes weight instead of biasing the score.",
    wide: true,
  },
  {
    label: "Content block (composite of four similarities)",
    tex: String.raw`v_{\mathrm{content}} = 0.30\,\hat{B} + 0.30\,\hat{T} + 0.15\,\hat{C}_{\mathrm{profile}} + 0.25\,v_{\mathrm{struct}}`,
    note: "B = BM25, T = TF-IDF cosine (word 1-2 grams + char 3-5 grams), C = cosine to the buyer profile vector.",
    wide: true,
  },
  {
    label: "BM25 (Okapi) with IDF over the supplier corpus",
    tex: String.raw`\mathrm{BM25}(q,d) = \sum_{t \in q} \mathrm{IDF}(t) \cdot \frac{f(t,d)(k_1+1)}{f(t,d) + k_1\bigl(1-b+b|d|/\overline{|d|}\bigr)}, \quad \mathrm{IDF}(t) = \ln\!\left(1+\frac{N-n_t+0.5}{n_t+0.5}\right)`,
    wide: true,
  },
  {
    label: "TF-IDF cosine between buyer profile and product",
    tex: String.raw`\mathbf{q}_u = \frac{1}{|\mathcal{C}_u|}\sum_{j \in \mathcal{C}_u} \mathbf{x}_j, \qquad \cos(\mathbf{q}_u, \mathbf{x}_i) = \frac{\mathbf{q}_u^{\top}\mathbf{x}_i}{\lVert \mathbf{q}_u \rVert_2 \lVert \mathbf{x}_i \rVert_2}`,
    wide: true,
  },
  {
    label: "Structured attribute agreement",
    tex: String.raw`v_{\mathrm{struct}} = 0.45\,\mathbb{1}[sp_u = sp_i] + 0.40\,\mathbb{1}[ty_u = ty_i] + 0.10\,\mathbb{1}[col] + 0.05\,J(\mathrm{materials})`,
  },
  {
    label: "Market fit block",
    tex: String.raw`v_{\mathrm{market}} = 0.45\,e + 0.35\,c + 0.20\,b, \qquad e = \text{export match},\; c = \text{cert fit},\; b = \text{target breadth}`,
    wide: true,
  },
  {
    label: "MOQ feasibility",
    tex: String.raw`v_{\mathrm{feas}} = \left[\min\!\Bigl(1, \; \frac{3 \, \hat{V}_u}{\mathrm{MOQ}_i}\Bigr)\right]^{0.6} \cdot 0.8^{\mathbb{1}[\text{bulk unit}]}`,
    note: "V_hat is an estimated monthly volume: a heuristic from catalog size and price band, flagged on every card.",
    wide: true,
  },
  {
    label: "Visual similarity (frozen CLIP ViT-B/32)",
    tex: String.raw`v_{\mathrm{vis}}(u,i) = \cos\!\left(f_{\mathrm{img}}(i),\, f_{\mathrm{img}}(\mathcal{C}_u)\right)`,
  },
  {
    label: "Conversion transform (uncalibrated)",
    tex: String.raw`\hat{p}(u,i) = \sigma\!\left(6\,(\hat{s}(u,i) - 0.5)\right)`,
    note: "Monotone only. Calibration (isotonic or Platt) requires positive examples, which this dataset does not contain.",
  },
  {
    label: "MMR diversification",
    tex: String.raw`i^{\star} = \operatorname*{argmax}_{i \in \mathcal{C} \setminus S} \left[\lambda \, \hat{s}(u,i) - (1-\lambda) \max_{j \in S} \mathrm{sim}(i,j)\right]`,
    wide: true,
  },
  {
    label: "Per-country concentration cap (shortlist slots 1 to 3)",
    tex: String.raw`\Bigl|\bigl\{ u : c_u = c,\; i \in \mathrm{shortlist}_{1:3}(u) \bigr\}\Bigr| \leq \kappa`,
  },
  {
    label: "LambdaMART objective (scaffold, weak labels)",
    tex: String.raw`\mathcal{L} = \sum_{i \prec j} |\Delta \mathrm{NDCG}| \, \log\!\left(1 + e^{-\varsigma (F_i - F_j)}\right)`,
    note: "Trained on weak synthetic grades until real conversion labels exist. Activates by config with automatic fallback to the linear scorer.",
    wide: true,
  },
];

function ModelPageInner() {
  const search = useSearchParams();
  const [fg, setFg] = useState<FeaturesGlobal | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [buyers, setBuyers] = useState<BuyerSummary[]>([]);
  const [buyerId, setBuyerId] = useState("");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [mmr, setMmr] = useState(0.7);
  const [live, setLive] = useState<Recommendation[] | null>(null);
  const [trainResult, setTrainResult] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [reg, setReg] = useState<RegressionMeta | null>(null);
  const [fitting, setFitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<FeaturesGlobal>("/features/global"),
      api.get<Health>("/health"),
      api.get<BuyerSummary[]>("/buyers"),
    ])
      .then(([f, h, b]) => {
        setFg(f);
        setHealth(h);
        setBuyers(b);
        const pre = search.get("buyer");
        const id = pre && b.some((x) => x.id === pre) ? pre : b[0]?.id ?? "";
        setBuyerId(id);
        setWeights({ ...f.settings.weights });
        setMmr(f.settings.mmr_lambda);
        if (id) {
          api.post<{ recommendations: Recommendation[] }>("/rank", { buyer_id: id, limit: 10 }).then((r) => setLive(r.recommendations));
        }
      })
      .catch(() => {});
    api
      .get<RegressionMeta>("/regression")
      .then(setReg)
      .catch(() => setReg({ fitted: false }));
  }, [search]);

  const totalW = useMemo(() => {
    const active = ["content", "market", "feasibility", "visual"].filter((k) => (weights[k] ?? 0) > 0);
    return active.reduce((a, k) => a + (weights[k] ?? 0), 0) || 1;
  }, [weights]);

  async function rerank(nextWeights = weights, nextMmr = mmr) {
    if (!buyerId) return;
    const r = await api.post<{ recommendations: Recommendation[] }>("/rank", {
      buyer_id: buyerId,
      weights: nextWeights,
      mmr_lambda: nextMmr,
      limit: 10,
    });
    setLive(r.recommendations);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Model and scoring transparency</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-zinc-500">
          The served scorer is a weighted linear function over normalized feature blocks. Attribution is exact by
          construction: for an additive model the Shapley value of each feature equals weight times value up to a
          baseline constant, so no surrogate explainer is needed. Move the sliders to re-rank a buyer live and watch the
          list and the explanations move together.
        </p>
      </div>

      {health && (
        <div className="flex flex-wrap gap-2">
          <Pill tone="zinc">active ranker: {health.ranker}</Pill>
          <Pill tone={health.lgbm.trained ? "indigo" : "stub"}>
            LTR model: {health.lgbm.trained ? `trained, NDCG@10 ${health.lgbm.valid_ndcg_at_10} (weak labels)` : "not trained"}
          </Pill>
          <Pill tone={health.vision.pairs_with_visual > 0 ? "indigo" : "stub"}>
            vision: {health.vision.pairs_with_visual > 0 ? "CLIP embeddings active" : "awaiting precompute"}
          </Pill>
          <button
            disabled={training}
            onClick={async () => {
              setTraining(true);
              setTrainResult(null);
              try {
                const meta = await api.post<Record<string, unknown>>("/train");
                setTrainResult(JSON.stringify(meta, null, 2));
              } catch (e) {
                setTrainResult(String(e));
              }
              setTraining(false);
            }}
            className="rounded-full border border-zinc-200 bg-white px-3 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-300"
          >
            {training ? "training…" : "Train LTR on weak labels"}
          </button>
        </div>
      )}
      {trainResult && (
        <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 text-[11px] text-zinc-600">{trainResult}</pre>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 lg:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Weight controls</div>
          <div className="mt-3 space-y-3">
            {["content", "market", "feasibility", "visual"].map((k) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-64 shrink-0 text-[12px] text-zinc-600">{BLOCK_LABELS[k]}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={weights[k] ?? 0}
                  onChange={(e) => {
                    const nw = { ...weights, [k]: Number(e.target.value) };
                    setWeights(nw);
                    rerank(nw, mmr);
                  }}
                  className="flex-1 accent-indigo-600"
                />
                <span className="tabular w-20 text-right text-[12px] text-zinc-700">
                  {weights[k]?.toFixed(2)} · {(((100 * (weights[k] ?? 0)) / totalW) || 0).toFixed(0)}%
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <span className="w-64 shrink-0 text-[12px] text-zinc-600">MMR lambda (1 = pure relevance)</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={mmr}
                onChange={(e) => {
                  setMmr(Number(e.target.value));
                  rerank(weights, Number(e.target.value));
                }}
                className="flex-1 accent-indigo-600"
              />
              <span className="tabular w-20 text-right text-[12px] text-zinc-700">{mmr.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <span className="w-64 shrink-0 text-[12px] text-zinc-600">alpha relevance vs beta profit</span>
              <div className="flex-1 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-1.5 text-[11px] text-zinc-500">
                inactive: the profit objective needs cost and credit data, see the unidentifiable blocks below
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Live rank preview</div>
            <select
              value={buyerId}
              onChange={(e) => {
                setBuyerId(e.target.value);
                api
                  .post<{ recommendations: Recommendation[] }>("/rank", { buyer_id: e.target.value, weights, mmr_lambda: mmr, limit: 10 })
                  .then((r) => setLive(r.recommendations));
              }}
              className="max-w-[160px] rounded-md border border-zinc-200 px-2 py-1 text-[11px]"
            >
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 space-y-2">
            {live?.slice(0, 10).map((r, i) => (
              <Link
                key={r.productId}
                href={`${TRADING_BASE}/products/${r.productId}`}
                className="flex items-center gap-2 rounded-md p-1 hover:bg-zinc-50"
              >
                <span className="w-5 text-[11px] text-zinc-400">#{i + 1}</span>
                <Thumb src={r.product.image} alt={r.product.name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] text-zinc-700">{r.product.name}</div>
                  <div className="tabular text-[10px] text-zinc-400">score {r.score.toFixed(3)}</div>
                </div>
                <ConfidenceBadge level={r.confidence} />
              </Link>
            ))}
            {!live && <div className="text-[12px] text-zinc-400">Select a buyer.</div>}
          </div>
          <Link href={buyerId ? `/buyers/${buyerId}` : "/buyers"} className="mt-3 block text-[12px] text-indigo-600 hover:underline">
            open the full buyer page with explanations
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500">
          The model, written out: every equation the scorer evaluates
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {EQUATIONS.map((eq) => (
            <div key={eq.label} className={`rounded-lg border border-zinc-200 bg-white p-4 ${eq.wide ? "md:col-span-2" : ""}`}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{eq.label}</div>
              <div className="mt-2">
                <Tex tex={eq.tex} block className="text-zinc-800" />
              </div>
              {eq.note && <div className="mt-2 text-[11px] leading-relaxed text-zinc-500">{eq.note}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
              The fitted regression model
            </div>
            <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-zinc-900">
              Ridge regression on weak relevance grades
            </h2>
            <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-zinc-500">
              The hand-set weights are a cold-start prior; this is their learned counterpart. Least squares with L2
              shrinkage, closed form, trained on the weak grades. Because the model is linear, attribution stays exact:
              every contribution on a card is a coefficient times a feature value. Serve it with ranker = ridge in
              Settings.
            </p>
          </div>
          <button
            disabled={fitting}
            onClick={async () => {
              setFitting(true);
              try {
                const r = await api.post<{ meta: RegressionMeta }>("/regression/fit");
                setReg(r.meta);
              } catch {
                /* keep previous meta */
              }
              setFitting(false);
            }}
            className="rounded-md bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {fitting ? "Fitting…" : reg?.fitted ? "Refit regression" : "Fit regression"}
          </button>
        </div>

        {!reg?.fitted ? (
          <p className="mt-3 text-[12px] text-zinc-500">
            Not fitted yet. Fitting takes under a second: closed-form least squares over the 6,500 weak-labelled pairs.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-md border border-indigo-100 bg-white px-4 py-3">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Fitted equation (weak-label target, grades 0 to 3; score = clip(g / 3, 0, 1))
              </div>
              <Tex tex={regressionEquation(reg)} block className="text-zinc-800" />
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              {[
                ["n pairs / buyers", `${reg.n_pairs?.toLocaleString()} / ${reg.n_groups}`],
                ["alpha (L2, chosen by GCV)", String(reg.alpha)],
                ["R2 in-sample", String(reg.r2_in_sample)],
                ["R2 grouped CV (leave-buyer-out)", String(reg.r2_grouped_cv)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-md border border-zinc-200 bg-white p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">{l}</div>
                  <div className="tabular mt-0.5 text-[15px] font-semibold text-zinc-900">{v}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span className="font-medium">RMSE {reg.rmse}</span>
              <span className="text-zinc-300">|</span>
              <span>mean grade {reg.mean_grade}</span>
              <span className="text-zinc-300">|</span>
              {Object.entries(reg.grade_distribution ?? {}).map(([g, n]) => (
                <Pill key={g} tone="zinc">
                  grade {g}: {n}
                </Pill>
              ))}
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Coefficients (per unit of the normalized feature)
              </div>
              <div className="space-y-1.5">
                {Object.entries(reg.coefficients ?? {})
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .map(([f, b]) => {
                    const max = Math.max(...Object.values(reg.coefficients ?? {}).map((v) => Math.abs(v)), 0.001);
                    return (
                      <div key={f} className="flex items-center gap-2 text-[12px]">
                        <span className="w-32 shrink-0 text-right text-zinc-600">{f}</span>
                        <div className="h-3 flex-1 rounded-sm bg-zinc-50">
                          <div
                            className={`h-full rounded-sm ${b >= 0 ? "bg-indigo-500/80" : "bg-amber-500/80"}`}
                            style={{ width: `${(Math.abs(b) / max) * 100}%` }}
                          />
                        </div>
                        <span className="tabular w-16 shrink-0 text-right font-medium text-zinc-700">{b.toFixed(3)}</span>
                        <span className="w-20 shrink-0 text-[11px] text-zinc-400">{RIDGE_BLOCKS[f] ?? ""}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-md border border-dashed border-zinc-300 bg-white p-3 text-[11px] leading-relaxed text-zinc-500">
              <span className="font-medium text-zinc-600">Serving:</span> {reg.serving}
              <br />
              <span className="font-medium text-zinc-600">Honesty note:</span> {reg.honesty_note}
              {reg.trained_at && (
                <>
                  <br />
                  <span className="font-medium text-zinc-600">Trained:</span> {new Date(reg.trained_at).toLocaleString()}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Feature glossary and data status
          </div>
          <table className="mt-2 w-full text-left text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-zinc-400">
                <th className="py-1 font-medium">Feature</th>
                <th className="py-1 font-medium">Block</th>
                <th className="py-1 font-medium">Status</th>
                <th className="py-1 font-medium">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {fg?.features.map((f) => (
                <tr key={f.name} className="border-t border-zinc-50 align-top">
                  <td className="py-1.5 pr-2 font-medium text-zinc-700">{f.name}</td>
                  <td className="py-1.5 pr-2 text-zinc-500">{f.block}</td>
                  <td className="py-1.5 pr-2">
                    <Pill tone={f.data_status === "real" ? "zinc" : f.data_status === "partial" ? "indigo" : "stub"}>
                      {f.data_status}
                    </Pill>
                  </td>
                  <td className="py-1.5 text-zinc-500">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Global importance: mean absolute contribution
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">{fg?.based_on}</div>
          <div className="mt-3 space-y-2">
            {fg &&
              Object.entries(fg.global_importance)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => {
                  const max = Math.max(...Object.values(fg.global_importance));
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-right text-[11px] text-zinc-600">{k}</span>
                      <div className="h-3 flex-1 rounded-sm bg-zinc-50">
                        <div className="h-full rounded-sm bg-indigo-500/80" style={{ width: `${(v / max) * 100}%` }} />
                      </div>
                      <span className="tabular w-12 text-[11px] text-zinc-500">{v.toFixed(3)}</span>
                    </div>
                  );
                })}
          </div>
          <div className="mt-4 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3 text-[11px] text-zinc-500">
            Unidentifiable blocks are excluded from scoring with weight 0: <span className="font-medium">margin_floor</span>{" "}
            (needs factory cost data) and <span className="font-medium">risk</span> (needs credit and payment history). They
            stay visible in the UI so the assumptions remain explicit rather than silently imputed.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModelPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[13px] text-zinc-400">Loading model page…</div>}>
      <ModelPageInner />
    </Suspense>
  );
}