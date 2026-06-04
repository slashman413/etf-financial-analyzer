"""ETF data fetching module — FMP primary, yfinance fallback, in-memory TTL cache."""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any

import httpx
import yfinance as yf

from app.core.config import settings

# ── In-memory TTL cache ────────────────────────────────────

TTL = settings.CACHE_TTL_SEC


@dataclass
class TTLCache:
    _store: dict[str, tuple[float, Any]] = field(default_factory=dict)

    def get(self, key: str) -> Any | None:
        exp, val = self._store.get(key, (0, None))
        return val if time.time() < exp else None

    def set(self, key: str, val: Any, ttl: int = TTL) -> None:
        self._store[key] = (time.time() + ttl, val)

    def invalidate(self, key: str) -> None:
        self._store.pop(key, None)


_cache = TTLCache()

# ── FMP helpers ────────────────────────────────────────────

FMP = "https://financialmodelingprep.com/stable"
_TIMEOUT = httpx.Timeout(20.0)


def _key() -> str:
    return settings.FMP_API_KEY


async def _fmp(path: str, params: dict | None = None) -> list | dict:
    """Fetch from FMP; returns [] on any failure."""
    k = _key()
    if not k:
        return []
    p = {"apikey": k, **(params or {})}
    async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
        try:
            r = await c.get(f"{FMP}/{path}", params=p)
            return r.json() if r.is_success else []
        except Exception:
            return []


def _g(data: list, key: str, idx: int = 0):
    return data[idx].get(key) if data and len(data) > idx else None


# ── Public API ─────────────────────────────────────────────


async def get_etf_holdings(etf_symbol: str, limit: int = 50) -> list[dict]:
    """Fetch ETF top holdings.

    Returns list of {symbol, name, weight_pct, sector}.
    Uses FMP (premium) → yfinance fallback.  Cached by ticker.
    """
    sym = etf_symbol.upper()
    cached = _cache.get(f"holdings:{sym}")
    if cached:
        return cached[:limit]

    holdings = await _fmp_holdings(sym) or await _yf_holdings(sym)
    if holdings is None:
        return []

    _cache.set(f"holdings:{sym}", holdings)
    return holdings[:limit]


async def get_stock_financials(ticker: str, period: str = "quarter") -> dict:
    """Fetch key financial ratios for a single stock.

    Returns dict with keys: pe, pb, roe, debtToEquity, revenueGrowth, marketCap.
    FMP preferred → yfinance fallback.  Cached by ticker.
    """
    sym = ticker.upper()
    cache_key = f"fin:{sym}"
    cached = _cache.get(cache_key)
    if cached:
        return dict(cached)

    result = await _fmp_financials(sym) or await _yf_financials(sym)
    _cache.set(cache_key, result)
    return result


async def batch_get_financials(tickers: list[str]) -> dict[str, dict]:
    """Concurrent batch fetch of financials for multiple tickers.

    Returns dict mapping ticker → {pe, pb, roe, …}.
    """
    coros = [get_stock_financials(t) for t in tickers]
    results = await asyncio.gather(*coros, return_exceptions=True)
    return {
        t: (r if isinstance(r, dict) else {})
        for t, r in zip(tickers, results)
    }


# ── FMP implementations ────────────────────────────────────


async def _fmp_holdings(symbol: str) -> list[dict] | None:
    data = await _fmp("etf/holdings", {"symbol": symbol})
    if not isinstance(data, list) or not data:
        return None
    return [
        {
            "symbol": _get(h, "symbol", ""),
            "name": _get(h, "name", ""),
            "weight_pct": float(_get(h, "weightPercentage", 0) or 0) * 100,
            "sector": _get(h, "sector", ""),
        }
        for h in data
        if h.get("symbol")
    ]


async def _fmp_financials(symbol: str) -> dict | None:
    # key-metrics-ttm for marketCap, ROE
    km = await _fmp("key-metrics-ttm", {"symbol": symbol})
    if not isinstance(km, list) or not km:
        return None
    mcap = _g(km, "marketCapTTM")
    roe = _g(km, "returnOnEquityTTM")

    # income-statement for revenue, netIncome
    inc = await _fmp("income-statement", {"symbol": symbol, "period": "quarter"})
    ni = _g(inc, "netIncome")
    rev_now = _g(inc, "revenue")
    rev_prev = _g(inc, "revenue", 1)
    rev_growth = (
        round((rev_now - rev_prev) / rev_prev, 4)
        if (rev_now and rev_prev and rev_prev > 0)
        else None
    )

    # balance-sheet-statement for equity, debt
    bs = await _fmp("balance-sheet-statement", {"symbol": symbol, "period": "quarter"})
    eq = _g(bs, "totalStockholdersEquity")
    debt = _g(bs, "totalDebt")

    pe = round(mcap / ni, 2) if (mcap and ni and ni > 0) else None
    pb = round(mcap / eq, 2) if (mcap and eq and eq > 0) else None
    dte = round(debt / eq, 4) if (debt and eq and eq > 0) else None

    fin = {
        "pe": pe,
        "pb": pb,
        "roe": roe,
        "debtToEquity": dte,
        "revenueGrowth": rev_growth,
        "marketCap": mcap,
    }
    # If everything is None, FMP returned empty payload — don't call it a success
    if all(v is None for v in fin.values()):
        return None
    return fin


# ── yfinance fallback ──────────────────────────────────────


async def _yf_holdings(symbol: str) -> list[dict] | None:
    loop = asyncio.get_event_loop()
    try:
        etf = await loop.run_in_executor(None, lambda: yf.Ticker(symbol))
        fd = await loop.run_in_executor(None, lambda: etf.funds_data)
        if fd is None:
            return None
        th = await loop.run_in_executor(None, lambda: fd.top_holdings)
        if th is None or th.empty:
            return None
        return [
            {
                "symbol": str(idx).strip(),
                "name": str(row.get("Name", idx)).strip(),
                "weight_pct": float(row.get("Holding Percent", 0) or 0) * 100,
                "sector": None,
            }
            for idx, row in th.iterrows()
        ]
    except Exception:
        return None


async def _yf_financials(symbol: str) -> dict:
    loop = asyncio.get_event_loop()
    try:
        ticker = await loop.run_in_executor(None, lambda: yf.Ticker(symbol))
        info = await loop.run_in_executor(None, lambda: ticker.info)
        if not info:
            return {}
        return {
            "pe": info.get("trailingPE"),
            "pb": info.get("priceToBook"),
            "roe": info.get("returnOnEquity"),
            "debtToEquity": info.get("debtToEquity"),
            "revenueGrowth": info.get("revenueGrowth"),
            "marketCap": info.get("marketCap"),
        }
    except Exception:
        return {}


# ── helpers ────────────────────────────────────────────────


def _get(d: dict, key: str, default=None):
    return d.get(key, default)
