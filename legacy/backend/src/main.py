"""Enosis UDIE — FastAPI application entry point (Production MVP)."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.core.config import settings
from backend.src.core.database import init_db, close_db
from backend.src.core.exceptions import register_exception_handlers

from backend.src.api.v1.health import router as health_router
from backend.src.api.v1.auth import router as auth_router
from backend.src.api.v1.orgs import router as orgs_router
from backend.src.api.v1.documents import router as documents_router
from backend.src.api.v1.extraction import router as extraction_router
from backend.src.api.v1.export import router as export_router
from backend.src.api.v1.research import router as research_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title=settings.app_name,
    description="Universal AI-Ready Data Ingestion Engine — HK TSW Phase 3. Translate any trade document to WCO-standardized schemas.",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(orgs_router)
app.include_router(documents_router)
app.include_router(extraction_router)
app.include_router(export_router)
app.include_router(research_router)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "tagline": "The Universal AI-Ready Data Ingestion Engine",
        "docs": "/docs",
        "health": "/health",
    }
