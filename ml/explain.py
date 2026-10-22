"""Explanation assembly: full per-recommendation decomposition with evidence and constraints."""
from db import jload
from rank import calibrated_p, confidence_of, score_pair, score_row

MODEL_VERSION = "linear-v1"

LABEL_SOURCES = {
    "linear": "none (cold-start linear scorer, hand-set prior weights)",
    "lgbm": "synthetic-weak (LambdaMART scaffold)",
    "ridge": "weak relevance grades (fitted ridge regression)",
}

CALIBRATION_NOTES = {
    "linear": "uncalibrated: no conversion labels exist; monotone transform of the relevance score",
    "lgbm": "uncalibrated: monotone transform of the LambdaMART score",
    "ridge": "ridge output on weak grades mapped to [0,1]: a predicted relevance, not a calibrated conversion probability",
}


def product_public(state, p):
    sup = state["suppliers"][p["supplier_id"]]
    images = p.get("image_urls") or []
    if p.get("price_source") == "real" and p.get("price_min"):
        price_display = f"USD ${p['price_min']}-{p['price_max']}/{p.get('price_unit') or 'unit'}"
    elif p.get("price_source") == "contact":
        price_display = "Contact for quotation"
    else:
        price_display = "Not listed"
    return {
        "id": p["id"], "name": p["name"], "supplier_id": p["supplier_id"], "supplier_name": sup["name"],
        "supplier_country": sup["country"], "supplier_type": sup["business_type"],
        "supplier_since": sup["year_established"],
        "moq": p.get("moq"), "moq_unit": p.get("moq_unit"),
        "price_display": price_display, "price_source": p.get("price_source"),
        "image": p.get("primary_image"), "images": images[:3],
        "species": p.get("species"), "product_type": p.get("product_type"), "color": p.get("color"),
        "tags_source": p.get("tags_source"), "tag_confidence": p.get("tag_confidence"),
        "subcluster": p.get("subcluster"), "certs": p.get("certs") or [],
        "specs": p.get("specs") or {},
    }


def buyer_public(state, b):
    return {
        "id": b["id"], "name": b["name"], "country": b["country"], "country_iso3": b["country_iso3"],
        "region": b["region"], "trade_bloc": b["trade_bloc"], "n_products": b["n_products"],
        "price_band": [b.get("price_band_p25"), b.get("price_band_p50"), b.get("price_band_p75")],
        "brand_tier": b.get("brand_tier"), "certs_required": b.get("certs_required") or [],
        "image": b.get("image"), "est_monthly_volume": b.get("est_monthly_volume"),
    }


