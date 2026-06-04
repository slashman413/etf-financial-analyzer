from pydantic import BaseModel
from typing import Optional

class FinancialRatios(BaseModel):
    pe: Optional[float] = None
    pb: Optional[float] = None
    roe: Optional[float] = None
    debtToEquity: Optional[float] = None
    revenueGrowth: Optional[float] = None
    marketCap: Optional[float] = None

class HoldingWithRatios(BaseModel):
    symbol: str
    name: str
    weight: float
    sector: str | None = None
    ratios: FinancialRatios
    score: float | None = None  # 0-10 composite fundamental score

class ETFAggregate(BaseModel):
    symbol: str
    name: str
    weightedPe: Optional[float] = None
    weightedPb: Optional[float] = None
    weightedRoe: Optional[float] = None
    weightedDte: Optional[float] = None
    weightedRevGrowth: Optional[float] = None
    sectorAllocation: dict[str, float] = {}
    topHoldings: list[HoldingWithRatios] = []
    updatedAt: str = ""
