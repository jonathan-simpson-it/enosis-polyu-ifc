"""Ingest + normalize invariants and determinism."""
import sqlite3
import tempfile
from pathlib import Path

from conftest import pair_checksum, run_ingest


def rows(db: Path, sql: str):
    con = sqlite3.connect(db)
    out = con.execute(sql).fetchall()
    con.close()
    return out


def test_counts(ingested):
    db = ingested / "deepbridge.db"
    assert rows(db, "SELECT COUNT(*) FROM suppliers")[0][0] == 57
    assert rows(db, "SELECT COUNT(*) FROM supplier_products")[0][0] == 100
    assert rows(db, "SELECT COUNT(*) FROM buyers")[0][0] == 65
    assert rows(db, "SELECT COUNT(*) FROM buyer_products")[0][0] == 100
    assert rows(db, "SELECT COUNT(*) FROM pair_features")[0][0] == 6500


def test_buyer_profiles_are_sparse(ingested):
    db = ingested / "deepbridge.db"
    sizes = [r[0] for r in rows(db, "SELECT n_products FROM buyers")]
    assert max(sizes) <= 2
    assert sizes.count(1) == 30


def test_moq_units_normalized(ingested):
    db = ingested / "deepbridge.db"
    units = {r[0] for r in rows(db, "SELECT DISTINCT moq_unit FROM supplier_products")}
    allowed = {"pcs", "bag", "set", "pack", "bottle", "kg", "ton", "box", "carton", "pair", "unit"}
    assert units <= allowed


def test_fx_conversion_applied(ingested):
    db = ingested / "deepbridge.db"
    gbp = rows(
        db,
        "SELECT price_orig, price_usd, fx_rate FROM buyer_products WHERE currency='GBP' LIMIT 1",
    )[0]
    assert gbp[0] is not None and gbp[1] is not None
    assert abs(gbp[1] - round(gbp[0] * gbp[2], 2)) < 0.01


def test_pipeline_deterministic(ingested):
    second = Path(tempfile.mkdtemp(prefix="deepbridge-test-2-"))
    run_ingest(second)
    assert pair_checksum(ingested / "deepbridge.db") == pair_checksum(second / "deepbridge.db")