"""ETF Financial Analyzer — FastAPI application."""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.cache import _load as load_cache  # noqa
from app.routes import router as etf_router
from app.api.v1.endpoints.etf import router as etf_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: ensure directories on startup."""
    settings.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="ETF Financial Analyzer",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
)

# ── Middleware ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────
app.include_router(etf_router, prefix="/api/etf")
app.include_router(etf_v1_router, prefix="/api/v1")


# ── Health ─────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}
