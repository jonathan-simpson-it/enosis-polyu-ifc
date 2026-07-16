#!/usr/bin/env python3
"""Seed HS code knowledge base from CSV with embeddings."""

import sys
import os
import csv

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.src.core.config import settings
from backend.src.core.database import Base
from backend.src.core.models.trade import HSCode
from backend.src.extraction.vector import generate_embedding


def seed():
    engine = create_engine(settings.database_url_sync)
    Base.metadata.create_all(bind=engine)

    db = Session(engine)

    csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "hs_codes.csv")
    count = 0

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row["code"].strip()
            desc = row["description"].strip()
            chapter = row.get("chapter", "").strip()

            existing = db.query(HSCode).filter(HSCode.code == code).first()
            if existing:
                continue

            hs = HSCode(
                code=code,
                description=desc,
                chapter=chapter,
                heading=code[:4] if len(code) >= 4 else code,
                subheading=code[:6] if len(code) >= 6 else code,
            )

            embedding = generate_embedding(f"{code} {desc}")
            if embedding:
                hs.embedding = embedding

            db.add(hs)
            count += 1

    db.commit()
    db.close()
    print(f"Seeded {count} HS codes with embeddings")


if __name__ == "__main__":
    seed()
