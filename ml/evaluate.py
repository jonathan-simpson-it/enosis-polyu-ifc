"""Offline evaluation: proxy metrics (LOO recovery), coverage, diversity, ablations. No true labels exist."""
import json
from datetime import datetime, timezone

import numpy as np

from db import ARTIFACTS, connect, jload
from rank import mmr_order, score_pair, score_row


def _top10(state, buyer_id, weights, mmr_lam=None):
    rows = state["pairs_by_buyer"].get(buyer_id, [])
    settings = {**state["settings"], "weights": {**state["settings"]["weights"], **weights}}
    scored = []
    for row in rows:
        s, bd, contrib, wn = score_pair(row, settings)
        scored.append((row["pid_pos"], s))
    scored.sort(key=lambda x: -x[1])
    if mmr_lam is None:
        return [pos for pos, _ in scored[:10]]
    return [pos for pos, _ in mmr_order(scored[:40], state["PS"], mmr_lam, 10)]


def _metrics(state, tops):
    relevant_by_buyer = {}
    ndcg_scores, recalls = [], []
    seen = set()
    diversities = []
    for bid, positions in tops.items():
        seen.update(positions)
        rel = set()
        for bp in state["bps_by_buyer"].get(bid, []):
            pairs = sorted(state["pairs_by_buyer"][bid], key=lambda r: -float(r["tfidf"]))
            rel.update(r["pid_pos"] for r in pairs[:5])
        relevant_by_buyer[bid] = rel
        top_set = positions
        hit = len(set(top_set) & rel)
        recalls.append(hit / max(1, len(rel)))
        row_by_pos = {r["pid_pos"]: r for r in state["pairs_by_buyer"][bid]}
        dcg = 0.0
        for rank, pos in enumerate(top_set):
            grade = 2 if pos in rel else (1 if row_by_pos[pos]["struct_sim"] >= 0.75 else 0)
            dcg += grade / np.log2(rank + 2)
        idcg = sum(g / np.log2(i + 2) for i, g in enumerate(sorted([2] * len(rel) + [0] * 10, reverse=True)[:10]))
        ndcg_scores.append(dcg / idcg if idcg > 0 else 0)
        if len(top_set) > 1:
            sims = [state["PS"][a][b] for i, a in enumerate(top_set) for b in top_set[i + 1:]]
            diversities.append(float(1 - np.mean(sims)) if sims else 0)
    return {
        "recall_at_10": round(float(np.mean(recalls)), 4),
        "ndcg_at_10": round(float(np.mean(ndcg_scores)), 4),
        "coverage": round(len(seen) / len(state["products"]), 4),
        "intra_list_diversity": round(float(np.mean(diversities)), 4),
    }


def run(state):
    rng = np.random.default_rng(42)
    variants = {}
    w = state["settings"]["weights"]

    tops = {bid: list(rng.choice(len(state["products"]), size=10, replace=False)) for bid in state["buyers"]}
    variants["random"] = _metrics(state, tops)

    tops = {bid: _top10(state, bid, {"content": 1, "market": 0, "feasibility": 0, "visual": 0}) for bid in state["buyers"]}
    variants["content-only"] = _metrics(state, tops)

    tops = {bid: _top10(state, bid, {"content": 1, "market": 0.4, "feasibility": 0, "visual": 0}) for bid in state["buyers"]}
    variants["+market"] = _metrics(state, tops)

    tops = {bid: _top10(state, bid, {"content": 1, "market": 0.4, "feasibility": 0.4, "visual": 0}) for bid in state["buyers"]}
    variants["+feasibility"] = _metrics(state, tops)

    tops = {bid: _top10(state, bid, {"content": 1, "market": 0.4, "feasibility": 0.4, "visual": 0.2}) for bid in state["buyers"]}
    variants["+visual"] = _metrics(state, tops)

    tops = {bid: _top10(state, bid, w) for bid in state["buyers"]}
    variants["full linear (no MMR)"] = _metrics(state, tops)

    lam = state["settings"]["mmr_lambda"]
    tops = {bid: _top10(state, bid, w, mmr_lam=lam) for bid in state["buyers"]}
    variants["full + MMR"] = _metrics(state, tops)

    con = connect()
    tops = {}
    for r in con.execute("SELECT buyer_id, product_id FROM matches ORDER BY buyer_id, rank"):
        bid = r["buyer_id"]
        tops.setdefault(bid, []).append(state["pid_index"][r["product_id"]])
    if tops and len(tops) == len(state["buyers"]):
        variants["full + MMR + caps (batch)"] = _metrics(state, tops)

    if state.get("ridge"):
        ridge_settings = {**state["settings"], "ranker": "ridge"}
        tops = {}
        for bid in state["buyers"]:
            rows = state["pairs_by_buyer"].get(bid, [])
            scored = [(r["pid_pos"], score_row(state, r, ridge_settings)[0]) for r in rows]
            scored.sort(key=lambda x: -x[1])
            tops[bid] = [pos for pos, _ in scored[:10]]
        variants["ridge regression (fitted, weak labels)"] = _metrics(state, tops)

    notes = [
        "No conversion labels exist in this dataset: all metrics are weak-supervision proxies.",
        "Recall@10 and NDCG@10 relevance = top-5 TF-IDF-similar supplier products to each buyer's own catalog (self-recovery proxy; correlated with the content channel by construction).",
        "Coverage = share of the 100 supplier products appearing in any buyer's top-10 (label-free metric).",
        "Intra-list diversity = mean pairwise (1 - TF-IDF cosine) within each top-10 (label-free metric).",
        "No temporal split is possible: the dataset contains no timestamps.",
    ]
    payload = {"variants": variants, "notes": notes, "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
    con.execute("INSERT INTO eval_runs (ts, payload) VALUES (datetime('now'), ?)", (json.dumps(payload),))
    con.commit()
    return payload