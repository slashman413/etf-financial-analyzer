"""Financial ratio calculator & ETF scoring engine."""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


# ── Data models ────────────────────────────────────────────


@dataclass
class FinancialRatios:
    pe: float | None = None
    pb: float | None = None
    ps: float | None = None
    pcf: float | None = None
    roe: float | None = None
    roa: float | None = None
    roic: float | None = None
    grossMargin: float | None = None
    operatingMargin: float | None = None
    netMargin: float | None = None
    currentRatio: float | None = None
    debtToEquity: float | None = None
    debtToAssets: float | None = None
    freeCashFlowMargin: float | None = None
    revenueGrowth: float | None = None
    netIncomeGrowth: float | None = None
    epsGrowth: float | None = None
    marketCap: float | None = None
    dividendYield: float | None = None
    payoutRatio: float | None = None


@dataclass
class TrendAnalysis:
    revenueTrend: str = "stable"       # growing / stable / declining
    netIncomeTrend: str = "stable"
    marginTrend: str = "stable"
    roeTrend: str = "stable"
    volatility: float = 0.0
    consistencyScore: float = 0.0      # 0-1
    periods: int = 0


@dataclass
class HoldingScore:
    ticker: str = ""
    qualityScore: float = 0.0          # 0-10
    valueScore: float = 0.0            # 0-10
    growthScore: float = 0.0           # 0-10
    compositeScore: float = 0.0        # 0-10


@dataclass
class ETFScore:
    weightedComposite: float = 0.0
    avgQuality: float = 0.0
    avgValue: float = 0.0
    avgGrowth: float = 0.0
    diversificationScore: float = 0.0  # 0-10
    topConcentration: float = 0.0      # % held in top 3
    holdingsScores: list[HoldingScore] = field(default_factory=list)


# ── Ratio calculator ───────────────────────────────────────


