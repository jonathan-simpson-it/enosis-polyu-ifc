"""Enosis v0 — Universal Data Translation Layer (Trading Domain).

FastAPI application entry point for the PolyU IFC 2026 hackathon demo.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles

from src.config import settings
from src.database import init_db
from src.api.health import router as health_router
from src.api.ingest import router as ingest_router
from src.api.translate import router as translate_router
from src.api.upload import router as upload_router
from src.api.upload_data import router as upload_data_router
from src.api.certification import router as certification_router

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key is None:
        raise HTTPException(status_code=401, detail="X-API-Key header is required")

    if api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")

    return api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Enosis",
    description="Universal Data Translation Layer — HK TSW Phase 3 Edge Agent. Translate commercial trade data to WCO JSON for government submission.",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/badges", StaticFiles(directory="src/badges"), name="badges")
app.mount("/demo", StaticFiles(directory="src/demo", html=True), name="demo")

app.include_router(health_router)
app.include_router(ingest_router, dependencies=[Depends(verify_api_key)])
app.include_router(translate_router, dependencies=[Depends(verify_api_key)])
app.include_router(upload_router, dependencies=[Depends(verify_api_key)])
app.include_router(upload_data_router, dependencies=[Depends(verify_api_key)])
app.include_router(certification_router, dependencies=[Depends(verify_api_key)])


@app.get("/")
async def root():
    return {
        "name": "Enosis",
        "version": settings.app_version,
        "tagline": "The Universal Data Translation Layer — HK TSW Phase 3",
        "docs": "/docs",
        "health": "/health",
    }
