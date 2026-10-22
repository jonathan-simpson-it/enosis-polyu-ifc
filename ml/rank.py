"""Ranking: two-stage linear scorer + LGBM scaffold, MMR diversity, concentration caps, batch scoring."""
import hashlib
import json
import math
from copy import deepcopy

import numpy as np

from db import jload

DEFAULT_SETTINGS = {
    "weights": {"content": 0.50, "market": 0.20, "feasibility": 0.20, "visual": 0.10, "margin": 0.0, "risk": 0.0},
    "mmr_lambda": 0.7,
    "cap": 5,
    "cap_cluster": 10,
    "ranker": "linear",
    "vision_enabled": True,
    "confidence_high": 0.66,
    "confidence_medium": 0.33,
    "alpha": 0.8,
    "beta": 0.2,
}

LGBM_FEATURES = ["bm25_norm", "tfidf_norm", "profile_norm", "struct_norm", "visual_norm", "market_fit",
                 "export_match", "cert_fit", "target_bonus", "feasibility", "moq_log"]

RIDGE_BLOCKS = {
    "bm25_norm": "content", "tfidf_norm": "content", "profile_norm": "content", "struct_norm": "content",
    "visual_norm": "visual",
    "market_fit": "market", "export_match": "market", "cert_fit": "market", "target_bonus": "market",
    "feasibility": "feasibility", "moq_log": "feasibility",
}


def merge_settings(saved):
    s = deepcopy(DEFAULT_SETTINGS)
    if saved:
        for k, v in saved.items():
            if k == "weights" and isinstance(v, dict):
                s["weights"].update(v)
            else:
                s[k] = v
    return s


def get_settings(con):
    row = con.execute("SELECT json FROM settings WHERE id=1").fetchone()
    return merge_settings(jload(row["json"], {}) if row else {})


def save_settings(con, s):
    merged = merge_settings(s)
    con.execute("INSERT OR REPLACE INTO settings (id, json, updated_at) VALUES (1, ?, datetime('now'))",
                (json.dumps(merged),))
    con.commit()
    return merged


def config_hash(settings):
    return hashlib.sha1(json.dumps(settings, sort_keys=True).encode()).hexdigest()[:12]


def calibrated_p(score):
    return round(1.0 / (1.0 + math.exp(-6.0 * (score - 0.5))), 4)


def confidence_of(row, product, buyer):
    prods = with_products = 0
    score = 0.0
    checks = [
        bool(product.get("primary_image")),
        row.get("visual_norm") is not None,
        (product.get("price_source") == "real"),
        bool(product.get("certs")),
        (buyer.get("n_products") or 0) >= 2,
        buyer.get("price_band_p50") is not None,
    ]
    score = sum(1 for c in checks if c) / len(checks)
    if score >= DEFAULT_SETTINGS["confidence_high"]:
        return "high", round(score, 2)
    if score >= DEFAULT_SETTINGS["confidence_medium"]:
        return "medium", round(score, 2)
    return "low", round(score, 2)


def _sub_contributions(row, wn):
    out = []
    wc = wn.get("content", 0.0)
    for name, sw, key in [("bm25", 0.30, "bm25_norm"), ("tfidf", 0.30, "tfidf_norm"),
                          ("profile_sim", 0.15, "profile_norm"), ("struct_sim", 0.25, "struct_norm")]:
        v = float(row.get(key) or 0.0)
        out.append({"feature": name, "block": "content", "value": round(v, 4),
                    "weight": round(wc * sw, 4), "contribution": round(wc * sw * v, 4)})
    wm = wn.get("market", 0.0)
    out.append({"feature": "market_fit", "block": "market", "value": round(float(row["market_fit"]), 4),
                "weight": round(wm, 4), "contribution": round(wm * float(row["market_fit"]), 4)})
    wf = wn.get("feasibility", 0.0)
    out.append({"feature": "feasibility", "block": "feasibility", "value": round(float(row["feasibility"]), 4),
                "weight": round(wf, 4), "contribution": round(wf * float(row["feasibility"]), 4)})
    if "visual" in wn and row.get("visual_norm") is not None:
        wv = wn["visual"]
        out.append({"feature": "visual_sim", "block": "visual", "value": round(float(row["visual_norm"]), 4),
                    "weight": round(wv, 4), "contribution": round(wv * float(row["visual_norm"]), 4)})
    if "margin" in wn:
        out.append({"feature": "margin_floor", "block": "margin", "value": 0.5, "weight": round(wn["margin"], 4),
                    "contribution": round(wn["margin"] * 0.5, 4), "data_status": "stub"})
    if "risk" in wn:
        out.append({"feature": "risk", "block": "risk", "value": 0.5, "weight": round(wn["risk"], 4),
                    "contribution": round(wn["risk"] * 0.5, 4), "data_status": "stub"})
    return out


