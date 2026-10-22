"""CLIP precompute (behind a flag): image download -> zero-shot tags + embeddings -> visual similarity.

Usage:  python vision.py --with-vision
Caches everything under data/ so the demo runs offline afterwards (no torch needed at serve time).
"""
import argparse
import json
import time
import urllib.request
from pathlib import Path

import numpy as np

from db import ARTIFACTS, IMG_CACHE, connect

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

SPECIES_LABELS = {
    "dog": "a photo of a dog product", "cat": "a photo of a cat product",
    "bird": "a photo of a bird or parrot product", "fish": "a photo of an aquarium or fish product",
    "reptile": "a photo of a reptile terrarium product", "small-animal": "a photo of a small animal product",
    "general": "a photo of a general pet product",
}
TYPE_LABELS = {
    "bowl-feeder": "a photo of a pet bowl, dish or feeder", "bed-furniture": "a photo of a pet bed, mat, house or furniture",
    "toy": "a photo of a pet toy or ball", "collar-leash-harness": "a photo of a dog collar, leash or harness",
    "apparel": "a photo of pet clothing or apparel", "grooming": "a photo of a pet grooming tool, brush or shampoo",
    "litter": "a photo of cat litter or a litter box", "treats-food": "a photo of pet food, treats or snacks",
    "carrier-crate": "a photo of a pet carrier, crate or travel bag", "aquarium": "a photo of an aquarium, fish tank or filter",
    "other": "a photo of an unrelated or misc product",
}
COLOR_LABELS = {
    "red": "a photo of a red product", "blue": "a photo of a blue product", "green": "a photo of a green product",
    "yellow": "a photo of a yellow product", "black": "a photo of a black product", "white": "a photo of a white product",
    "pink": "a photo of a pink product", "brown": "a photo of a brown product", "grey": "a photo of a grey product",
    "multicolor": "a photo of a multicolored product",
}


