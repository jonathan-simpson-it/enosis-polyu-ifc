"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "v0-production-mvp",
        "services": {
            "database": "connected",
            "deepseek_api": "available",
        },
    }
