#!/usr/bin/env python3
"""
Enosis v0 — Seed database with mock clinic data for demo.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.database import init_db, SessionLocal
from src.models import Clinic, CertificationTracking


def seed():
    """Populate the database with demo data."""
    init_db()
    db = SessionLocal()

    try:
        # Create demo clinic
        clinic_id = "c1010101-0000-4000-a000-000000000001"
        clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
        if not clinic:
            clinic = Clinic(
                id=clinic_id,
                name="Central Clinic",
                cms_type="mock",
                certification_level="gold",
            )
            db.add(clinic)
            db.commit()
            print(f"✓ Created clinic: {clinic.name} ({clinic.id})")

        # Create certification tracking with fake progress
        tracking = (
            db.query(CertificationTracking)
            .filter(CertificationTracking.clinic_id == clinic_id)
            .first()
        )
        if not tracking:
            tracking = CertificationTracking(
                clinic_id=clinic_id,
                records_uploaded=1234,
                accuracy_rate=0.94,
                current_level="gold",
            )
            db.add(tracking)
            db.commit()
            print(f"✓ Created certification tracking: Gold level, 1234 records")

        print("\n✓ Database seeded successfully!")
        print(f"  Clinic ID: {clinic_id}")
        print(f"  Clinic Name: Central Clinic")
        print(f"  Certification: Gold")
        print(f"  Records: 1,234")
        print(f"  Accuracy: 94%")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
