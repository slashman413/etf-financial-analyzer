const API = "/api/etf";

export async function getETFAggregate(ticker: string) {
  const res = await fetch(`${API}/${ticker}/aggregate`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function autocompleteETFs(q: string) {
  const res = await fetch(`${API}/autocomplete?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json() as Promise<{ symbol: string; name: string }[]>;
}

export async function prefetchCache() {
  const res = await fetch(`${API}/cache/prefetch`, { method: "POST", cache: 'no-store' });
  return res.json();
}

export async function getCacheStatus() {
  const res = await fetch(`${API}/cache/status`, { cache: 'no-store' });
  return res.json();
}

export async function getStockDetail(symbol: string) {
  const res = await fetch(`${API}/${symbol}/detail`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
