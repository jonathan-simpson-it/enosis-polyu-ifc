import sqlite3
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "trading"
DB_PATH = Path(os.environ.get("DEEPBRIDGE_DB", DATA / "deepbridge.db"))
ARTIFACTS = Path(os.environ.get("DEEPBRIDGE_ARTIFACTS", DATA / "artifacts"))
IMG_CACHE = Path(os.environ.get("DEEPBRIDGE_IMG_CACHE", DATA / "img_cache"))
RAW = Path(os.environ.get("DEEPBRIDGE_RAW", DATA / "raw"))

ARTIFACTS.mkdir(parents=True, exist_ok=True)
IMG_CACHE.mkdir(parents=True, exist_ok=True)

SCHEMA = """
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY,
  name TEXT, website TEXT, country TEXT, province TEXT,
  year_established INTEGER, business_type TEXT, specialized_in TEXT,
  main_export_markets TEXT, tags TEXT, certs TEXT, profile TEXT
);
CREATE TABLE IF NOT EXISTS supplier_products (
  id INTEGER PRIMARY KEY,
  supplier_id INTEGER, name TEXT, features TEXT,
  specification_raw TEXT, specs TEXT,
  moq INTEGER, moq_unit_raw TEXT, moq_unit TEXT,
  price_min REAL, price_max REAL, price_unit TEXT, price_source TEXT,
  target_markets TEXT, image_urls TEXT, primary_image TEXT,
  species TEXT, product_type TEXT, color TEXT, tags_source TEXT, tag_confidence REAL,
  subcluster INTEGER, certs TEXT, doc TEXT
);
CREATE TABLE IF NOT EXISTS buyers (
  id TEXT PRIMARY KEY, name TEXT, country_iso3 TEXT, country TEXT, region TEXT,
  trade_bloc TEXT, n_products INTEGER,
  price_band_p25 REAL, price_band_p50 REAL, price_band_p75 REAL,
  price_currency_mix TEXT, brand_tier TEXT, certs_required TEXT, image TEXT,
  est_monthly_volume INTEGER, dominant_subcluster INTEGER
);
CREATE TABLE IF NOT EXISTS buyer_products (
  id INTEGER PRIMARY KEY, buyer_id TEXT, name TEXT, description TEXT, specs TEXT,
  materials TEXT, certifications TEXT, price_orig REAL, currency TEXT, fx_rate REAL,
  price_usd REAL, merchant_category TEXT, image_url TEXT, in_stock TEXT,
  species TEXT, product_type TEXT, color TEXT, tags_source TEXT, tag_confidence REAL,
  subcluster INTEGER, doc TEXT
);
CREATE TABLE IF NOT EXISTS pair_features (
  buyer_id TEXT, product_id INTEGER,
  bm25 REAL, tfidf REAL, profile_sim REAL, struct_sim REAL,
  bm25_norm REAL, tfidf_norm REAL, profile_norm REAL, struct_norm REAL,
  visual_sim REAL, visual_norm REAL,
  market_fit REAL, export_match REAL, cert_fit REAL, target_bonus REAL,
  feasibility REAL, moq_note TEXT,
  content REAL,
  matched_tokens TEXT, matched_products TEXT,
  PRIMARY KEY (buyer_id, product_id)
);
CREATE TABLE IF NOT EXISTS matches (
  buyer_id TEXT, product_id INTEGER, rank INTEGER, score REAL, calibrated_p REAL,
  breakdown TEXT, contributions TEXT, constraints TEXT, confidence TEXT,
  ranker TEXT, config_hash TEXT
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT, buyer_id TEXT, product_id INTEGER,
  action TEXT, actor TEXT, ts TEXT
);
CREATE TABLE IF NOT EXISTS feature_meta (
  name TEXT PRIMARY KEY, block TEXT, description TEXT,
  default_weight REAL, data_status TEXT
);
CREATE TABLE IF NOT EXISTS eval_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, payload TEXT
);
"""


def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    return con


def init_db():
    con = connect()
    con.executescript(SCHEMA)
    con.commit()
    return con


def jload(v, default=None):
    if v is None:
        return default
    try:
        return json.loads(v)
    except Exception:
        return default