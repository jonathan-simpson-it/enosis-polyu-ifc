"""Pair feature computation: BM25, TF-IDF (word+char), profile, structured, market, feasibility, visual."""
import json
import re
from collections import defaultdict

import numpy as np
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

from db import ARTIFACTS, jload, connect

TOKEN_RE = re.compile(r"[a-z0-9]+")
STOPWORDS = set("""a an and are as at be by for from has have in is it its of on or that the to was were will with
this their they you your our we not no all any can more also products product pet pets made make used use using
quality good high new size sizes color colors material materials""".split())


def tokens(text):
    return [t for t in TOKEN_RE.findall((text or "").lower()) if len(t) > 1 and t not in STOPWORDS]


def load_catalog(con):
    products = [dict(r) for r in con.execute("SELECT * FROM supplier_products ORDER BY id")]
    for p in products:
        p["specs"] = jload(p["specs"], {})
        p["image_urls"] = jload(p["image_urls"], [])
        p["certs"] = jload(p["certs"], [])
    buyers = {r["id"]: dict(r) for r in con.execute("SELECT * FROM buyers")}
    for b in buyers.values():
        b["certs_required"] = jload(b["certs_required"], [])
    bps = [dict(r) for r in con.execute("SELECT * FROM buyer_products ORDER BY id")]
    for bp in bps:
        bp["specs"] = jload(bp["specs"], {})
        bp["materials"] = jload(bp["materials"], [])
    return products, buyers, bps


def minmax(vals):
    vals = np.asarray(vals, dtype=float)
    lo, hi = np.nanmin(vals), np.nanmax(vals)
    if hi - lo < 1e-9:
        return np.ones_like(vals)
    return (vals - lo) / (hi - lo)


def material_match(bp, p):
    bmat = " ".join(bp.get("materials") or [])
    pmat = str(p["specs"].get("Material") or "")
    bt, pt = set(tokens(bmat)), set(tokens(pmat))
    if not bt or not pt:
        return 0.5
    return len(bt & pt) / len(bt | pt)


def struct_sim(bp, p):
    sp = 1.0 if bp["species"] == p["species"] else (0.5 if "general" in (bp["species"], p["species"]) else 0.05)
    tp = 1.0 if bp["product_type"] == p["product_type"] else (0.5 if "other" in (bp["product_type"], p["product_type"]) else 0.05)
    cp = 1.0 if (bp["color"] and bp["color"] == p["color"]) else (0.5 if not bp["color"] or not p["color"] else 0.1)
    mp = material_match(bp, p)
    return 0.45 * sp + 0.40 * tp + 0.10 * cp + 0.05 * mp


def market_fit(buyer, p, suppliers):
    sup = suppliers[p["supplier_id"]]
    exports = (sup.get("main_export_markets") or "").lower()
    if not exports.strip():
        export = 0.5
    else:
        hit = (buyer["country"].lower() in exports) or (buyer["country_iso3"] and buyer["country_iso3"].lower() in exports) or (buyer["region"].lower() in exports)
        export = 1.0 if hit else 0.15
    req, have = set(buyer["certs_required"]), set(p["certs"])
    if req & have:
        cert = 1.0
    elif have:
        cert = 0.45
    else:
        cert = 0.3
    targ = (p.get("target_markets") or "").lower()
    target = 0.6 if (buyer["region"].lower() in targ or "others" in targ or "everywhere" in targ) else 0.3
    return 0.45 * export + 0.35 * cert + 0.20 * target, export, cert, target


def feasibility(buyer, p):
    moq = p.get("moq") or 0
    est = buyer.get("est_monthly_volume") or 800
    unit = p.get("moq_unit") or "unit"
    if moq <= 0:
        return 0.5, "MOQ unknown - neutral"
    coverage = (est * 3.0) / moq
    base = min(1.0, coverage) ** 0.6
    note = f"MOQ {moq:,} {unit} vs est. {est:,}/mo"
    if unit in ("kg", "ton"):
        base *= 0.8
        note += " (bulk unit assumption)"
    if coverage >= 1:
        note += f" ({coverage:.1f}x 3-month volume - feasible)"
    else:
        note += f" (only {coverage:.1f}x 3-month volume - tight)"
    return float(np.clip(base, 0.05, 1.0)), note


