"""Ingest + normalization: raw JSON -> SQLite (buyers, suppliers, products, tags, subclusters)."""
import json
import re
import unicodedata
from collections import Counter, defaultdict

import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

from db import RAW, ARTIFACTS, init_db, connect

FX = {
    "USD": 1.0, "EUR": 1.08, "GBP": 1.27, "INR": 0.012, "AED": 0.2723,
    "EGP": 0.0207, "MXN": 0.058, "PEN": 0.2666, "AUD": 0.66, "THB": 0.0276,
    "CAD": 0.735, "BRL": 0.1845, "MYR": 0.2127, "ZAR": 0.0548, "ARS": 0.00116,
}
FX_AS_OF = "static demo rates (2024-06)"

COUNTRY_MAP = {
    "USA": ("United States", "North America", "USMCA"),
    "CAN": ("Canada", "North America", "USMCA"),
    "MEX": ("Mexico", "North America", "USMCA"),
    "GBR": ("United Kingdom", "Europe", "UK"),
    "IRL": ("Ireland", "Europe", "EU"),
    "ITA": ("Italy", "Europe", "EU"),
    "NLD": ("Netherlands", "Europe", "EU"),
    "SVN": ("Slovenia", "Europe", "EU"),
    "PRT": ("Portugal", "Europe", "EU"),
    "BEL": ("Belgium", "Europe", "EU"),
    "ESP": ("Spain", "Europe", "EU"),
    "BGR": ("Bulgaria", "Europe", "EU"),
    "NOR": ("Norway", "Europe", "EEA"),
    "IND": ("India", "South Asia", "SAARC"),
    "NPL": ("Nepal", "South Asia", "SAARC"),
    "ARE": ("United Arab Emirates", "Middle East", "GCC"),
    "EGY": ("Egypt", "Middle East", "MENA"),
    "THA": ("Thailand", "Southeast Asia", "ASEAN"),
    "MYS": ("Malaysia", "Southeast Asia", "ASEAN"),
    "AUS": ("Australia", "Oceania", "ANZ"),
    "PER": ("Peru", "Latin America", "LATAM"),
    "BRA": ("Brazil", "Latin America", "MERCOSUR"),
    "ARG": ("Argentina", "Latin America", "MERCOSUR"),
    "ECU": ("Ecuador", "Latin America", "LATAM"),
    "ZAF": ("South Africa", "Africa", "SADC"),
    "": ("Unknown", "Unknown", "Unknown"),
}
REGION_CERTS = {
    "EU": ["CE", "REACH"],
    "UK": ["UKCA", "CE"],
    "EEA": ["CE", "REACH"],
    "North America": ["FDA", "CPSIA"],
    "GCC": ["HALAL"],
    "MENA": ["HALAL"],
    "South Asia": ["BIS"],
    "Southeast Asia": ["SNI"],
    "Oceania": ["AS/NZS"],
    "Latin America": ["NOM"],
    "MERCOSUR": ["ANVISA"],
    "Africa": ["SABS"],
    "Unknown": [],
}
PREMIUM_COUNTRIES = {"USA", "GBR", "CAN", "AUS", "NOR", "NLD", "ITA", "ESP", "BEL", "IRL", "SVN", "PRT", "ARE"}

UNIT_MAP = {
    "piece": "pcs", "pieces": "pcs", "pc": "pcs", "pcs": "pcs", "pcs.": "pcs", "pis": "pcs", "psc": "pcs",
    "bag": "bag", "bags": "bag", "back": "bag",
    "set": "set", "sets": "set",
    "kg": "kg", "kgs": "kg", "kilogram": "kg",
    "ton": "ton", "tons": "ton",
    "box": "box", "boxe": "box",
    "carton": "carton", "cartons": "carton",
    "pair": "pair", "pairs": "pair",
    "pack": "pack", "packs": "pack",
    "bottle": "bottle", "bottles": "bottle",
}
UNIT_JUNK = {"per", "each", "item", "items", "individual", "article", "wenzhou"}
CERT_PATTERNS = [
    (r"iso\s*9001", "ISO 9001"), (r"iso\s*14000", "ISO 14000"), (r"iso\s*14001", "ISO 14001"),
    (r"ts\s*16949", "TS 16949"), (r"iatf\s*16949", "IATF 16949"), (r"\bbsci\b", "BSCI"),
    (r"\bsedex\b", "SEDEX"), (r"\bce\b", "CE"), (r"\breach\b", "REACH"), (r"\brohs\b", "RoHS"),
    (r"\bfda\b", "FDA"), (r"\bcpsia\b", "CPSIA"), (r"oeko-tex", "OEKO-TEX"), (r"\bgots\b", "GOTS"),
    (r"\bsgs\b", "SGS"), (r"\bhaccp\b", "HACCP"), (r"\bbrc\b", "BRC"), (r"\bfsc\b", "FSC"),
    (r"\ben71\b", "EN71"), (r"\bastm\b", "ASTM"),
]

