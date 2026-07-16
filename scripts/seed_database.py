#!/usr/bin/env python3
"""Enosis v0 — Seed database with mock trader data for demo."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.database import init_db, SessionLocal
from src.models import Trader, CertificationTracking


def seed():
    init_db()
    db = SessionLocal()

    try:
        trader_id = "t1010101-0000-4000-a000-000000000001"
        trader = db.query(Trader).filter(Trader.id == trader_id).first()
        if not trader:
            trader = Trader(
                id=trader_id,
                name="GBA Trading Ltd",
                source_system="mock_trade",
                trader_reg_number="BR-12345678",
                certification_level="gold",
            )
            db.add(trader)
            db.commit()
            print(f"✓ Created trader: {trader.name} ({trader.id})")

        tracking = (
            db.query(CertificationTracking)
            .filter(CertificationTracking.trader_id == trader_id)
            .first()
        )
        if not tracking:
            tracking = CertificationTracking(
                trader_id=trader_id,
                records_uploaded=1234,
                accuracy_rate=0.94,
                current_level="gold",
            )
            db.add(tracking)
            db.commit()
            print(f"✓ Created certification tracking: Gold level, 1234 declarations")

        print("\n✓ Database seeded successfully!")
        print(f"  Trader ID:      {trader_id}")
        print(f"  Trader Name:    GBA Trading Ltd")
        print(f"  Certification:  Gold")
        print(f"  Declarations:   1,234")
        print(f"  Accuracy:       94%")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
