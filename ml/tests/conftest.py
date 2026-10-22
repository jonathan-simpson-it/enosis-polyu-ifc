"""Test fixtures: isolate the DB and artifacts in a temp workspace, run ingest once, expose app."""
import hashlib
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
ML = REPO / "ml"
TMP = Path(tempfile.mkdtemp(prefix="deepbridge-test-"))

os.environ["DEEPBRIDGE_DB"] = str(TMP / "deepbridge.db")
os.environ["DEEPBRIDGE_ARTIFACTS"] = str(TMP / "artifacts")
os.environ["DEEPBRIDGE_IMG_CACHE"] = str(TMP / "img_cache")
os.environ["DEEPBRIDGE_RAW"] = str(REPO / "data" / "trading" / "raw")

for sub in ("artifacts", "img_cache"):
    (TMP / sub).mkdir(parents=True, exist_ok=True)
for f in (REPO / "data" / "trading" / "artifacts").iterdir():
    if f.is_file() and f.suffix in (".json", ".npy", ".txt"):
        shutil.copy(f, TMP / "artifacts" / f.name)


def run_ingest(workspace: Path):
    env = os.environ.copy()
    env["DEEPBRIDGE_DB"] = str(workspace / "deepbridge.db")
    env["DEEPBRIDGE_ARTIFACTS"] = str(workspace / "artifacts")
    env["DEEPBRIDGE_IMG_CACHE"] = str(workspace / "img_cache")
    for sub in ("artifacts", "img_cache"):
        (workspace / sub).mkdir(parents=True, exist_ok=True)
    for f in (REPO / "data" / "trading" / "artifacts").iterdir():
        if f.is_file() and f.suffix in (".json", ".npy", ".txt"):
            shutil.copy(f, workspace / "artifacts" / f.name)
    subprocess.run(
        [sys.executable, str(ML / "ingest.py")],
        cwd=str(ML),
        env=env,
        check=True,
        capture_output=True,
    )


def pair_checksum(db: Path) -> str:
    con = sqlite3.connect(db)
    rows = con.execute(
        "SELECT buyer_id, product_id, ROUND(content,6), ROUND(bm25,6), ROUND(tfidf,6), "
        "ROUND(struct_sim,6), ROUND(market_fit,6), ROUND(feasibility,6) "
        "FROM pair_features ORDER BY buyer_id, product_id"
    ).fetchall()
    con.close()
    return hashlib.sha1(repr(rows).encode()).hexdigest()


@pytest.fixture(scope="session")
def ingested():
    run_ingest(TMP)
    return TMP


@pytest.fixture(scope="session")
def state(ingested):
    sys.path.insert(0, str(ML))
    from db import connect
    import main as main_mod

    return main_mod.load_state(connect())


@pytest.fixture(scope="session")
def client(ingested):
    sys.path.insert(0, str(ML))
    import main as main_mod
    from fastapi.testclient import TestClient

    with TestClient(main_mod.app) as c:
        yield c