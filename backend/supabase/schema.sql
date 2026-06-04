CREATE TABLE IF NOT EXISTS etf_holdings (
  id SERIAL PRIMARY KEY,
  etf_symbol TEXT NOT NULL,
  holding_symbol TEXT NOT NULL,
  holding_name TEXT,
  weight NUMERIC(8,4),
  sector TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS etf_ratios (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  pe NUMERIC(10,2),
  pb NUMERIC(10,2),
  roe NUMERIC(8,4),
  debt_to_equity NUMERIC(8,4),
  revenue_growth NUMERIC(8,4),
  market_cap BIGINT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_etf_holdings_etf ON etf_holdings(etf_symbol);
CREATE INDEX IF NOT EXISTS idx_etf_ratios_symbol ON etf_ratios(symbol);
