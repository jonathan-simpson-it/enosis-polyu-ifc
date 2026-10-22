"""Deep Bridge ML service: FastAPI over the two-stage recommender + policy + explainability."""
import json
from collections import defaultdict
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import evaluate as EV
import explain as X
import rank as R
import regression as RG
import weak_labels as WL
from db import ARTIFACTS, connect, init_db, jload

STATE = {}


def load_state(con):
    products = [dict(r) for r in con.execute("SELECT * FROM supplier_products ORDER BY id")]
    for p in products:
        p["specs"] = jload(p["specs"], {})
        p["image_urls"] = jload(p["image_urls"], [])
        p["certs"] = jload(p["certs"], [])
    products_by_id = {p["id"]: p for p in products}
    pid_index = {p["id"]: i for i, p in enumerate(products)}

    suppliers = {r["id"]: dict(r) for r in con.execute("SELECT * FROM suppliers")}
    buyers = {}
    for r in con.execute("SELECT * FROM buyers"):
        b = dict(r)
        b["certs_required"] = jload(b["certs_required"], [])
        buyers[b["id"]] = b

    bps = [dict(r) for r in con.execute("SELECT * FROM buyer_products ORDER BY id")]
    bps_by_buyer = defaultdict(list)
    for bp in bps:
        bps_by_buyer[bp["buyer_id"]].append(bp)

    pairs = [dict(r) for r in con.execute("SELECT * FROM pair_features")]
    pair_index = {}
    pairs_by_buyer = defaultdict(list)
    for r in pairs:
        r["pid_pos"] = pid_index[r["product_id"]]
        pair_index[(r["buyer_id"], r["product_id"])] = r
        pairs_by_buyer[r["buyer_id"]].append(r)

    # per buyer-product: top-3 matched supplier products (from stored matched_products evidence)
    bp_top_supplier = defaultdict(list)
    for r in pairs:
        for mp in jload(r["matched_products"], []) or []:
            bp_top_supplier[mp["id"]].append({"product_id": r["product_id"], "sim": float(mp.get("sim") or 0)})
    for k in bp_top_supplier:
        bp_top_supplier[k].sort(key=lambda x: -x["sim"])

    PS = np.load(ARTIFACTS / "product_sim.npy")
    subcluster_names = {}
    if (ARTIFACTS / "subclusters.json").exists():
        subcluster_names = json.loads((ARTIFACTS / "subclusters.json").read_text())
    row = con.execute("SELECT config_hash FROM matches LIMIT 1").fetchone()
    state = {
        "con": con, "products": products, "products_by_id": products_by_id, "pid_index": pid_index,
        "suppliers": suppliers, "buyers": buyers, "bps_by_buyer": bps_by_buyer,
        "pair_index": pair_index, "pairs_by_buyer": pairs_by_buyer, "PS": PS,
        "bp_top_supplier": dict(bp_top_supplier), "subcluster_names": subcluster_names,
        "settings": R.get_settings(con), "matches_hash": row["config_hash"] if row else "",
        "lgbm": WL.load_model(), "lgbm_meta": WL.load_meta(), "ridge": RG.load(),
    }
    return state


@asynccontextmanager
async def lifespan(app):
    init_db()
    con = connect()
    STATE.clear()
    STATE.update(load_state(con))
    n = con.execute("SELECT COUNT(*) c FROM matches").fetchone()["c"]
    if n == 0 or STATE["matches_hash"] != R.config_hash(STATE["settings"]):
        R.batch_score(STATE)
        STATE["matches_hash"] = R.config_hash(STATE["settings"])
    yield


