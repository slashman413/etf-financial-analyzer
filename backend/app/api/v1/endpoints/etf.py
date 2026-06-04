"""ETF API endpoints — holdings, analysis, batch."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.etf_fetcher import (
    get_etf_holdings,
    get_stock_financials,
    batch_get_financials,
)
from app.services.financial_analyzer import (
    calculate_ratios,
    calculate_etf_score,
)
from app.cache import get as cache_get, set as cache_set

router = APIRouter(prefix="/etf", tags=["etf"])


# ── Helpers ────────────────────────────────────────────────


def _symbol_key(symbol: str) -> str:
    return symbol.upper()


async def _fetch_or_cached(key: str, fetcher, ttl: int = 86400):
    """Check cache first, else call fetcher and store result."""
    cached = cache_get(key)
    if cached:
        return cached
    result = await fetcher
    if result:
        cache_set(key, result)
    return result


# ── Endpoints ──────────────────────────────────────────────


@router.get("/{symbol}/holdings")
async def get_holdings(symbol: str, limit: int = 50):
    """Fetch ETF top holdings with live financial ratios.

    Returns enriched holdings: each holding gets PE, PB, ROE, D/E, revenueGrowth.
    """
    sym = _symbol_key(symbol)
    cache_key = f"holdings-enriched:{sym}:{limit}"

    cached = cache_get(cache_key)
    if cached:
        return cached

    holdings = await get_etf_holdings(sym, limit=limit)
    if not holdings:
        raise HTTPException(404, f"No holdings found for {sym}")

    # Enrich each holding with financials
    tickers = [h["symbol"] for h in holdings]
    fin_batch = await batch_get_financials(tickers)

    enriched = []
    for h in holdings:
        fin = fin_batch.get(h["symbol"], {})
        ratios = calculate_ratios(fin)
        enriched.append({**h, "ratios": ratios})

    result = {
        "symbol": sym,
        "totalHoldings": len(enriched),
        "holdings": enriched,
    }

    cache_set(cache_key, result)
    return result


@router.get("/{symbol}/analysis")
async def analyze_etf(symbol: str, limit: int = 50):
    """Full ETF analysis: holdings + financials + scoring.

    Returns sector allocation, enriched holdings, weighted metrics, and
    composite quality/value/growth scores for the ETF.
    """
    sym = _symbol_key(symbol)
    cache_key = f"analysis:{sym}:{limit}"

    cached = cache_get(cache_key)
    if cached:
        return cached

    holdings = await get_etf_holdings(sym, limit=limit)
    if not holdings:
        raise HTTPException(404, f"No holdings found for {sym}")

    # Fetch financials for all holdings
    tickers = [h["symbol"] for h in holdings]
    fin_batch = await batch_get_financials(tickers)

    total_weight = sum(h.get("weight_pct", 0) for h in holdings) or 1.0

    # Build enriched list + sector map + weighted aggregates
    enriched = []
    sector_map: dict[str, float] = {}
    weighted = {"pe": 0.0, "pb": 0.0, "roe": 0.0, "dte": 0.0, "revGrowth": 0.0}
    scoring_input = []

    for h in holdings:
        w = h.get("weight_pct", 0)
        w_norm = w / total_weight
        fin = fin_batch.get(h["symbol"], {})
        ratios = calculate_ratios(fin)

        # Weighted aggregates
        if ratios.get("pe"):
            weighted["pe"] += ratios["pe"] * w_norm
        if ratios.get("pb"):
            weighted["pb"] += ratios["pb"] * w_norm
        if ratios.get("roe"):
            weighted["roe"] += ratios["roe"] * w_norm
        if ratios.get("debtToEquity"):
            weighted["dte"] += ratios["debtToEquity"] * w_norm
        if ratios.get("revenueGrowth"):
            weighted["revGrowth"] += ratios["revenueGrowth"] * w_norm

        # Sector
        sec = h.get("sector") or "Other"
        sector_map[sec] = sector_map.get(sec, 0) + w_norm * 100

        scoring_input.append({"ticker": h["symbol"], "weight": w, "ratios": ratios})
        enriched.append({**h, "ratios": ratios})

    # ETF scoring
    score = calculate_etf_score(scoring_input)

    result = {
        "symbol": sym,
        "totalHoldings": len(enriched),
        "weightedMetrics": {
            "weightedPe": round(weighted["pe"], 2) if weighted["pe"] else None,
            "weightedPb": round(weighted["pb"], 2) if weighted["pb"] else None,
            "weightedRoe": round(weighted["roe"], 4) if weighted["roe"] else None,
            "weightedDte": round(weighted["dte"], 4) if weighted["dte"] else None,
            "weightedRevGrowth": round(weighted["revGrowth"], 4) if weighted["revGrowth"] else None,
        },
        "sectorAllocation": dict(sorted(sector_map.items(), key=lambda x: -x[1])),
        "score": score,
        "holdings": enriched,
    }

    cache_set(cache_key, result)
    return result


@router.post("/batch-analysis")
async def batch_analysis(payload: dict):
    """Batch analysis of multiple ETFs.

    **Request body:**
      { "symbols": ["SPY", "QQQ", "VTI"] }

    **Returns** list of analysis summaries (symbol + weightedMetrics + score).
    """
    symbols = payload.get("symbols", [])
    if not symbols or not isinstance(symbols, list):
        raise HTTPException(400, "Provide a non-empty 'symbols' array")
    if len(symbols) > 20:
        raise HTTPException(400, "Max 20 symbols per batch request")

    results = []
    errors = []

    for sym in symbols[:20]:
        sym_u = _symbol_key(sym)
        cache_key = f"analysis:{sym_u}:50"
        cached = cache_get(cache_key)
        if cached:
            results.append({"symbol": sym_u, "status": "cached", **cached})
            continue

        try:
            holdings = await get_etf_holdings(sym_u, limit=50)
            if not holdings:
                errors.append({"symbol": sym_u, "error": "No holdings found"})
                continue

            tickers = [h["symbol"] for h in holdings]
            fin_batch = await batch_get_financials(tickers)
            total_w = sum(h.get("weight_pct", 0) for h in holdings) or 1.0

            weighted = {"pe": 0.0, "pb": 0.0, "roe": 0.0, "dte": 0.0, "revGrowth": 0.0}
            scoring = []

            for h in holdings:
                w = h.get("weight_pct", 0) / total_w
                rat = calculate_ratios(fin_batch.get(h["symbol"], {}))
                scoring.append({"ticker": h["symbol"], "weight": h.get("weight_pct", 0), "ratios": rat})
                if rat.get("pe"):        weighted["pe"]        += rat["pe"] * w
                if rat.get("pb"):        weighted["pb"]        += rat["pb"] * w
                if rat.get("roe"):       weighted["roe"]       += rat["roe"] * w
                if rat.get("debtToEquity"): weighted["dte"]    += rat["debtToEquity"] * w
                if rat.get("revenueGrowth"): weighted["revGrowth"] += rat["revenueGrowth"] * w

            score = calculate_etf_score(scoring)
            summary = {
                "symbol": sym_u,
                "status": "fresh",
                "weightedMetrics": {
                    "weightedPe": round(weighted["pe"], 2) if weighted["pe"] else None,
                    "weightedPb": round(weighted["pb"], 2) if weighted["pb"] else None,
                    "weightedRoe": round(weighted["roe"], 4) if weighted["roe"] else None,
                    "weightedDte": round(weighted["dte"], 4) if weighted["dte"] else None,
                    "weightedRevGrowth": round(weighted["revGrowth"], 4) if weighted["revGrowth"] else None,
                },
                "score": score,
                "totalHoldings": len(holdings),
            }

            cache_set(f"analysis:{sym_u}:50", summary)
            results.append(summary)

        except Exception as e:
            errors.append({"symbol": sym_u, "error": str(e)[:100]})

    return {"results": results, "errors": errors}
