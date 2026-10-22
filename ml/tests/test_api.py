"""FastAPI contract tests over the isolated workspace."""


def test_health(client):
    h = client.get("/health").json()
    assert h["ok"] is True
    assert h["counts"]["buyers"] == 65
    assert h["counts"]["pair_features"] == 6500
    assert h["counts"]["matches"] == 650
    assert h["vision"]["pairs_with_visual"] == 6500
    assert h["ridge"]["fitted"] is True


def test_buyers_list(client):
    buyers = client.get("/buyers").json()
    assert len(buyers) == 65
    assert any(b["id"] == "zuvo" for b in buyers)


def test_buyer_detail_contract(client):
    d = client.get("/buyers/zuvo").json()
    assert len(d["recommendations"]) == 10
    assert d["why_not"] is not None
    for rec in d["recommendations"]:
        assert 0.0 <= rec["score"] <= 1.0
        assert rec["confidence"] in {"high", "medium", "low"}
        assert rec["product"]["name"]
        contrib_sum = sum(c["contribution"] for c in rec["contributions"] if c.get("data_status") != "stub")
        assert abs(contrib_sum - rec["score"]) < 2e-3


def test_explain_contract(client):
    rec = client.get("/explain?buyer_id=zuvo&product_id=88").json()
    assert rec["productId"] == 88
    assert "matchedBuyerProducts" in rec["evidence"]
    assert rec["evidence"]["matchedTokens"]
    assert rec["profit"]["status"] == "requires-cost-data"
    assert "\\pi" in rec["profit"]["formula"]
    assert rec["product"]["price_source"] in {"contact", "real", "missing", "unparsed"}


def test_product_detail(client):
    d = client.get("/products/88").json()
    assert d["product"]["id"] == 88
    assert len(d["buyers"]) == 10
    assert d["stats"]["scored_buyers"] == 65


def test_rank_live_with_custom_weights(client):
    r = client.post("/rank", json={"buyer_id": "zuvo", "weights": {"content": 0.35, "visual": 0.35}, "limit": 5}).json()
    assert len(r["recommendations"]) == 5
    assert r["weights_used"]["visual"] == 0.35


def test_feedback_roundtrip(client):
    ok = client.post("/feedback", json={"buyer_id": "zuvo", "product_id": 88, "action": "quote"}).json()
    assert ok["ok"] is True
    fb = client.get("/feedback?buyer_id=zuvo").json()
    assert any(f["action"] == "quote" for f in fb)


def test_settings_roundtrip(client):
    before = client.get("/settings").json()
    res = client.put("/settings", json={"mmr_lambda": 0.6}).json()
    assert res["settings"]["mmr_lambda"] == 0.6
    assert res["batch"]["buyers_scored"] == 65
    client.put("/settings", json={"mmr_lambda": before["mmr_lambda"]})


def test_features_global(client):
    f = client.get("/features/global").json()
    names = {x["name"] for x in f["features"]}
    assert {"bm25", "tfidf", "visual_sim", "market_fit", "feasibility"} <= names
    assert f["global_importance"]