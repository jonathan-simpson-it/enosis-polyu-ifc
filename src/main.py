"""Enosis v0 — Universal Data Translation Layer.

FastAPI application entry point for the PolyU IFC 2026 hackathon demo.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles

from src.config import settings
from src.database import init_db
from src.api.health import router as health_router
from src.api.ingest import router as ingest_router
from src.api.translate import router as translate_router
from src.api.upload import router as upload_router
from src.api.certification import router as certification_router

# API Key security scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    """Validate the API key for protected endpoints.

    In v0, this uses a simple static key from config.
    Production should use OAuth2 + JWT.
    """
    if api_key is None:
        raise HTTPException(status_code=401, detail="X-API-Key header is required")

    # Skip auth for health endpoint (handled at router level)
    if api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")

    return api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — initialize DB on startup."""
    init_db()
    yield


app = FastAPI(
    title="Enosis",
    description="Universal Data Translation Layer — Unlocking data so every AI application can work.",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Mount static files for badge SVGs
app.mount("/badges", StaticFiles(directory="src/badges"), name="badges")

# Register routers — health is public, others require API key
app.include_router(health_router)
app.include_router(ingest_router, dependencies=[Depends(verify_api_key)])
app.include_router(translate_router, dependencies=[Depends(verify_api_key)])
app.include_router(upload_router, dependencies=[Depends(verify_api_key)])
app.include_router(certification_router, dependencies=[Depends(verify_api_key)])


@app.get("/")
async def root():
    """Landing page redirecting to API docs."""
    return {
        "name": "Enosis",
        "version": settings.app_version,
        "tagline": "The Universal Data Translation Layer",
        "docs": "/docs",
        "health": "/health",
    }