def calculate_ratios(financial_data: dict) -> dict:
    """Compute standard financial ratios from raw data.

    **Input fields accepted (all optional):**
      marketCap, netIncome, revenue, operatingIncome, grossProfit,
      totalAssets, totalEquity, totalDebt, freeCashFlow, eps,
      totalShares, dividendsPerShare, previousRevenue, previousNetIncome,
      previousEps, cashAndEquivalents, currentLiabilities

    **Returns dict (FinancialRatios):**
      {
        "pe": 25.3, "pb": 4.1, "ps": 3.2, "pcf": 18.5,
        "roe": 0.224, "roa": 0.089, "roic": 0.156,
        "grossMargin": 0.48, "operatingMargin": 0.29, "netMargin": 0.24,
        "currentRatio": 1.52, "debtToEquity": 0.68, "debtToAssets": 0.24,
        "freeCashFlowMargin": 0.18,
        "revenueGrowth": 0.12, "netIncomeGrowth": 0.08, "epsGrowth": 0.15,
        "marketCap": 2600000000000,
        "dividendYield": 0.0052, "payoutRatio": 0.15
      }
    """
    f = FinancialRatios()
    d = financial_data or {}

    # ── Valuation ──
    mcap = d.get("marketCap") or d.get("market_cap")
    ni = d.get("netIncome")
    rev = d.get("revenue")
    op_inc = d.get("operatingIncome")
    gp = d.get("grossProfit")
    fcf = d.get("freeCashFlow") or d.get("freeCashFlowTTM")
    eps = d.get("eps")
    shares = d.get("totalShares") or d.get("sharesOutstanding")
    div_per = d.get("dividendsPerShare")
    price = d.get("price") or (mcap / shares if mcap and shares else None)

    # PE
    if mcap and ni and ni != 0:
        f.pe = safe_round(mcap / ni, 2)
    # PB
    eq = d.get("totalEquity")
    if mcap and eq and eq != 0:
        f.pb = safe_round(mcap / eq, 2)
    # PS
    if mcap and rev and rev != 0:
        f.ps = safe_round(mcap / rev, 2)
    # PCF
    if mcap and fcf and fcf != 0:
        f.pcf = safe_round(mcap / fcf, 2)

    # ── Profitability ──
    eq = d.get("totalEquity") or d.get("totalStockholdersEquity")
    assets = d.get("totalAssets")
    if ni is not None and eq and eq != 0:
        f.roe = safe_round(ni / eq, 4)
    if ni is not None and assets and assets != 0:
        f.roa = safe_round(ni / assets, 4)

    # ROIC approx: NOPAT / (debt + equity)
    debt = d.get("totalDebt")
    ic = (debt or 0) + (eq or 0)
    nopat = ni or 0
    if ic != 0:
        f.roic = safe_round(nopat / ic, 4)

    # Margins
    if gp is not None and rev and rev != 0:
        f.grossMargin = safe_round(gp / rev, 4)
    if op_inc is not None and rev and rev != 0:
        f.operatingMargin = safe_round(op_inc / rev, 4)
    if ni is not None and rev and rev != 0:
        f.netMargin = safe_round(ni / rev, 4)
    if fcf is not None and rev and rev != 0:
        f.freeCashFlowMargin = safe_round(fcf / rev, 4)

    # ── Liquidity / Solvency ──
    cash = d.get("cashAndEquivalents")
    cl = d.get("currentLiabilities")
    if cash is not None and cl and cl != 0:
        f.currentRatio = safe_round(cash / cl, 2)
    if debt is not None and eq and eq != 0:
        f.debtToEquity = safe_round(debt / eq, 2)
    if debt is not None and assets and assets != 0:
        f.debtToAssets = safe_round(debt / assets, 4)

    # ── Growth ──
    rev_prev = d.get("previousRevenue") or d.get("revenuePrevious")
    ni_prev = d.get("previousNetIncome")
    eps_prev = d.get("previousEps")
    if rev is not None and rev_prev and rev_prev != 0:
        f.revenueGrowth = safe_round((rev - rev_prev) / rev_prev, 4)
    if ni is not None and ni_prev and ni_prev != 0:
        f.netIncomeGrowth = safe_round((ni - ni_prev) / ni_prev, 4)
    if eps is not None and eps_prev and eps_prev != 0:
        f.epsGrowth = safe_round((eps - eps_prev) / eps_prev, 4)

    # ── Dividends ──
    f.marketCap = mcap
    if div_per is not None and price and price != 0:
        f.dividendYield = safe_round(div_per / price, 6)
    if div_per is not None and eps and eps != 0:
        f.payoutRatio = safe_round(div_per / eps, 4)

    # ── Pass-through pre-computed ratios from data sources ──
    _passthrough = {
        "pe": ("pe", "trailingPE"),
        "pb": ("pb", "priceToBook"),
        "ps": ("ps", "priceToSales"),
        "pcf": ("pcf", "priceToCashFlow"),
        "roe": ("roe", "returnOnEquity"),
        "roa": ("roa", "returnOnAssets"),
        "debtToEquity": ("debtToEquity",),
        "revenueGrowth": ("revenueGrowth",),
        "dividendYield": ("dividendYield",),
        "payoutRatio": ("payoutRatio",),
        "grossMargin": ("grossMargin", "grossMargins"),
        "operatingMargin": ("operatingMargin", "operatingMargins"),
        "currentRatio": ("currentRatio", "currentRatio"),
    }
    for attr, keys in _passthrough.items():
        if getattr(f, attr) is None:
            for k in keys:
                v = d.get(k)
                if v is not None:
                    setattr(f, attr, safe_round(v, 4) if isinstance(v, (int, float)) else v)
                    break

    return {k: v for k, v in asdict(f).items() if v is not None}


# ── Trend analyzer ─────────────────────────────────────────