def run():
    con = connect()
    cur = con.cursor()
    cur.execute("DELETE FROM pair_features")
    products, buyers, bps = load_catalog(con)
    suppliers = {r["id"]: dict(r) for r in con.execute("SELECT * FROM suppliers")}

    docs = [p["doc"] for p in products]
    bp_docs = [bp["doc"] for bp in bps]
    word_vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True, min_df=1, max_features=20000)
    word_vec.fit(docs + bp_docs)
    char_vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True, min_df=1, max_features=30000)
    char_vec.fit(docs + bp_docs)

    P_word = normalize(word_vec.transform(docs))
    P_char = normalize(char_vec.transform(docs))
    BP_word = normalize(word_vec.transform(bp_docs))
    BP_char = normalize(char_vec.transform(bp_docs))

    SW = (BP_word @ P_word.T).toarray()
    SC = (BP_char @ P_char.T).toarray()
    ST = 0.5 * (SW + SC)

    bm25 = BM25Okapi([tokens(d) for d in docs])
    bm25_scores = np.vstack([bm25.get_scores(tokens(d)) for d in bp_docs])
    idf = {tok: float(word_vec.idf_[i]) for tok, i in word_vec.vocabulary_.items()}
    p_token_sets = [set(tokens(d)) for d in docs]
    bp_token_sets = [set(tokens(d)) for d in bp_docs]

    bp_by_buyer = defaultdict(list)
    for j, bp in enumerate(bps):
        bp_by_buyer[bp["buyer_id"]].append(j)

    visual = {}
    vpath = ARTIFACTS / "visual_sim.json"
    if vpath.exists():
        visual = json.loads(vpath.read_text())

    # product x product matrix for MMR diversity
    PS = 0.5 * ((P_word @ P_word.T).toarray() + (P_char @ P_char.T).toarray())
    np.save(ARTIFACTS / "product_sim.npy", PS)
    (ARTIFACTS / "product_ids.json").write_text(json.dumps([p["id"] for p in products]))

    n = len(products)
    pairs = []
    for bid, js in bp_by_buyer.items():
        buyer = buyers[bid]
        profile = normalize(np.asarray(BP_word[js].mean(axis=0)))
        profile_sim = np.asarray(profile @ P_word.T).ravel()
        for i, p in enumerate(products):
            bm = float(bm25_scores[js, i].max())
            tf = float(ST[js, i].max())
            st = max(struct_sim(bps[j], p) for j in js)
            ps = float(profile_sim[i])
            vv = None
            vis = [visual.get(f"{j}|{p['id']}") for j in js if visual.get(f"{j}|{p['id']}") is not None]
            if vis:
                vv = float(max(vis))
            mf, ex, cf, tb = market_fit(buyer, p, suppliers)
            fe, note = feasibility(buyer, p)
            jbest = int(js[int(np.argmax(ST[js, i]))])
            bp_best = bps[jbest]
            inter = bp_token_sets[jbest] & p_token_sets[i]
            matched = sorted(inter, key=lambda t: -idf.get(t, 0))[:8]
            order = sorted(js, key=lambda j: -ST[j, i])[:2]
            matched_products = [
                {"id": bps[j]["id"], "name": bps[j]["name"], "image": bps[j]["image_url"], "sim": round(float(ST[j, i]), 3)}
                for j in order
            ]
            pairs.append({
                "buyer_id": bid, "product_id": p["id"], "bm25": bm, "tfidf": tf, "profile_sim": ps,
                "struct_sim": st, "visual_sim": vv, "market_fit": mf, "export_match": ex, "cert_fit": cf,
                "target_bonus": tb, "feasibility": fe, "moq_note": note,
                "matched_tokens": matched, "matched_products": matched_products,
                "moq": p.get("moq"), "moq_unit": p.get("moq_unit"), "est_vol": buyer.get("est_monthly_volume"),
            })

    for key, normkey in (("bm25", "bm25_norm"), ("tfidf", "tfidf_norm"), ("profile_sim", "profile_norm"), ("struct_sim", "struct_norm")):
        vals = minmax([pr[key] for pr in pairs])
        for pr, v in zip(pairs, vals):
            pr[normkey] = float(v)
    vvals = [pr["visual_sim"] for pr in pairs if pr["visual_sim"] is not None]
    if vvals:
        vnorm = minmax(vvals)
        vit = iter(vnorm)
        for pr in pairs:
            pr["visual_norm"] = float(next(vit)) if pr["visual_sim"] is not None else None

    for pr in pairs:
        content = 0.30 * pr["bm25_norm"] + 0.30 * pr["tfidf_norm"] + 0.15 * pr["profile_norm"] + 0.25 * pr["struct_norm"]
        cur.execute(
            "INSERT INTO pair_features (buyer_id,product_id,bm25,tfidf,profile_sim,struct_sim,bm25_norm,tfidf_norm,"
            "profile_norm,struct_norm,visual_sim,visual_norm,market_fit,export_match,cert_fit,target_bonus,feasibility,"
            "moq_note,content,matched_tokens,matched_products) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (pr["buyer_id"], pr["product_id"], pr["bm25"], pr["tfidf"], pr["profile_sim"], pr["struct_sim"],
             pr["bm25_norm"], pr["tfidf_norm"], pr["profile_norm"], pr["struct_norm"],
             pr["visual_sim"], pr.get("visual_norm"), pr["market_fit"], pr["export_match"], pr["cert_fit"],
             pr["target_bonus"], pr["feasibility"], pr["moq_note"], content,
             json.dumps(pr["matched_tokens"]), json.dumps(pr["matched_products"])),
        )
    con.commit()
    print(f"pair_features: {len(pairs)} rows ({len(bp_by_buyer)} buyers x {n} products)")
    print(f"visual: {'on' if vvals else 'off'}  ({len(vvals)} pairs with visual sim)")
    return len(pairs)


if __name__ == "__main__":
    run()