def score_pair(row, settings):
    """Returns (score, breakdown, contributions, active_weights). Excludes stubs unless weight>0."""
    w = settings["weights"]
    blocks = {
        "content": float(row["content"]),
        "market": float(row["market_fit"]),
        "feasibility": float(row["feasibility"]),
        "visual": row.get("visual_norm"),
        "margin": 0.5,
        "risk": 0.5,
    }
    active = ["content", "market", "feasibility"]
    if settings.get("vision_enabled", True) and blocks["visual"] is not None:
        active.append("visual")
    for stub in ("margin", "risk"):
        if w.get(stub, 0) > 0:
            active.append(stub)
    wsum = sum(w.get(b, 0) for b in active) or 1.0
    wn = {b: w.get(b, 0) / wsum for b in active}
    score = sum(wn[b] * blocks[b] for b in active)
    breakdown = {b: (round(blocks[b], 4) if blocks[b] is not None else None) for b in ("content", "market", "feasibility", "visual", "margin", "risk")}
    breakdown["margin"] = None
    breakdown["risk"] = None
    contributions = _sub_contributions(row, wn)
    return round(float(score), 6), breakdown, contributions, wn


def lgbm_features(row, state=None):
    v = row.get("visual_norm")
    moq_log = 1.0
    if state is not None:
        prod = state["products_by_id"].get(row["product_id"])
        if prod and prod.get("moq"):
            moq_log = float(math.log1p(prod["moq"]))
    return [float(row.get("bm25_norm") or 0), float(row.get("tfidf_norm") or 0), float(row.get("profile_norm") or 0),
            float(row.get("struct_norm") or 0), float(v if v is not None else 0.5), float(row["market_fit"]),
            float(row["export_match"]), float(row["cert_fit"]), float(row["target_bonus"]),
            float(row["feasibility"]), moq_log]


def predict_lgbm(state, row):
    booster = state.get("lgbm")
    if booster is None:
        return None
    try:
        X = np.asarray([lgbm_features(row, state)])
        pred = booster.predict(X)[0]
    except Exception:
        return None
    return 1.0 / (1.0 + math.exp(-pred / 5.0))


def predict_ridge(state, row):
    r = state.get("ridge")
    if not r:
        return None, None
    _, coef, intercept = r
    x = np.asarray(lgbm_features(row, state), dtype=float)
    pred = float(intercept + float(np.dot(coef, x)))
    return float(np.clip(pred / 3.0, 0.0, 1.0)), x


def ridge_contributions(coef, intercept, x):
    contrib = []
    for name, b, v in zip(LGBM_FEATURES, coef, x):
        contrib.append({"feature": name, "block": RIDGE_BLOCKS.get(name, "other"), "value": round(float(v), 4),
                        "weight": round(float(b) / 3.0, 4), "contribution": round(float(b) * float(v) / 3.0, 4)})
    contrib.append({"feature": "intercept", "block": "baseline", "value": 1.0,
                    "weight": round(float(intercept) / 3.0, 4), "contribution": round(float(intercept) / 3.0, 4)})
    contrib.sort(key=lambda c: -c["contribution"])
    return contrib


def score_row(state, row, settings):
    """Dispatch to the configured ranker. Returns (score, breakdown, contributions, ranker_name)."""
    ranker = settings.get("ranker", "linear")
    if ranker == "ridge":
        s, x = predict_ridge(state, row)
        if s is not None:
            _, bd, _, _ = score_pair(row, settings)
            _, coef, intercept = state["ridge"]
            return s, bd, ridge_contributions(coef, intercept, x), "ridge"
    if ranker == "lgbm":
        p = predict_lgbm(state, row)
        if p is not None:
            s, bd, contrib, _ = score_pair(row, settings)
            return float(p), bd, contrib, "lgbm"
    s, bd, contrib, _ = score_pair(row, settings)
    return s, bd, contrib, "linear"


def mmr_order(cands, PS, lam, k):
    """cands: list of (pid_pos, score). Returns ordered list of (pid_pos, score)."""
    if not cands:
        return []
    selected = []
    pool = list(cands)
    first = max(pool, key=lambda x: x[1])
    selected.append(first)
    pool.remove(first)
    while pool and len(selected) < k:
        best = None
        best_val = -1e9
        for pos, sc in pool:
            div = max(PS[pos][s[0]] for s in selected)
            val = lam * sc - (1 - lam) * div
            if val > best_val:
                best_val = val
                best = (pos, sc)
        pool.remove(best)
        selected.append(best)
    return selected


