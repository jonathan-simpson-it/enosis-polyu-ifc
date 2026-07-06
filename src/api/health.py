"""Health check endpoint."""

from fastapi import APIRouter

from src.config import settings
from src.schemas import HealthResponse, ServiceStatus

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Return system health status."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        services=ServiceStatus(
            database="connected",
            deepseek_api="available",
        ),
    )