SPECIES_PATTERNS = [
    ("dog", r"\b(dog|dogs|puppy|puppies|canine|pup)\b"),
    ("cat", r"\b(cat|cats|kitten|kittens|feline|kitty)\b"),
    ("bird", r"\b(bird|birds|parrot|parakeet|avian|cockatiel|budgie)\b"),
    ("fish", r"\b(fish|aquarium|aquatic|koi|goldfish|betta)\b"),
    ("reptile", r"\b(reptile|terrarium|tortoise|turtle|lizard|gecko|snake|bearded dragon)\b"),
    ("small-animal", r"\b(hamster|rabbit|bunny|guinea pig|gerbil|ferret|chinchilla|small animal|rodent)\b"),
]
TYPE_PATTERNS = [
    ("litter", r"\blitter\b|cat toilet|training pad|\bpee pads?\b"),
    ("bowl-feeder", r"\bbowls?\b|\bfeeders?\b|\bfeeding\b|fountain|waterer|water dispenser|food dish|\bdrinking\b"),
    ("bed-furniture", r"\bbeds?\b|\bmats?\b|mattress|cushion|\bhouses?\b|kennel|\bsofa\b|hammock|\bnest\b|\bperch\b|\bbasket\b"),
    ("carrier-crate", r"carrier|\bcrates?\b|\bcages?\b|\bcarry\b|backpack|\bstroller\b"),
    ("toy", r"\btoys?\b|\bballs?\b|\bchew|squeak|\bbones?\b|scratcher|scratching|wand|\blure|rope|plush|teaser|tunnel|puzzle"),
    ("collar-leash-harness", r"\bcollars?\b|\bcollars?\b|\bleash|\bleads?\b|harness|muzzle|chain|\bclips?\b"),
    ("apparel", r"apparel|clothing|\bcoats?\b|jacket|\bvest|\bshirts?\b|sweater|raincoat|dress|\bbandana|diaper|\bboots?\b"),
    ("grooming", r"\bbrush|\bcomb|grooming|shampoo|conditioner|clipper|nail|\bdeshed|shedding|stripper|\bwipes?\b"),
    ("treats-food", r"\bfoods?\b|treat|snack|biscuit|jerky|granule|kibble|\bdiet\b|nutrition|\bmilk\b|canned"),
    ("aquarium", r"aquarium|\btank\b|\bfilter\b|\bpumps?\b|\bpond\b|\bgravel\b"),
]
COLOR_WORDS = ["multicolor", "multi-color", "assorted", "red", "blue", "green", "yellow", "black",
               "white", "pink", "brown", "grey", "gray", "purple", "orange", "beige", "gold", "silver"]

STOPWORDS = set("""a an and are as at be by for from has have in is it its of on or that the to was were will with
this their they you your our we not no all any can more also products product pet pets made make used use using
quality good high new size sizes color colors material materials""".split())


def as_text(v):
    if v is None:
        return None
    if isinstance(v, str):
        return v
    return json.dumps(v)


def clean_text(t):
    if not t:
        return ""
    t = unicodedata.normalize("NFKC", t)
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def slugify(t):
    s = re.sub(r"[^a-z0-9]+", "-", (t or "").lower()).strip("-")
    return s or "unknown"


def parse_spec(spec_raw):
    specs = {}
    if not spec_raw:
        return specs
    for part in re.split(r"[;\n]", spec_raw):
        if ":" in part:
            k, v = part.split(":", 1)
            k = clean_text(k).strip()
            v = clean_text(v).strip()
            if k and v and len(k) < 30:
                specs[k[:40]] = v[:200]
    return specs


def parse_moq_unit(remarks):
    if not remarks:
        return "", "unit"
    m = re.search(r"moq\s*unit\s*[:\-]\s*([A-Za-z.]+)", remarks, re.I)
    raw = m.group(1) if m else ""
    low = raw.lower()
    if not low or low in UNIT_JUNK:
        return raw, "unit"
    return raw, UNIT_MAP.get(low, low)


