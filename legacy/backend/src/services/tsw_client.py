"""Mock HK TSW Phase 3 submission client."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from backend.src.utils.logger import logger


class MockTSWClient:
    def __init__(self):
        self._submissions: dict[str, dict[str, Any]] = {}

    async def submit(self, payload: dict[str, Any], consent: bool = True) -> dict[str, Any]:
        if not consent:
            raise ValueError("Trader consent is required")

        submission_id = str(uuid.uuid4())
        ref = f"MOCK-TSW-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

        self._submissions[submission_id] = {
            "submission_id": submission_id,
            "tsw_reference": ref,
            "status": "submitted",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(f"TSW submission: {submission_id} -> {ref}")
        return self._submissions[submission_id]

    def get_status(self, submission_id: str) -> dict[str, Any] | None:
        return self._submissions.get(submission_id)