app = FastAPI(title="Deep Bridge ML", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


class RankRequest(BaseModel):
    buyer_id: str
    weights: dict | None = None
    mmr_lambda: float | None = None
    limit: int = 10


class FeedbackRequest(BaseModel):
    buyer_id: str
    product_id: int
    action: str
    actor: str = "sales-rep"


class SettingsRequest(BaseModel):
    weights: dict | None = None
    mmr_lambda: float | None = None
    cap: int | None = None
    cap_cluster: int | None = None
    ranker: str | None = None
    vision_enabled: bool | None = None
    alpha: float | None = None
    beta: float | None = None


@app.get("/health")
def health():
    con = STATE["con"]
    counts = {t: con.execute(f"SELECT COUNT(*) c FROM {t}").fetchone()["c"]
              for t in ("buyers", "buyer_products", "supplier_products", "suppliers", "pair_features", "matches", "feedback")}
    visual_pairs = con.execute("SELECT COUNT(*) c FROM pair_features WHERE visual_sim IS NOT NULL").fetchone()["c"]
    return {
        "ok": True, "counts": counts,
        "vision": {"pairs_with_visual": visual_pairs, "enabled": STATE["settings"].get("vision_enabled")},
        "ranker": STATE["settings"].get("ranker"), "lgbm": STATE["lgbm_meta"],
        "ridge": STATE["ridge"][0] if STATE.get("ridge") else {"fitted": False},
        "config_hash": STATE["matches_hash"],
    }


@app.get("/meta/subclusters")
def subclusters():
    return STATE["subcluster_names"]


@app.get("/buyers")
def list_buyers():
    out = []
    for bid, b in STATE["buyers"].items():
        rows = STATE["pairs_by_buyer"].get(bid, [])
        top = None
        if rows:
            best = max(rows, key=lambda r: float(r["content"]))
            p = STATE["products_by_id"][best["product_id"]]
            top = {"product_id": p["id"], "name": p["name"], "image": p.get("primary_image")}
        out.append({**X.buyer_public(STATE, b), "top_match": top,
                    "subcluster": b.get("dominant_subcluster"),
                    "subcluster_name": STATE["subcluster_names"].get(str(b.get("dominant_subcluster")), "")})
    out.sort(key=lambda x: (-(x["n_products"] or 0), x["name"]))
    return out


@app.get("/buyers/{buyer_id}")
def buyer_detail(buyer_id: str):
    if buyer_id not in STATE["buyers"]:
        raise HTTPException(404, "buyer not found")
    b = STATE["buyers"][buyer_id]
    items, stale = R.live_recommendations(STATE, buyer_id, limit=10)
    recos = []
    for item in items:
        r = X.build(STATE, buyer_id, item["product_id"], STATE["settings"], constraints=item["constraints"], ranker=item["ranker"])
        r["rank"] = len(recos) + 1
        recos.append(r)
    why = X.why_not(STATE, buyer_id, STATE["settings"], [i["product_id"] for i in items])
    products = []
    for bp in STATE["bps_by_buyer"].get(buyer_id, []):
        tops = STATE["bp_top_supplier"].get(bp["id"], [])[:3]
        products.append({
            "id": bp["id"], "name": bp["name"], "image": bp["image_url"], "price_usd": bp["price_usd"],
            "currency": bp["currency"], "species": bp["species"], "product_type": bp["product_type"],
            "color": bp["color"], "subcluster": bp["subcluster"], "merchant_category": bp["merchant_category"],
            "top_supplier_matches": [{**t, "name": STATE["products_by_id"][t["product_id"]]["name"],
                                      "image": STATE["products_by_id"][t["product_id"]].get("primary_image")} for t in tops],
        })
    return {"buyer": {**X.buyer_public(STATE, b), "subcluster": b.get("dominant_subcluster"),
                      "subcluster_name": STATE["subcluster_names"].get(str(b.get("dominant_subcluster")), "")},
            "products": products, "recommendations": recos, "why_not": why,
            "batch_stale": stale, "config_hash": STATE["matches_hash"]}


@app.get("/products")
def list_products():
    out = []
    for p in STATE["products"]:
        pub = X.product_public(STATE, p)
        out.append({"id": pub["id"], "name": pub["name"], "supplier_name": pub["supplier_name"],
                    "image": pub["image"], "moq": pub["moq"], "moq_unit": pub["moq_unit"],
                    "price_display": pub["price_display"], "species": pub["species"],
                    "product_type": pub["product_type"], "subcluster": pub["subcluster"],
                    "subcluster_name": STATE["subcluster_names"].get(str(p.get("subcluster")), "")})
    return out


@app.get("/products/{product_id}")
def product_detail(product_id: int):
    if product_id not in STATE["products_by_id"]:
        raise HTTPException(404, "product not found")
    p = STATE["products_by_id"][product_id]
    rows = [r for r in STATE["pair_index"].values() if r["product_id"] == product_id]
    scored = []
    for r in rows:
        s, bd, contrib, wn = R.score_pair(r, STATE["settings"])
        scored.append((s, r))
    scored.sort(key=lambda x: -x[0])
    stored = {}
    for m in STATE["con"].execute("SELECT buyer_id, constraints, score FROM matches WHERE product_id=?", (product_id,)):
        stored[m["buyer_id"]] = {"constraints": jload(m["constraints"], []), "score": m["score"]}
    buyers_out = []
    for s, r in scored[:10]:
        st = stored.get(r["buyer_id"], {})
        rec = X.build(STATE, r["buyer_id"], product_id, STATE["settings"],
                      constraints=st.get("constraints", []), ranker="linear")
        rec["rank"] = len(buyers_out) + 1
        rec["in_batch_top10"] = r["buyer_id"] in stored
        buyers_out.append(rec)
    return {"product": X.product_public(STATE, p),
            "subcluster_name": STATE["subcluster_names"].get(str(p.get("subcluster")), ""),
            "buyers": buyers_out,
            "stats": {"scored_buyers": len(rows),
                      "batch_top10_count": sum(1 for r in rows if r["buyer_id"] in stored)}}


@app.get("/explain")
def explain_pair(buyer_id: str = Query(...), product_id: int = Query(...)):
    if (buyer_id, product_id) not in STATE["pair_index"]:
        raise HTTPException(404, "pair not found")
    stored = STATE["con"].execute(
        "SELECT constraints FROM matches WHERE buyer_id=? AND product_id=?", (buyer_id, product_id)).fetchone()
    return X.build(STATE, buyer_id, product_id, STATE["settings"],
                   constraints=jload(stored["constraints"], []) if stored else [])


@app.post("/rank")
def rank_live(req: RankRequest):
    if req.buyer_id not in STATE["buyers"]:
        raise HTTPException(404, "buyer not found")
    settings = dict(STATE["settings"])
    items, stale = R.live_recommendations(STATE, req.buyer_id, limit=req.limit, weights=req.weights, mmr_lambda=req.mmr_lambda)
    recos = []
    for item in items:
        r = X.build(STATE, req.buyer_id, item["product_id"], {**settings, "weights": {**settings["weights"], **(req.weights or {})}},
                    constraints=item["constraints"], ranker=item["ranker"])
        r["rank"] = len(recos) + 1
        recos.append(r)
    return {"recommendations": recos, "batch_stale": stale,
            "weights_used": {**settings["weights"], **(req.weights or {})},
            "mmr_lambda": req.mmr_lambda if req.mmr_lambda is not None else settings["mmr_lambda"]}


@app.post("/score/batch")
def score_batch():
    summary = R.batch_score(STATE)
    STATE["matches_hash"] = summary["config_hash"]
    return summary


@app.get("/settings")
def get_settings():
    return STATE["settings"]


@app.put("/settings")
def put_settings(req: SettingsRequest):
    s = dict(STATE["settings"])
    if req.weights:
        s["weights"] = {**s["weights"], **req.weights}
    for k in ("mmr_lambda", "cap", "cap_cluster", "ranker", "vision_enabled", "alpha", "beta"):
        v = getattr(req, k)
        if v is not None:
            s[k] = v
    s = R.save_settings(STATE["con"], s)
    STATE["settings"] = s
    summary = R.batch_score(STATE)
    STATE["matches_hash"] = summary["config_hash"]
    return {"settings": s, "batch": summary}


@app.post("/feedback")
def post_feedback(req: FeedbackRequest):
    STATE["con"].execute("INSERT INTO feedback (buyer_id,product_id,action,actor,ts) VALUES (?,?,?,?,datetime('now'))",
                         (req.buyer_id, req.product_id, req.action, req.actor))
    STATE["con"].commit()
    return {"ok": True, "stored": req.action}


@app.get("/feedback")
def get_feedback(buyer_id: str | None = None):
    if buyer_id:
        rows = STATE["con"].execute(
            "SELECT * FROM feedback WHERE buyer_id=? ORDER BY id DESC LIMIT 50", (buyer_id,)).fetchall()
    else:
        rows = STATE["con"].execute("SELECT * FROM feedback ORDER BY id DESC LIMIT 50").fetchall()
    return [dict(r) for r in rows]


@app.get("/features/global")
def features_global():
    meta = [dict(r) for r in STATE["con"].execute("SELECT * FROM feature_meta")]
    agg = defaultdict(float)
    cnt = defaultdict(int)
    for m in STATE["con"].execute("SELECT contributions FROM matches"):
        for c in jload(m["contributions"], []) or []:
            agg[c["feature"]] += abs(c["contribution"])
            cnt[c["feature"]] += 1
    importance = {k: round(agg[k] / max(1, cnt[k]), 4) for k in agg}
    if not importance:
        import rank as RR
        agg2 = defaultdict(float)
        for r in [rr for rr in STATE["pair_index"].values()]:
            _, _, contrib, _ = RR.score_pair(r, STATE["settings"])
            for c in contrib:
                agg2[c["feature"]] += abs(c["contribution"])
        n = len(STATE["pair_index"]) or 1
        importance = {k: round(v / n, 4) for k, v in agg2.items()}
    return {"features": meta, "global_importance": importance, "based_on": "mean |contribution| across stored matches" if cnt else "mean |contribution| across all 6,500 pairs",
            "settings": STATE["settings"]}


@app.get("/metrics")
def metrics():
    return EV.run(STATE)


@app.post("/train")
def train_ltr():
    meta = WL.train(STATE)
    STATE["lgbm_meta"] = meta
    STATE["lgbm"] = WL.load_model()
    return meta


@app.get("/regression")
def regression_meta():
    r = STATE.get("ridge")
    if not r:
        return {"fitted": False}
    return r[0]


@app.post("/regression/fit")
def regression_fit():
    meta = RG.fit(STATE)
    STATE["ridge"] = RG.load()
    summary = None
    if STATE["settings"].get("ranker") == "ridge":
        summary = R.batch_score(STATE)
        STATE["matches_hash"] = summary["config_hash"]
    return {"meta": meta, "rebatch": summary}


@app.post("/admin/reload")
def admin_reload():
    con = connect()
    STATE.clear()
    STATE.update(load_state(con))
    return {"ok": True, "matches_hash": STATE["matches_hash"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)