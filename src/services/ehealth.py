"""Mock eHealth+ upload service for v0 demo."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


class MockEHealthAPI:
    """Simulates the eHealth+ upload API for demo purposes."""

    def __init__(self):
        """Initialize with an in-memory store."""
        self._uploads: dict[str, dict[str, Any]] = {}

    async def upload_bundle(
        self,
        clinic_id: str,
        patient_id: str,
        fhir_bundle: dict[str, Any],
        consent: bool,
    ) -> dict[str, Any]:
        """Upload a FHIR bundle to mock eHealth+.

        Args:
            clinic_id: Clinic UUID.
            patient_id: Patient UUID.
            fhir_bundle: FHIR R5 Bundle to upload.
            consent: Whether patient consent is confirmed.

        Returns:
            Upload result with reference ID.

        Raises:
            ValueError: If patient consent is not given.
        """
        if not consent:
            raise ValueError("Patient consent is required for eHealth+ upload.")

        upload_id = str(uuid.uuid4())
        ehealth_ref = f"MOCK-EH-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

        self._uploads[upload_id] = {
            "upload_id": upload_id,
            "clinic_id": clinic_id,
            "patient_id": patient_id,
            "ehealth_reference": ehealth_ref,
            "status": "completed",
            "bundle_size": len(fhir_bundle.get("entry", [])),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
        }

        return {
            "upload_id": upload_id,
            "status": "submitted",
            "ehealth_reference": ehealth_ref,
            "message": "Successfully uploaded to eHealth+ (mock)",
        }

    def get_status(self, upload_id: str) -> dict[str, Any]:
        """Retrieve upload status.

        Args:
            upload_id: The upload identifier.

        Returns:
            Status dict or not_found indicator.
        """
        if upload_id not in self._uploads:
            return {"status": "not_found"}
        return self._uploads[upload_id]
