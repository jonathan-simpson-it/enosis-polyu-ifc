"""Weak/synthetic labels + LightGBM LambdaMART training scaffold (falls back gracefully)."""
import json
from datetime import datetime, timezone

import numpy as np

from db import ARTIFACTS
from rank import LGBM_FEATURES, lgbm_features

MODEL_PATH = ARTIFACTS / "lgbm_model.txt"
META_PATH = ARTIFACTS / "lgbm_meta.json"


def build_dataset(state):
    """Grades: 3 = in LOO-relevant set (top-5 tfidf neighbors of buyer's own products),
    2 = strong structured overlap, 1 = moderate lexical overlap, 0 otherwise."""
    X, y, groups = [], [], []
    buyer_ids = []
    for bid in state["buyers"]:
        rows = state["pairs_by_buyer"].get(bid, [])
        if not rows:
            continue
        relevant = set()
        for bp in state["bps_by_buyer"].get(bid, []):
            top = sorted(rows, key=lambda r: -float(r["tfidf"]))[:5]
            relevant.update(r["product_id"] for r in top)
        for row in rows:
            if row["product_id"] in relevant:
                g = 3
            elif float(row["struct_sim"]) >= 0.8:
                g = 2
            elif float(row["tfidf_norm"]) >= 0.5:
                g = 1
            else:
                g = 0
            X.append(lgbm_features(row, state))
            y.append(g)
        groups.append(len(rows))
        buyer_ids.append(bid)
    return np.asarray(X, dtype=float), np.asarray(y, dtype=int), groups, buyer_ids


def train(state):
    try:
        import lightgbm as lgb
    except ImportError:
        return {"trained": False, "reason": "lightgbm not installed: run pip install lightgbm into apps/ml/.venv"}
    X, y, groups, buyer_ids = build_dataset(state)
    valid_idx = [i for i, b in enumerate(buyer_ids) if i % 5 == 0]
    train_idx = [i for i in range(len(buyer_ids)) if i not in valid_idx]
    if not valid_idx or not train_idx:
        return {"trained": False, "reason": "insufficient groups"}

    def slice_groups(idxs):
        xs, ys, gs = [], [], []
        for i in idxs:
            off = sum(groups[:i])
            xs.extend(range(off, off + groups[i]))
            gs.append(groups[i])
        return X[xs], y[xs], gs

    Xt, yt, gt = slice_groups(train_idx)
    Xv, yv, gv = slice_groups(valid_idx)
    model = lgb.LGBMRanker(
        objective="lambdarank", n_estimators=250, learning_rate=0.08, num_leaves=15,
        min_child_samples=5, random_state=42, label_gain=[0, 1, 3, 7],
    )
    model.fit(Xt, yt, group=gt, eval_set=[(Xv, yv)], eval_group=[gv], eval_at=[10],
              callbacks=[lgb.early_stopping(30, verbose=False), lgb.log_evaluation(0)])
    model.booster_.save_model(str(MODEL_PATH))
    try:
        import shap  # noqa: F401
        shap_available = True
    except ImportError:
        shap_available = False
    meta = {
        "trained": True, "label_source": "synthetic-weak (no conversion data exists)",
        "valid_ndcg_at_10": round(float(model.best_score_["valid_0"]["ndcg@10"]), 4),
        "n_groups": len(groups), "n_pairs": len(y),
        "features": LGBM_FEATURES, "trained_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "shap_available": shap_available,
        "honesty_note": "Trained on weak labels derived from catalog similarity, NOT on real conversions. Demonstrated as a pipeline scaffold.",
    }
    META_PATH.write_text(json.dumps(meta, indent=2))
    return meta


def load_meta():
    if META_PATH.exists():
        return json.loads(META_PATH.read_text())
    return {"trained": False, "reason": "no model trained yet"}


def load_model():
    try:
        import lightgbm as lgb
    except ImportError:
        return None
    if not MODEL_PATH.exists():
        return None
    return lgb.Booster(model_file=str(MODEL_PATH))


if __name__ == "__main__":
    from db import connect
    import main as main_mod
    con = connect()
    state = main_mod.load_state(con)
    print(json.dumps(train(state), indent=2))