def parse_price(price_str):
    if not price_str or str(price_str).strip().lower() in ("none", "null", ""):
        return None, None, "", "missing"
    s = str(price_str)
    if "contact" in s.lower():
        return None, None, "", "contact"
    m = re.search(r"([A-Z]{2,3})\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:-\s*([0-9]+(?:\.[0-9]+)?))?\s*/?\s*([A-Za-z]+)?", s)
    if not m:
        return None, None, "", "unparsed"
    cur, lo, hi, unit = m.group(1), float(m.group(2)), float(m.group(3) or m.group(2)), (m.group(4) or "").lower()
    return lo, hi, unit, "real"


def extract_certs(*texts):
    blob = " ".join(as_text(t) or "" for t in texts).lower()
    found = []
    for pat, name in CERT_PATTERNS:
        if re.search(pat, blob) and name not in found:
            found.append(name)
    return found


def tag_doc(text, specs=None):
    specs = specs or {}
    low = (text or "").lower()
    species = "general"
    for name, pat in SPECIES_PATTERNS:
        if re.search(pat, low):
            species = name
            break
    ptype = "other"
    for name, pat in TYPE_PATTERNS:
        if re.search(pat, low):
            ptype = name
            break
    color = None
    for k in ("Color", "Colour", "colour", "color"):
        if specs.get(k):
            raw = clean_text(specs[k]).lower()
            for c in COLOR_WORDS:
                if c in raw:
                    color = c
                    break
            if color is None:
                color = raw.split("/")[0].split(",")[0].strip()[:20] or None
            break
    if not color:
        for c in COLOR_WORDS:
            if c in low:
                color = c
                break
    return species, ptype, color


