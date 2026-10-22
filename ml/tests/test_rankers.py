"""Ranker paths: linear, ridge (fitted), LGBM fallback, and policy invariants."""

from rank import rank_buyer


def with_ranker(state, ranker):
    return {**state, "settings": {**state["settings"], "ranker": ranker}}


def test_linear_top_pick(state):
    recs, ranker = rank_buyer(state, "zuvo", limit=5)
    assert ranker == "linear"
    assert recs[0]["product_id"] == 88


def test_ridge_served_and_exact(state):
    assert state.get("ridge") is not None
    st = with_ranker(state, "ridge")
    recs, ranker = rank_buyer(st, "zuvo", limit=5)
    assert ranker == "ridge"
    assert recs[0]["product_id"] == 88
    for rec in recs:
        assert 0.0 <= rec["score"] <= 1.0
        contrib_sum = sum(c["contribution"] for c in rec["contributions"])
        assert abs(contrib_sum - rec["score"]) < 2e-3


def test_lgbm_fallback_is_graceful(state):
    st = with_ranker(state, "lgbm")
    recs, ranker = rank_buyer(st, "zuvo", limit=5)
    assert ranker in {"lgbm", "linear"}
    assert len(recs) == 5


def test_every_buyer_gets_ten_and_caps_hold(state, client):
    rows = state["con"].execute(
        "SELECT m.buyer_id, b.country, m.product_id, m.rank, p.subcluster FROM matches m "
        "JOIN buyers b ON b.id = m.buyer_id JOIN supplier_products p ON p.id = m.product_id"
    ).fetchall()
    per_buyer = {}
    per_country_product = {}
    per_country_cluster = {}
    for buyer_id, country, product_id, rank, subcluster in rows:
        per_buyer[buyer_id] = per_buyer.get(buyer_id, 0) + 1
        if rank <= 3:
            per_country_product[(country, product_id)] = per_country_product.get((country, product_id), 0) + 1
            per_country_cluster[(country, subcluster)] = per_country_cluster.get((country, subcluster), 0) + 1
    assert len(per_buyer) == 65
    assert all(v == 10 for v in per_buyer.values())
    assert max(per_country_product.values()) <= 5
    assert max(per_country_cluster.values()) <= 10