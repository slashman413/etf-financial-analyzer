"""ETF data fetching — delegates to services/etf_fetcher.py (FMP primary, yfinance fallback)."""
from __future__ import annotations

from app.services.etf_fetcher import (
    get_etf_holdings as _get_etf_holdings,
    get_stock_financials as _get_stock_financials,
)
from app.services.financial_analyzer import calculate_ratios


async def get_holdings(ticker: str) -> list[dict] | None:
    """Fetch ALL ETF holdings via FMP → yfinance fallback."""
    rows = await _get_etf_holdings(ticker, limit=5000)  # no limit = all
    if not rows:
        return None
    # Map to the schema old routes.py expects
    return [
        {
            "symbol": r["symbol"],
            "name": r.get("name", ""),
            "weight": r.get("weight_pct", 0),
            "sector": r.get("sector"),
        }
        for r in rows
    ]


async def get_ratios(ticker: str) -> dict:
    """Fetch financial ratios for a single stock via FMP → yfinance."""
    fin = await _get_stock_financials(ticker)
    return calculate_ratios(fin) or {}


async def get_sector_weights(ticker: str) -> dict[str, float]:
    """Fetch ETF sector allocation via yfinance."""
    import asyncio
    import yfinance as yf

    loop = asyncio.get_event_loop()
    try:
        etf = await loop.run_in_executor(None, lambda: yf.Ticker(ticker))
        fd = await loop.run_in_executor(None, lambda: etf.funds_data)
        if fd is None:
            return {}
        sw = await loop.run_in_executor(None, lambda: fd.sector_weightings)
        if not sw:
            return {}
        return {k.replace("_", " ").title(): round(v * 100, 2) for k, v in sw.items()}
    except Exception:
        return {}


async def search_etfs(q: str) -> list[dict]:
    """Search ETFs via yfinance."""
    import yfinance as yf

    loop = __import__("asyncio").get_event_loop()
    try:
        info = await loop.run_in_executor(None, lambda: yf.Ticker(q).info)
        if info and info.get("quoteType") == "ETF":
            return [{"symbol": info.get("symbol", q).upper(), "name": info.get("shortName") or info.get("longName", q)}]
    except Exception:
        pass
    return []
