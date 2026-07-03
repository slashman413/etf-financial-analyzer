from fastapi import APIRouter, HTTPException
from app.fetcher import get_holdings, get_sector_weights, search_etfs
from app.models import ETFAggregate, HoldingWithRatios, FinancialRatios
from app.services.financial_analyzer import calculate_ratios
from app.cache import get as cache_get, set as cache_set
from datetime import datetime, timezone

router = APIRouter()

PREFETCH_TICKERS = ["SPY", "QQQ", "VTI", "VOO", "0050.TW", "0056.TW"]

def _score_holding(r: dict) -> float:
    """0-10 score from financial ratios. Matches _generate_insights logic."""
    s = 5  # baseline
    if r.get("pe"):
        s += 1 if r["pe"] < 25 else -1 if r["pe"] > 40 else 1
    if r.get("roe"):
        s += 2 if r["roe"] > 0.2 else 1 if r["roe"] > 0.1 else -1
    if r.get("revenueGrowth"):
        s += 2 if r["revenueGrowth"] > 0.15 else 1 if r["revenueGrowth"] > 0 else -2
    if r.get("debtToEquity"):
        s += 1 if r["debtToEquity"] < 1.5 else -1 if r["debtToEquity"] > 3 else 0
    return round(max(0, min(10, s)), 1)

async def _compute_aggregate(ticker: str) -> ETFAggregate | None:
    """Core logic — fetches holdings, enriches with ratios, returns aggregate."""
    holdings = await get_holdings(ticker)
    if not holdings: return None

    tickers = [h["symbol"] for h in holdings]

    # Concurrent batch fetch financials
    from app.services.etf_fetcher import batch_get_financials
    fin_batch = await batch_get_financials(tickers)

    weighted = {"pe": 0.0, "pb": 0.0, "roe": 0.0, "dte": 0.0, "rev": 0.0}
    total_w = sum(h["weight"] for h in holdings) or 1.0

    enriched: list[HoldingWithRatios] = []
    for h in holdings:
        r = calculate_ratios(fin_batch.get(h["symbol"], {}))
        hr = FinancialRatios(**r)
        w = h["weight"] / total_w
        if hr.pe: weighted["pe"] += hr.pe * w
        if hr.pb: weighted["pb"] += hr.pb * w
        if hr.roe: weighted["roe"] += hr.roe * w
        if hr.debtToEquity: weighted["dte"] += hr.debtToEquity * w
        if hr.revenueGrowth: weighted["rev"] += hr.revenueGrowth * w
        enriched.append(HoldingWithRatios(symbol=h["symbol"], name=h["name"], weight=h["weight"], sector=h.get("sector"), ratios=hr, score=_score_holding(r)))

    sector_allocation = await get_sector_weights(ticker)

    return ETFAggregate(
        symbol=ticker,
        name=ticker,
        weightedPe=round(weighted["pe"], 2) if weighted["pe"] else None,
        weightedPb=round(weighted["pb"], 2) if weighted["pb"] else None,
        weightedRoe=round(weighted["roe"], 4) if weighted["roe"] else None,
        weightedDte=round(weighted["dte"], 4) if weighted["dte"] else None,
        weightedRevGrowth=round(weighted["rev"], 4) if weighted["rev"] else None,
        sectorAllocation=sector_allocation,
        topHoldings=enriched,
        updatedAt=datetime.now(timezone.utc).isoformat(),
    )

@router.get("/search")
async def search(q: str = ""):
    if not q: return []
    return await search_etfs(q)


@router.get("/autocomplete")
async def autocomplete(q: str = ""):
    """Prefix autocomplete for ETF symbols/names. Returns up to 8 matches."""
    if not q or len(q) < 1:
        return []
    import yfinance as yf, asyncio
    loop = asyncio.get_event_loop()
    try:
        s = await loop.run_in_executor(None, lambda: yf.Search(q, max_results=8))
        quotes = s.quotes or []
        return [
            {"symbol": q_.get("symbol", "").upper(), "name": q_.get("shortname") or q_.get("longname", "")}
            for q_ in quotes if q_.get("typeDisp") == "ETF" and q_.get("symbol")
        ]
    except Exception:
        return []