def analyze_trend(historical_data: list) -> dict:
    """Analyze financial trends over time.

    **Input:** list of dicts, each with the same keys as financial_data,
    ordered chronologically (oldest first).

    **Returns dict (TrendAnalysis):**
      {
        "revenueTrend": "growing",
        "netIncomeTrend": "growing",
        "marginTrend": "stable",
        "roeTrend": "growing",
        "volatility": 0.082,
        "consistencyScore": 0.78,
        "periods": 8
      }
    """
    t = TrendAnalysis()
    if not historical_data or len(historical_data) < 2:
        return asdict(t)

    # Compute ratios for each period
    periods = [calculate_ratios(p) for p in historical_data]
    t.periods = len(periods)

    # Extract key series. Revenue and net income are raw inputs (calculate_ratios
    # does not emit them), so read them from historical_data, not the ratios dict.
    revenues = [_v(p, "revenue") for p in historical_data]
    net_incomes = [_v(p, "netIncome") for p in historical_data]
    margins = [_v(p, "netMargin") for p in periods]
    roes = [_v(p, "roe") for p in periods]

    # Trend direction (linear regression slope sign)
    t.revenueTrend = _trend_label(revenues)
    t.netIncomeTrend = _trend_label(net_incomes)
    t.marginTrend = _trend_label(margins)
    t.roeTrend = _trend_label(roes)

    # Revenue volatility (coefficient of variation)
    clean = [v for v in revenues if v and v > 0]
    if len(clean) > 1:
        mean = sum(clean) / len(clean)
        var = sum((x - mean) ** 2 for x in clean) / len(clean)
        t.volatility = safe_round((var ** 0.5) / mean, 4)

    # Consistency score: how often did key metrics move in a "good" direction
    # Good = revenue up, net income up, margins stable or up, ROE up
    good_moves = 0
    total_moves = 0
    for i in range(1, len(periods)):
        r = periods[i]
        r_prev = periods[i - 1]
        if _v(r, "revenueGrowth") and _v(r_prev, "revenueGrowth"):
            total_moves += 1
            if _v(r, "revenueGrowth") >= _v(r_prev, "revenueGrowth"):
                good_moves += 1
        if _v(r, "netMargin") and _v(r_prev, "netMargin"):
            total_moves += 1
            if _v(r, "netMargin") >= _v(r_prev, "netMargin"):
                good_moves += 1
        if _v(r, "roe") and _v(r_prev, "roe"):
            total_moves += 1
            if _v(r, "roe") >= _v(r_prev, "roe"):
                good_moves += 1

    t.consistencyScore = safe_round(
        good_moves / total_moves, 2
    ) if total_moves > 0 else 0.0

    return asdict(t)


# ── ETF scoring engine ─────────────────────────────────────


