"""Mock HK TSW Phase 3 submission service for v0 demo."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


class MockTSWAPI:
    """Simulates the HK TSW Phase 3 submission API for demo purposes."""

    def __init__(self):
        self._submissions: dict[str, dict[str, Any]] = {}

    async def submit_declaration(
        self,
        trader_id: str,
        declaration_id: str,
        wco_declaration: dict[str, Any],
        consent: bool,
    ) -> dict[str, Any]:
        if not consent:
            raise ValueError("Trader consent is required for TSW submission.")

        submission_id = str(uuid.uuid4())
        tsw_ref = f"MOCK-TSW-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

        self._submissions[submission_id] = {
            "submission_id": submission_id,
            "trader_id": trader_id,
            "declaration_id": declaration_id,
            "tsw_reference": tsw_ref,
            "status": "completed",
            "declaration_size": len(str(wco_declaration)),
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }

        return {
            "submission_id": submission_id,
            "status": "submitted",
            "tsw_reference": tsw_ref,
            "message": "Successfully submitted to HK TSW Phase 3 (mock)",
        }

    def get_status(self, submission_id: str) -> dict[str, Any]:
        if submission_id not in self._submissions:
            return {"status": "not_found"}
        return self._submissions[submission_id]
