"""Evaluation ablations present and bounded."""
import evaluate as EV


def test_eval_variants(state, client):
    payload = EV.run(state)
    variants = payload["variants"]
    assert "random" in variants
    assert "content-only" in variants
    assert "full + MMR + caps (batch)" in variants
    assert "ridge regression (fitted, weak labels)" in variants
    for m in variants.values():
        assert 0.0 <= m["recall_at_10"] <= 1.0
        assert 0.0 <= m["ndcg_at_10"] <= 1.0
        assert 0.0 <= m["coverage"] <= 1.0
        assert 0.0 <= m["intra_list_diversity"] <= 1.0
    assert variants["random"]["recall_at_10"] < variants["content-only"]["recall_at_10"]
    assert len(payload["notes"]) >= 4