"""App configuration via pydantic-settings."""
from __future__ import annotations

from pathlib import Path
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── API keys ────────────────────────────────────────────
    FMP_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # ── Server ──────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["*"]
    DEBUG: bool = False

    # ── Paths ───────────────────────────────────────────────
    PROJECT_ROOT: ClassVar[Path] = Path(__file__).resolve().parent.parent.parent
    CACHE_DIR: Path = PROJECT_ROOT / "cache"

    # ── Cache ───────────────────────────────────────────────
    CACHE_TTL_SEC: int = 86400 * 28  # ~monthly

    @property
    def cors_origins_list(self) -> list[str]:
        return self.CORS_ORIGINS or ["*"]


settings = Settings()  # singleton