@router.get("/{symbol}/detail")
async def stock_detail(symbol: str):
    """Detailed financial analysis for a single stock — ratios, income trend, market data."""
    sym = symbol.upper()
    from app.services.etf_fetcher import get_stock_financials
    from app.services.financial_analyzer import calculate_ratios, analyze_trend

    fin = await get_stock_financials(sym)
    ratios = calculate_ratios(fin)

    # Fetch quarterly income statements for trend analysis
    import httpx
    from app.core.config import settings
    api_key = settings.FMP_API_KEY
    trend_reports = []
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.get(
                    f"https://financialmodelingprep.com/stable/income-statement",
                    params={"symbol": sym, "period": "quarter", "apikey": api_key},
                )
                if r.is_success:
                    statements = r.json()
                    if isinstance(statements, list):
                        trend_reports = [
                            {
                                "date": s.get("date", ""),
                                "revenue": s.get("revenue"),
                                "netIncome": s.get("netIncome"),
                                "eps": s.get("eps"),
                            }
                            for s in statements[:8]  # last 8 quarters
                        ]
        except Exception:
            pass

    # FMP returns statements newest-first; analyze_trend expects oldest-first.
    trend = analyze_trend(list(reversed(trend_reports)))

    # Sentiment / insight text
    insights = _generate_insights(ratios, trend)

    return {
        "symbol": sym,
        "name": fin.get("shortName") or sym,
        "ratios": ratios,
        "trend": trend,
        "incomeTrend": trend_reports,
        "marketCap": fin.get("marketCap"),
        "insights": insights,
    }


def _generate_insights(r: dict, t: dict) -> dict:
    """Generate human-readable text insights from ratios and trend."""
    notes = []
    score = 0

    if r.get("pe") and r["pe"] < 15:
        notes.append("本益比偏低，可能被低估"); score += 1
    elif r.get("pe") and r["pe"] > 40:
        notes.append("本益比偏高，市場預期高成長"); score -= 1
    else:
        notes.append("本益比在合理範圍"); score += 1

    if r.get("roe") and r["roe"] > 0.2:
        notes.append(f"ROE {(r['roe']*100):.1f}%，盈利能力優異"); score += 2
    elif r.get("roe") and r["roe"] > 0.1:
        notes.append(f"ROE {(r['roe']*100):.1f}%，盈利能力穩健"); score += 1
    elif r.get("roe") is not None:
        notes.append(f"ROE {(r['roe']*100):.1f}%，盈利能力待改善"); score -= 1

    if r.get("revenueGrowth") and r["revenueGrowth"] > 0.15:
        notes.append(f"營收成長 {(r['revenueGrowth']*100):.1f}%，強勁增長"); score += 2
    elif r.get("revenueGrowth") and r["revenueGrowth"] > 0:
        notes.append(f"營收成長 {(r['revenueGrowth']*100):.1f}%，溫和增長"); score += 1
    elif r.get("revenueGrowth") is not None:
        notes.append(f"營收衰退 {(r['revenueGrowth']*100):.1f}%，需關注"); score -= 2

    if r.get("debtToEquity") and r["debtToEquity"] < 1:
        notes.append("負債比低，財務結構穩健"); score += 1
    elif r.get("debtToEquity") and r["debtToEquity"] > 3:
        notes.append("負債比偏高，注意償債風險"); score -= 1

    trend_dir = t.get("revenueTrend", "stable")
    if trend_dir == "growing":    notes.append("營收呈成長趨勢"); score += 1
    elif trend_dir == "declining": notes.append("營收呈衰退趨勢"); score -= 2

    return {
        "summary": "整體基本面優良" if score >= 4 else "整體基本面穩健" if score >= 0 else "整體基本面偏弱",
        "score": max(-5, min(10, score + 5)),  # normalize 0-10
        "notes": notes,
    }

@router.get("/{ticker}/aggregate")
async def aggregate(ticker: str, force: bool = False):
    ticker = ticker.upper()

    # Cache hit (unless force refresh)
    if not force:
        cached = cache_get(ticker)
        if cached: return cached

    result = await _compute_aggregate(ticker)
    if not result:
        raise HTTPException(404, f"No holdings found for {ticker}")

    cache_set(ticker, result.model_dump())
    return result

@router.post("/cache/prefetch")
async def prefetch():
    """Warm cache for all default ETFs. Returns list of tickers cached."""
    cached = []
    for t in PREFETCH_TICKERS:
        existing = cache_get(t)
        if existing:
            cached.append({"ticker": t, "source": "cache"})
            continue
        try:
            result = await _compute_aggregate(t)
            if result:
                cache_set(t, result.model_dump())
                cached.append({"ticker": t, "source": "fresh"})
            else:
                cached.append({"ticker": t, "source": "failed"})
        except Exception as e:
            cached.append({"ticker": t, "source": f"error: {str(e)[:50]}"})
    return {"results": cached}

@router.get("/cache/status")
async def cache_status():
    """Return cache status for all default tickers."""
    from app.cache import _load as load_cache
    c = load_cache()
    return {t: (t.upper() in c) for t in PREFETCH_TICKERS}
