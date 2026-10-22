"""Fitted ridge regression: stats, coefficient contract, served scores."""
import regression as RG
from rank import LGBM_FEATURES, predict_ridge


def test_fit_reports_sane_stats(state):
    meta = RG.fit(state)
    assert meta["fitted"] is True
    assert meta["n_pairs"] == 6500
    assert meta["n_groups"] == 65
    assert 0.1 < meta["r2_in_sample"] <= 1.0
    assert -1.0 < meta["r2_grouped_cv"] <= 1.0
    assert set(meta["coefficients"].keys()) == set(LGBM_FEATURES)
    assert all(abs(v) < 10 for v in meta["coefficients"].values())
    assert meta["alpha"] in (0.01, 0.1, 1.0, 10.0)


def test_served_scores_in_unit_interval(state):
    assert state.get("ridge") is not None
    rows = state["pairs_by_buyer"]["zuvo"]
    for row in rows[:50]:
        score, _ = predict_ridge(state, row)
        assert score is not None
        assert 0.0 <= score <= 1.0