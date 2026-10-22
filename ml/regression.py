"""Fitted ridge regression on weak relevance grades.

Least-squares with L2 shrinkage: beta = argmin ||y - X beta||^2 + alpha ||beta||^2, closed form.
Trained on weakly labelled grades (0..3) so the hand-set cold-start weights have a learned counterpart.
Served as ranker="ridge": score = clip((beta0 + beta . v) / 3, 0, 1), with exact additive attribution
per feature (c_k = beta_k * v_k / 3), matching the linear attribution guarantee.
"""
import json
from datetime import datetime, timezone

import numpy as np
from sklearn.linear_model import Ridge, RidgeCV
from sklearn.model_selection import GroupKFold

from db import ARTIFACTS
from rank import LGBM_FEATURES, lgbm_features
from weak_labels import build_dataset

META_PATH = ARTIFACTS / "regression_meta.json"
COEF_PATH = ARTIFACTS / "regression_coef.npy"


def fit(state):
    X, y, groups, buyer_ids = build_dataset(state)
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)

    model = RidgeCV(alphas=(0.01, 0.1, 1.0, 10.0))
    model.fit(X, y)
    pred = model.predict(X)
    ss_res = float(((y - pred) ** 2).sum())
    ss_tot = float(((y - y.mean()) ** 2).sum()) or 1.0
    r2 = 1.0 - ss_res / ss_tot
    rmse = float(np.sqrt(((y - pred) ** 2).mean()))

    group_arr = np.repeat(np.arange(len(buyer_ids)), groups)
    gkf = GroupKFold(n_splits=5)
    cv_scores = []
    for tr, te in gkf.split(X, y, group_arr):
        m = Ridge(alpha=float(model.alpha_)).fit(X[tr], y[tr])
        p = m.predict(X[te])
        res = float(((y[te] - p) ** 2).sum())
        tot = float(((y[te] - y[te].mean()) ** 2).sum()) or 1.0
        cv_scores.append(1.0 - res / tot)

    np.save(COEF_PATH, np.append(model.coef_, model.intercept_))
    grade_dist = {str(int(g)): int((y == g).sum()) for g in np.unique(y)}
    meta = {
        "fitted": True,
        "model": "ridge regression (L2), closed-form solution",
        "target": "weak relevance grade in {0, 1, 2, 3}",
        "label_source": "weak labels derived from catalog similarity; NOT conversions",
        "n_pairs": int(len(y)),
        "n_groups": len(buyer_ids),
        "alpha": round(float(model.alpha_), 4),
        "r2_in_sample": round(float(r2), 4),
        "r2_grouped_cv": round(float(np.mean(cv_scores)), 4),
        "cv_folds": "5-fold GroupKFold by buyer (leave-buyer-out)",
        "rmse": round(rmse, 4),
        "mean_grade": round(float(y.mean()), 4),
        "grade_distribution": grade_dist,
        "intercept": round(float(model.intercept_), 4),
        "coefficients": {f: round(float(c), 4) for f, c in zip(LGBM_FEATURES, model.coef_)},
        "trained_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "serving": "score = clip((intercept + beta . v) / 3, 0, 1); contributions shown on cards are exact beta_k * v_k / 3",
        "honesty_note": "The weak target correlates with features by construction, so in-sample R2 overstates predictive power. The grouped cross-validated R2 is the conservative number.",
    }
    META_PATH.write_text(json.dumps(meta, indent=2))
    return meta


def load():
    if META_PATH.exists() and COEF_PATH.exists():
        meta = json.loads(META_PATH.read_text())
        coef = np.load(COEF_PATH)
        return meta, coef[:-1], float(coef[-1])
    return None


if __name__ == "__main__":
    from db import connect
    import main as main_mod
    con = connect()
    state = main_mod.load_state(con)
    print(json.dumps(fit(state), indent=2))