def build(state, buyer_id, product_id, settings, constraints=None, ranker="linear"):
    row = state["pair_index"][(buyer_id, product_id)]
    product = state["products_by_id"][product_id]
    buyer = state["buyers"][buyer_id]
    score, breakdown, contributions, ranker_name = score_row(state, row, settings)
    conf, density = confidence_of(row, product, buyer)

    matched_products = jload(row.get("matched_products"), [])
    for mp in matched_products:
        mp["sim"] = round(float(mp.get("sim") or 0), 3)
    visual = None
    if row.get("visual_sim") is not None:
        bp_best = matched_products[0] if matched_products else None
        visual = {
            "buyerImage": bp_best.get("image") if bp_best else None,
            "supplierImage": product.get("primary_image"),
            "visualSim": round(float(row["visual_sim"]), 3),
            "source": "CLIP ViT-B/32 image embeddings",
        }
    sup = state["suppliers"][product["supplier_id"]]
    exports = sup.get("main_export_markets")
    req = buyer.get("certs_required") or []
    have = product.get("certs") or []
    market_notes = []
    if exports:
        market_notes.append(f"Supplier export markets: {str(exports)[:120]}")
    else:
        market_notes.append("Supplier export markets not listed: neutral 0.5")
    if req:
        covered = [c for c in req if c in have]
        holds = ", ".join(have) if have else "no parsed certifications"
        market_notes.append(f"{buyer['region']} typically requires {', '.join(req)}; supplier holds {holds}"
                            + (f"; covered: {', '.join(covered)}" if covered else "; no direct coverage found"))
    else:
        market_notes.append("No regional certification requirement mapped for this buyer")

    passed, failed = [], []
    if float(row["feasibility"]) >= 0.7:
        passed.append(f"MOQ feasible: {row['moq_note']}")
    else:
        failed.append(f"MOQ tight: {row['moq_note']}")
    if row["cert_fit"] >= 0.8:
        passed.append("Regional certification fit")
    elif row["cert_fit"] <= 0.4:
        failed.append("No certification evidence for buyer region")
    if row["export_match"] >= 1.0:
        passed.append(f"Supplier exports to {buyer['country']}")
    elif row["export_match"] <= 0.2:
        failed.append(f"Supplier does not list {buyer['country']} among export markets (weak signal, not a hard filter)")
    cons = list(constraints or [])
    profit = {
        "status": "requires-cost-data",
        "expected": None, "marginPct": None, "riskPenalty": None,
        "formula": r"E[\pi \mid u,i] = P(c{=}1 \mid u,i)\,\bigl(p - c_{\mathrm{landed}}\bigr)\,E[q \mid u,i]\,(1 - \rho)",
        "assumptions": {
            "factory_cost": "Not available: 86% of the supplier catalog shows 'Contact for Quotation'",
            "buyer_credit": "Not provided: the risk penalty rho cannot be estimated",
            "conversion_labels": "None: P(convert) is an uncalibrated monotone transform of the relevance score",
        },
    }
    return {
        "productId": product_id,
        "buyerId": buyer_id,
        "score": score,
        "calibratedConversion": calibrated_p(score),
        "calibrationNote": CALIBRATION_NOTES.get(ranker_name, CALIBRATION_NOTES["linear"]),
        "confidence": conf,
        "confidenceDensity": density,
        "breakdown": breakdown,
        "contributions": contributions,
        "evidence": {
            "matchedBuyerProducts": matched_products,
            "matchedTokens": jload(row.get("matched_tokens"), []),
            "visualEvidence": visual,
            "marketNotes": market_notes,
            "moqNote": row.get("moq_note"),
        },
        "tags": {"species": product.get("species"), "productType": product.get("product_type"),
                 "color": product.get("color"), "source": product.get("tags_source"),
                 "confidence": product.get("tag_confidence")},
        "constraints": {"passed": passed, "failed": failed, "policy": cons},
        "profit": profit,
        "rankerVersion": ranker_name,
        "labelSource": LABEL_SOURCES.get(ranker_name, LABEL_SOURCES["linear"]),
        "modelVersion": MODEL_VERSION,
        "product": product_public(state, product),
        "buyer": buyer_public(state, buyer),
    }


def why_not(state, buyer_id, settings, top_ids):
    """Best-scoring product for this buyer that did not make the top-10, with the reason."""
    top = set(top_ids)
    rows = state["pairs_by_buyer"].get(buyer_id, [])
    scored = []
    for row in rows:
        if row["product_id"] in top:
            continue
        s, bd, _, _ = score_row(state, row, settings)
        scored.append((s, row))
    if not scored:
        return None
    scored.sort(key=lambda x: -x[0])
    s, row = scored[0]
    product = state["products_by_id"][row["product_id"]]
    stored = state["con"].execute(
        "SELECT COUNT(*) c FROM matches WHERE buyer_id=? AND product_id=?", (buyer_id, row["product_id"])).fetchone()
    reason = "Dropped by MMR diversity or ranked below the top-10 cut"
    if float(row["feasibility"]) < 0.5:
        reason = f"Dropped by the feasibility filter: {row['moq_note']}"
    return {
        "product": product_public(state, product),
        "score": round(s, 6),
        "breakdown": bd,
        "reason": reason,
        "note": "Compare its contributions against the recommended list to see why it fell below the cut",
    }