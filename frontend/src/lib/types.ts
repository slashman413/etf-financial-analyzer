export type ETFInfo = {
  symbol: string;
  name: string;
  holdings?: Holding[];
  updatedAt?: string;
};

export type Holding = {
  symbol: string;
  name: string;
  weight: number; // 0-100
  sector?: string;
};

export type FinancialRatios = {
  pe: number | null;
  pb: number | null;
  roe: number | null;
  debtToEquity: number | null;
  revenueGrowth: number | null;
  marketCap: number | null;
};

export type HoldingWithRatios = Holding & {
  ratios: FinancialRatios;
  score?: number | null; // 0-10 composite fundamental score
};

export type ETFAggregate = {
  symbol: string;
  name: string;
  weightedPe: number | null;
  weightedPb: number | null;
  weightedRoe: number | null;
  weightedDte: number | null;
  weightedRevGrowth: number | null;
  sectorAllocation: Record<string, number>;
  topHoldings: HoldingWithRatios[];
  updatedAt: string;
};
