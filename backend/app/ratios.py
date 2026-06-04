import os, asyncio, httpx
from typing import Optional

FMP = "https://financialmodelingprep.com/stable"

def _key():
    return os.environ.get("FMP_API_KEY") or os.getenv("FMP_API_KEY", "")

async def get_ratios(symbol: str) -> dict:
    """Fetch ratios: try FMP first, fallback to yfinance"""
    key = _key()
    if key:
        r = await _try_fmp(symbol, key)
        if r: return r
    return await _try_yfinance(symbol)

async def _try_fmp(symbol: str, key: str) -> Optional[dict]:
    async with httpx.AsyncClient(timeout=20) as c:
        km = await _fetch(c, f"{FMP}/key-metrics-ttm", {"symbol": symbol, "apikey": key})
        if not km: return None
        mcap = _g(km, "marketCap")
        roe = _g(km, "returnOnEquityTTM")
        inc = await _fetch(c, f"{FMP}/income-statement", {"symbol": symbol, "apikey": key})
        ni = _g(inc, "netIncome") if inc else None
        rev_now = _g(inc, "revenue") if inc else None
        rev_prev = _g(inc, "revenue", 1) if inc and len(inc) > 1 else None
        rev_growth = round((rev_now - rev_prev) / rev_prev, 4) if (rev_now and rev_prev and rev_prev > 0) else None
        bs = await _fetch(c, f"{FMP}/balance-sheet-statement", {"symbol": symbol, "apikey": key})
        eq = _g(bs, "totalStockholdersEquity") if bs else None
        debt = _g(bs, "totalDebt") if bs else None
        pe = round(mcap / ni, 2) if (mcap and ni and ni > 0) else None
        pb = round(mcap / eq, 2) if (mcap and eq and eq > 0) else None
        dte = round(debt / eq, 4) if (debt and eq and eq > 0) else None
        return {"pe": pe, "pb": pb, "roe": roe, "debtToEquity": dte, "revenueGrowth": rev_growth, "marketCap": mcap}
    return None

async def _try_yfinance(symbol: str) -> dict:
    loop = asyncio.get_event_loop()
    try:
        import yfinance as yf
        ticker = await loop.run_in_executor(None, lambda: yf.Ticker(symbol))
        info = await loop.run_in_executor(None, lambda: ticker.info)
        if not info: return {}
        return {
            "pe": info.get("trailingPE"),
            "pb": info.get("priceToBook"),
            "roe": info.get("returnOnEquity"),
            "debtToEquity": info.get("debtToEquity"),
            "revenueGrowth": info.get("revenueGrowth"),
            "marketCap": info.get("marketCap"),
        }
    except:
        return {}

async def _fetch(c: httpx.AsyncClient, url: str, params: dict):
    r = await c.get(url, params=params)
    return r.json() if r.status_code == 200 else []

def _g(data: list, key: str, idx: int = 0):
    return data[idx].get(key) if data and len(data) > idx else None