def calculate_etf_score(holdings_analysis: list) -> dict:
    """Score an ETF based on its holdings' financial health.

    **Input:** list of dicts, each containing:
      {
        "ticker": "AAPL",
        "weight": 7.5,
        "ratios": { "pe": 30, "roe": 0.35, "revenueGrowth": 0.08, ... }
      }

    **Returns dict (ETFScore):**
      {
        "weightedComposite": 6.42,
        "avgQuality": 7.1,
        "avgValue": 5.2,
        "avgGrowth": 6.9,
        "diversificationScore": 8.5,
        "topConcentration": 22.3,
        "holdingsScores": [
          {
            "ticker": "AAPL",
            "qualityScore": 8.2,
            "valueScore": 4.5,
            "growthScore": 6.8,
            "compositeScore": 6.5
          },
          ...
        ]
      }
    """
    if not holdings_analysis:
        return asdict(ETFScore())

    scores: list[HoldingScore] = []
    total_w = sum(h.get("weight", 0) for h in holdings_analysis) or 1.0

    for h in holdings_analysis:
        r = h.get("ratios", {}) or {}
        w = h.get("weight", 0) / total_w

        # ── Quality (profitability + efficiency, 0-10) ──
        roe = _v(r, "roe") or 0
        roa = _v(r, "roa") or 0
        nm = _v(r, "netMargin") or 0
        de = _v(r, "debtToEquity") or 2.0  # lower is better
        fcfm = _v(r, "freeCashFlowMargin") or 0

        q_score = (
            _norm(roe, 0, 0.4) * 3
            + _norm(roa, 0, 0.15) * 2
            + _norm(nm, 0, 0.3) * 2
            + _norm_inv(de, 0, 3) * 2
            + _norm(fcfm, 0, 0.25) * 1
        )
        quality = safe_round(min(q_score, 10), 1)

        # ── Value (0-10; lower PE/PB/PS is better) ──
        pe = _v(r, "pe") or 25
        pb = _v(r, "pb") or 3
        ps = _v(r, "ps") or 4
        pcf = _v(r, "pcf") or 15

        v_score = (
            _norm_inv(pe, 5, 50) * 3
            + _norm_inv(pb, 0.5, 10) * 2.5
            + _norm_inv(ps, 0.5, 10) * 2
            + _norm_inv(pcf, 5, 30) * 2.5
        )
        value = safe_round(min(v_score, 10), 1)

        # ── Growth (0-10) ──
        rev_g = _v(r, "revenueGrowth") or 0
        ni_g = _v(r, "netIncomeGrowth") or 0
        eps_g = _v(r, "epsGrowth") or 0

        g_score = (
            _norm(rev_g, -0.1, 0.3) * 4
            + _norm(ni_g, -0.2, 0.5) * 3
            + _norm(eps_g, -0.2, 0.4) * 3
        )
        growth = safe_round(min(g_score, 10), 1)

        # ── Composite ──
        composite = safe_round(
            quality * 0.4 + value * 0.25 + growth * 0.35, 1
        )

        scores.append(HoldingScore(
            ticker=h.get("ticker", ""),
            qualityScore=quality,
            valueScore=value,
            growthScore=growth,
            compositeScore=composite,
        ))

    # ── ETF-level aggregates ──
    weighted = sum(
        s.compositeScore * (h.get("weight", 0) / total_w)
        for s, h in zip(scores, holdings_analysis)
    )
    avg_q = sum(s.qualityScore * (h.get("weight", 0) / total_w)
                for s, h in zip(scores, holdings_analysis))
    avg_v = sum(s.valueScore * (h.get("weight", 0) / total_w)
                for s, h in zip(scores, holdings_analysis))
    avg_g = sum(s.growthScore * (h.get("weight", 0) / total_w)
                for s, h in zip(scores, holdings_analysis))

    # Diversification: Herfindahl index inverted
    weights = [h.get("weight", 0) / total_w for h in holdings_analysis]
    hhi = sum(w ** 2 for w in weights)
    div_score = safe_round(10 * (1 - min(hhi, 1)), 1)

    # Top 3 concentration
    sorted_w = sorted(weights, reverse=True)
    top3 = sum(sorted_w[:3]) * 100

    result = ETFScore(
        weightedComposite=safe_round(weighted, 2),
        avgQuality=safe_round(avg_q, 1),
        avgValue=safe_round(avg_v, 1),
        avgGrowth=safe_round(avg_g, 1),
        diversificationScore=div_score,
        topConcentration=safe_round(top3, 1),
        holdingsScores=scores,
    )

    return asdict(result)


# ── Helpers ────────────────────────────────────────────────


def safe_round(v: float, n: int = 4) -> float:
    return round(v, n)


def _v(d: dict, key: str, fallback: Any = None) -> Any:
    return d.get(key, fallback)


def _norm(x: float, lo: float, hi: float) -> float:
    """Normalise x to 0-1 within [lo, hi] range, capped."""
    if hi <= lo:
        return 1.0
    return max(0.0, min(1.0, (x - lo) / (hi - lo)))


def _norm_inv(x: float, lo: float, hi: float) -> float:
    """Inverse normalise: lower x → higher score."""
    return 1.0 - _norm(x, lo, hi)


def _trend_label(values: list[float | None]) -> str:
    """Classify trend as growing / stable / declining via slope sign."""
    clean = [(i, v) for i, v in enumerate(values) if v is not None]
    if len(clean) < 3:
        return "stable"

    n = len(clean)
    xs = [p[0] for p in clean]
    ys = [p[1] for p in clean]
    x_bar = sum(xs) / n
    y_bar = sum(ys) / n

    num = sum((x - x_bar) * (y - y_bar) for x, y in zip(xs, ys))
    den = sum((x - x_bar) ** 2 for x in xs)
    slope = num / den if den != 0 else 0.0

    # Scale slope by mean for relative comparison
    rel = slope / y_bar if y_bar != 0 else 0.0
    if rel > 0.03:
        return "growing"
    if rel < -0.03:
        return "declining"
    return "stable"