def run():
    con = init_db()
    cur = con.cursor()

    for t in ("matches", "pair_features", "buyer_products", "buyers", "supplier_products", "suppliers", "feature_meta"):
        cur.execute(f"DELETE FROM {t}")

    suppliers_raw = json.load(open(RAW / "pet_supplier_products_100.json"))
    buyers_raw = json.load(open(RAW / "buyer_catalog.json"))

    # ---------- suppliers + supplier products ----------
    supplier_ids = {}
    products = []
    for r in suppliers_raw:
        sname = clean_text(r.get("supplier_name") or f"Supplier {r['product_id']}")
        if sname not in supplier_ids:
            sid = len(supplier_ids) + 1
            supplier_ids[sname] = sid
            certs = extract_certs(r.get("supplier_profile"), r.get("product_features"))
            addr = r.get("supplier_address") or ""
            province = ""
            parts = [p.strip() for p in addr.split(",") if p.strip()]
            if len(parts) >= 2:
                province = parts[-2]
            cur.execute(
                "INSERT INTO suppliers (id,name,website,country,province,year_established,business_type,specialized_in,"
                "main_export_markets,tags,certs,profile) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (sid, sname, as_text(r.get("supplier_website")), "CHN", province,
                 r.get("supplier_year_established"), as_text(r.get("supplier_business_type")), as_text(r.get("supplier_specialized_in")),
                 as_text(r.get("supplier_main_export_markets")), as_text(r.get("supplier_tags")), json.dumps(certs), as_text(r.get("supplier_profile"))),
            )
        sid = supplier_ids[sname]
        specs = parse_spec(r.get("product_specification"))
        moq_raw_unit, moq_unit = parse_moq_unit(r.get("remarks"))
        pmin, pmax, punit, psource = parse_price(r.get("scraped_product_price"))
        imgs = [u.strip() for u in (r.get("product_image_url") or "").split(";") if u.strip()]
        doc = clean_text(" ".join(filter(None, [
            r.get("product_name"), r.get("product_features"), r.get("product_specification"),
            r.get("supplier_specialized_in"), " ".join(imgs[:0]),
        ])))
        species, ptype, color = tag_doc(doc, specs)
        certs = extract_certs(r.get("product_features"), r.get("supplier_profile"), r.get("supplier_tags"))
        products.append({
            "id": r["product_id"], "supplier_id": sid, "name": clean_text(r.get("product_name")),
            "features": r.get("product_features"), "spec_raw": r.get("product_specification"), "specs": specs,
            "moq": r.get("product_moq"), "moq_unit_raw": moq_raw_unit, "moq_unit": moq_unit,
            "price_min": pmin, "price_max": pmax, "price_unit": punit, "price_source": psource,
            "target_markets": r.get("target_markets"), "image_urls": imgs, "primary_image": imgs[0] if imgs else None,
            "species": species, "product_type": ptype, "color": color, "certs": certs, "doc": doc,
        })

    # ---------- buyers (entity = supplier_name in buyer catalog) ----------
    buyer_map = {}
    buyer_products = []
    for i, r in enumerate(buyers_raw):
        bname = clean_text(r.get("supplier_name") or r.get("brand") or f"Buyer {i}")
        bid = slugify(bname)
        if bid in buyer_map:
            entry = buyer_map[bid]
            if bname not in entry["names"]:
                entry["names"].append(bname)
        else:
            buyer_map[bid] = {"id": bid, "names": [bname], "iso3": (r.get("supplier_country") or "").strip(), "rows": []}
        buyer_map[bid]["rows"].append(r)
        if not buyer_map[bid]["iso3"]:
            buyer_map[bid]["iso3"] = (r.get("supplier_country") or "").strip()
        desc = clean_text(r.get("description"))
        specs = r.get("specifications") or {}
        if not isinstance(specs, dict):
            specs = {}
        specs = {clean_text(str(k)): clean_text(str(v)) for k, v in specs.items()}
        materials = r.get("materials") or []
        if isinstance(materials, str):
            materials = [materials]
        certs = r.get("certifications") or []
        if isinstance(certs, str):
            certs = [certs]
        mat_text = " ".join(str(m) for m in materials if m)
        specs_text = " ".join(specs.values())
        merchant = clean_text(r.get("merchant_category"))
        doc = clean_text(" ".join(filter(None, [r.get("product_name"), desc, specs_text, mat_text, merchant])))
        species, ptype, color = tag_doc(doc, specs)
        price = None
        try:
            price = float(r.get("price"))
        except (TypeError, ValueError):
            price = None
        cur_ = (r.get("currency") or "").strip().upper()
        rate = FX.get(cur_)
        price_usd = round(price * rate, 2) if (price is not None and rate) else None
        buyer_products.append({
            "buyer_id": bid, "idx": i, "name": clean_text(r.get("product_name")), "description": desc,
            "specs": specs, "materials": [str(m) for m in materials if m], "certifications": [str(c) for c in certs if c],
            "price_orig": price, "currency": cur_, "fx_rate": rate, "price_usd": price_usd,
            "merchant_category": merchant, "image_url": (r.get("image_url") or "").strip(),
            "in_stock": str(r.get("in_stock_at_extraction")), "species": species, "product_type": ptype,
            "color": color, "doc": doc,
        })

    for b in buyer_map.values():
        usd = [p["price_usd"] for p in buyer_products if p["buyer_id"] == b["id"] and p["price_usd"]]
        usd_sorted = sorted(usd)
        if len(usd_sorted) == 0:
            p25 = p50 = p75 = None
        elif len(usd_sorted) == 1:
            p25 = p50 = p75 = usd_sorted[0]
        else:
            p25, p50, p75 = (float(v) for v in np.percentile(usd_sorted, [25, 50, 75]))
        iso3 = b["iso3"]
        country, region, bloc = COUNTRY_MAP.get(iso3, ("Unknown", "Unknown", "Unknown"))
        n = len(b["rows"])
        est_vol = 800 + 1200 * n + (2500 if (p50 or 0) >= 50 else 0) + (1500 if iso3 in PREMIUM_COUNTRIES else 0)
        tier = "premium" if (p50 or 0) >= 40 else "mass"
        certs_req = REGION_CERTS.get(bloc, []) or REGION_CERTS.get(region, [])
        cur_mix = Counter((p["currency"] or "?") for p in buyer_products if p["buyer_id"] == b["id"])
        img = next((p["image_url"] for p in buyer_products if p["buyer_id"] == b["id"] and p["image_url"]), None)
        cur.execute(
            "INSERT INTO buyers (id,name,country_iso3,country,region,trade_bloc,n_products,price_band_p25,"
            "price_band_p50,price_band_p75,price_currency_mix,brand_tier,certs_required,image,est_monthly_volume,"
            "dominant_subcluster) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL)",
            (b["id"], b["names"][0], iso3, country, region, bloc, n,
             round(p25, 2) if p25 else None, round(p50, 2) if p50 else None, round(p75, 2) if p75 else None,
             json.dumps(dict(cur_mix)), tier, json.dumps(certs_req), img, est_vol),
        )

    # ---------- subclusters (KMeans over TF-IDF of all docs) ----------
    all_docs = [p["doc"] for p in products] + [p["doc"] for p in buyer_products]
    vec = TfidfVectorizer(max_features=8000, stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
    X = vec.fit_transform(all_docs)
    k = 8
    km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    labels = km.labels_
    for i, p in enumerate(products):
        p["subcluster"] = int(labels[i])
    for j, bp in enumerate(buyer_products):
        bp["subcluster"] = int(labels[len(products) + j])

    for p in products:
        cur.execute(
            "INSERT INTO supplier_products (id,supplier_id,name,features,specification_raw,specs,moq,moq_unit_raw,"
            "moq_unit,price_min,price_max,price_unit,price_source,target_markets,image_urls,primary_image,species,"
            "product_type,color,tags_source,tag_confidence,subcluster,certs,doc) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (p["id"], p["supplier_id"], p["name"], p["features"], p["spec_raw"], json.dumps(p["specs"]),
             p["moq"], p["moq_unit_raw"], p["moq_unit"], p["price_min"], p["price_max"], p["price_unit"],
             p["price_source"], p["target_markets"], json.dumps(p["image_urls"]), p["primary_image"],
             p["species"], p["product_type"], p["color"], "keyword", 0.5, p["subcluster"],
             json.dumps(p["certs"]), p["doc"]),
        )
    for bp in buyer_products:
        cur.execute(
            "INSERT INTO buyer_products (id,buyer_id,name,description,specs,materials,certifications,price_orig,"
            "currency,fx_rate,price_usd,merchant_category,image_url,in_stock,species,product_type,color,tags_source,"
            "tag_confidence,subcluster,doc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (bp["idx"], bp["buyer_id"], bp["name"], bp["description"], json.dumps(bp["specs"]),
             json.dumps(bp["materials"]), json.dumps(bp["certifications"]), bp["price_orig"], bp["currency"],
             bp["fx_rate"], bp["price_usd"], bp["merchant_category"], bp["image_url"], bp["in_stock"],
             bp["species"], bp["product_type"], bp["color"], "keyword", 0.5, bp["subcluster"], bp["doc"]),
        )

    # buyer dominant subcluster
    by_sub = defaultdict(Counter)
    for bp in buyer_products:
        by_sub[bp["buyer_id"]][bp["subcluster"]] += 1
    for bid, cnt in by_sub.items():
        cur.execute("UPDATE buyers SET dominant_subcluster=? WHERE id=?", (cnt.most_common(1)[0][0], bid))

    # subcluster names from top centroid terms (for UI labels)
    terms = vec.get_feature_names_out()
    names = {}
    for ci in range(k):
        top = terms[np.argsort(-km.cluster_centers_[ci])[:5]]
        names[str(ci)] = ", ".join(str(t) for t in top)
    (ARTIFACTS / "subclusters.json").write_text(json.dumps(names, indent=2))

    # ---------- feature metadata ----------
    meta = [
        ("bm25", "content", "BM25 lexical similarity between buyer catalog text and supplier product text", 0.30, "real"),
        ("tfidf", "content", "TF-IDF cosine (word 1-2 grams + char 3-5 grams)", 0.30, "real"),
        ("profile_sim", "content", "Cosine between buyer profile embedding (mean of their catalog) and product", 0.15, "real"),
        ("struct_sim", "content", "Structured attribute match: species, product type, color, material", 0.25, "real"),
        ("visual_sim", "visual", "CLIP image embedding cosine between product photo and buyer's catalog photos", 1.0, "partial"),
        ("market_fit", "market", "Market fit: supplier export markets + regional certification fit + target-market breadth", 1.0, "partial"),
        ("feasibility", "feasibility", "MOQ feasibility vs estimated buyer monthly volume (heuristic volume model)", 1.0, "partial"),
        ("margin_floor", "margin", "Expected wholesale margin vs floor (needs factory cost data)", 0.0, "stub"),
        ("risk", "risk", "Buyer credit + country risk penalty (needs credit/payment data)", 0.0, "stub"),
    ]
    for name, block, desc, w, status in meta:
        cur.execute("INSERT OR REPLACE INTO feature_meta (name,block,description,default_weight,data_status) VALUES (?,?,?,?,?)",
                    (name, block, desc, w, status))

    con.commit()
    summary = {
        "suppliers": len(supplier_ids), "supplier_products": len(products),
        "buyers": len(buyer_map), "buyer_products": len(buyer_products),
        "fx_as_of": FX_AS_OF,
        "subcluster_sizes": {str(i): int((labels == i).sum()) for i in range(k)},
    }
    (ARTIFACTS / "ingest_summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    return summary


if __name__ == "__main__":
    run()