def rank_buyer(state, buyer_id, settings=None, limit=10, mmr_lambda=None):
    settings = settings or state["settings"]
    rows = state["pairs_by_buyer"].get(buyer_id, [])
    scored = []
    ranker = "linear"
    for row in rows:
        s, _, _, rk = score_row(state, row, settings)
        ranker = rk
        scored.append((row["pid_pos"], s, row))
    scored.sort(key=lambda x: -x[1])
    top = [(pos, sc) for pos, sc, _ in scored[:40]]
    lam = mmr_lambda if mmr_lambda is not None else settings.get("mmr_lambda", 0.7)
    ordered = mmr_order(top, state["PS"], lam, limit)
    out = []
    row_by_pos = {row["pid_pos"]: row for _, _, row in scored}
    for pos, sc in ordered:
        row = row_by_pos[pos]
        s, bd, contrib, rk = score_row(state, row, settings)
        ranker = rk
        out.append({"pid_pos": pos, "product_id": row["product_id"], "score": round(float(sc), 6),
                    "breakdown": bd, "contributions": contrib})
    return out, ranker


def batch_score(state, settings=None):
    settings = settings or state["settings"]
    con = state["con"]
    ch = config_hash(settings)
    cap = int(settings.get("cap", 5))
    cap_cluster = int(settings.get("cap_cluster", 10))
    results = {}
    top_scores = {}
    for bid in state["buyers"]:
        try:
            ranked, ranker = rank_buyer(state, bid, settings, limit=40)
        except Exception:
            continue
        top_scores[bid] = ranked[0]["score"] if ranked else 0
        results[bid] = (ranked, ranker)

    cprod = {}
    csub = {}
    con.execute("DELETE FROM matches")
    for bid in sorted(results, key=lambda b: -top_scores[b]):
        ranked, ranker = results[bid]
        buyer = state["buyers"][bid]
        country = buyer["country"]
        final = []
        for item in ranked:
            pid = item["product_id"]
            prod = state["products_by_id"][pid]
            sc_sub = prod["subcluster"]
            shortlist = len(final) < 3
            if shortlist:
                cp = cprod.get((country, pid), 0)
                cs = csub.get((country, sc_sub), 0)
                note = None
                if cp >= cap:
                    note = f"concentration cap: {cp} buyers in {country} already receive this exact product in their shortlist"
                elif cs >= cap_cluster:
                    note = f"cluster cap: {cs} buyers in {country} already receive this product cluster in their shortlist"
                if note:
                    continue
                cprod[(country, pid)] = cp + 1
                csub[(country, sc_sub)] = cs + 1
            final.append(item)
            if len(final) >= 10:
                break
        for i, item in enumerate(final):
            row = state["pair_index"][(bid, item["product_id"])]
            conf, dens = confidence_of(row, state["products_by_id"][item["product_id"]], buyer)
            con.execute(
                "INSERT INTO matches (buyer_id,product_id,rank,score,calibrated_p,breakdown,contributions,constraints,"
                "confidence,ranker,config_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (bid, item["product_id"], i + 1, item["score"], calibrated_p(item["score"]),
                 json.dumps(item["breakdown"]), json.dumps(item["contributions"]),
                 json.dumps([f"MMR diversity (lambda={settings['mmr_lambda']})",
                             f"Shortlist concentration caps applied (product cap={cap}/country, cluster cap={cap_cluster}/country)" if i < 3 else "Exploratory slot (no concentration cap)"]),
                 conf, ranker, ch),
            )
    con.commit()
    return {"buyers_scored": len(results), "config_hash": ch, "ranker": settings.get("ranker")}


def live_recommendations(state, buyer_id, limit=10, weights=None, mmr_lambda=None):
    settings = deepcopy(state["settings"])
    if weights:
        settings["weights"] = {**settings["weights"], **weights}
    ranked, ranker = rank_buyer(state, buyer_id, settings, limit=limit, mmr_lambda=mmr_lambda)
    stored = {r["product_id"]: jload(r["constraints"], []) for r in
              state["con"].execute("SELECT product_id, constraints FROM matches WHERE buyer_id=?", (buyer_id,))}
    stale = config_hash(settings) != state["matches_hash"]
    out = []
    for item in ranked:
        cons = stored.get(item["product_id"], [])
        if stale and not cons:
            cons = [f"live re-rank with custom weights (batch policy not re-applied)"]
        out.append({**item, "constraints": cons, "ranker": ranker})
    return out, stale