def download(url, dest: Path, timeout=20):
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read()
        if len(data) < 200:
            return None
        dest.write_bytes(data)
        return dest
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--with-vision", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="limit items per side (debug)")
    args = ap.parse_args()
    if not args.with_vision:
        print("pass --with-vision to run CLIP precompute")
        return

    import torch
    import open_clip
    from PIL import Image

    t0 = time.time()
    con = connect()
    sps = [dict(r) for r in con.execute("SELECT id, primary_image FROM supplier_products WHERE primary_image IS NOT NULL")]
    bps = [dict(r) for r in con.execute("SELECT id, image_url FROM buyer_products WHERE image_url != ''")]
    if args.limit:
        sps, bps = sps[: args.limit], bps[: args.limit]
    print(f"downloading images: {len(sps)} supplier + {len(bps)} buyer ...")

    def fetch(tag, items, urlkey):
        ok = []
        for it in items:
            dest = IMG_CACHE / f"{tag}_{it['id']}.img"
            if download(it[urlkey], dest):
                ok.append((it["id"], dest))
        print(f"  {tag}: {len(ok)}/{len(items)} images cached")
        return ok

    sp_imgs = fetch("sp", sps, "primary_image")
    bp_imgs = fetch("bp", bps, "image_url")

    device = "cpu"
    if torch.backends.mps.is_available():
        device = "mps"
    print(f"loading CLIP ViT-B/32 on {device} ...")
    model, _, preprocess = open_clip.create_model_and_transforms(
        "ViT-B-32", pretrained="laion2b_s34b_b79k", cache_dir=str(ARTIFACTS / "clip_cache"))
    model = model.to(device).eval()
    tokenizer = open_clip.get_tokenizer("ViT-B-32")

    def load_img(path):
        try:
            return preprocess(Image.open(path).convert("RGB"))
        except Exception:
            return None

    def embed_images(imgs):
        vecs, ids = [], []
        batch = []
        with torch.no_grad():
            for pid, path in imgs:
                t = load_img(path)
                if t is None:
                    continue
                batch.append((pid, t))
                if len(batch) == 32:
                    tens = torch.stack([b[1] for b in batch]).to(device)
                    feats = model.encode_image(tens)
                    feats = feats / feats.norm(dim=-1, keepdim=True)
                    vecs.append(feats.cpu().numpy())
                    ids.extend(b[0] for b in batch)
                    batch = []
            if batch:
                tens = torch.stack([b[1] for b in batch]).to(device)
                feats = model.encode_image(tens)
                feats = feats / feats.norm(dim=-1, keepdim=True)
                vecs.append(feats.cpu().numpy())
                ids.extend(b[0] for b in batch)
        return ids, (np.vstack(vecs) if vecs else np.zeros((0, 512)))

    def embed_label_group(labels: dict):
        prompts = []
        names = []
        for k, txt in labels.items():
            names.append(k)
            prompts.append(txt)
            prompts.append(f"a product photo of {txt.replace('a photo of ', '')}")
        with torch.no_grad():
            tokens = tokenizer(prompts).to(device)
            tf = model.encode_text(tokens)
            tf = tf / tf.norm(dim=-1, keepdim=True)
        return names, tf.cpu().numpy()

    print("encoding images ...")
    sp_ids, sp_vecs = embed_images(sp_imgs)
    bp_ids, bp_vecs = embed_images(bp_imgs)
    np.save(ARTIFACTS / "clip_sp.npy", sp_vecs)
    np.save(ARTIFACTS / "clip_bp.npy", bp_vecs)
    (ARTIFACTS / "clip_ids.json").write_text(json.dumps({"supplier": sp_ids, "buyer": bp_ids}))

    print("zero-shot tagging (hybrid: keyword base, CLIP fills gaps) ...")
    tag_stats = {"applied": 0, "kept_keyword": 0}
    for labels, col, group in (
        (SPECIES_LABELS, "species", "species"),
        (TYPE_LABELS, "product_type", "type"),
        (COLOR_LABELS, "color", "color"),
    ):
        names, tf = embed_label_group(labels)
        logit_scale = model.logit_scale.exp().item()
        for vecs, table in ((sp_vecs, "supplier_products"), (bp_vecs, "buyer_products")):
            sims = vecs @ tf.T * logit_scale  # (n, 2*len(names)); duplicates per template
            sims = (sims[:, 0::2] + sims[:, 1::2]) / 2
            ex = np.exp(sims - sims.max(axis=1, keepdims=True))
            probs = ex / ex.sum(axis=1, keepdims=True)
            for i, pid in enumerate(sp_ids if table == "supplier_products" else bp_ids):
                top = int(np.argmax(probs[i]))
                conf = float(probs[i][top])
                cur = con.execute(f"SELECT {col} FROM {table} WHERE id=?", (pid,)).fetchone()
                existing = cur[0] if cur else None
                gap = existing is None or existing in ("general", "other")
                min_conf = 0.4 if group != "color" else 0.35
                if gap and conf >= min_conf:
                    con.execute(f"UPDATE {table} SET {col}=?, tags_source='clip', tag_confidence=? WHERE id=?",
                                (names[top], round(conf, 3), pid))
                    tag_stats["applied"] += 1
                else:
                    tag_stats["kept_keyword"] += 1
    con.commit()

    if len(sp_ids) and len(bp_ids):
        sim = bp_vecs @ sp_vecs.T
        sp_pos = {pid: i for i, pid in enumerate(sp_ids)}
        visual = {}
        for bi, bid in enumerate(bp_ids):
            for pid, si in sp_pos.items():
                visual[f"{bid}|{pid}"] = round(float(sim[bi, si]), 4)
        (ARTIFACTS / "visual_sim.json").write_text(json.dumps(visual))
        print(f"visual similarity: {len(visual)} pair scores written")

    meta = {
        "model": "ViT-B-32 laion2b_s34b_b79k", "device": device,
        "supplier_images": len(sp_ids), "buyer_images": len(bp_ids),
        "tagging": "hybrid: keyword base, CLIP fills general/other/empty gaps",
        "tags_applied": tag_stats,
        "runtime_seconds": round(time.time() - t0, 1),
    }
    (ARTIFACTS / "clip_meta.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta, indent=2))
    print("now re-run features.py and reload the API to fold visual similarity into scoring")


if __name__ == "__main__":
    main()