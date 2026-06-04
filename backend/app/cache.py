import json, os, time

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache")
CACHE_FILE = os.path.join(CACHE_DIR, "aggregate_cache.json")
CACHE_TTL = 86400 * 28  # ~monthly

def _load() -> dict:
    if not os.path.exists(CACHE_FILE): return {}
    with open(CACHE_FILE) as f: return json.load(f)

def _save(data: dict):
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "w") as f: json.dump(data, f, ensure_ascii=False)

def get(ticker: str):
    cache = _load()
    entry = cache.get(ticker.upper())
    if entry and time.time() - entry["ts"] < CACHE_TTL:
        return entry["data"]
    return None

def set(ticker: str, data: dict):
    cache = _load()
    cache[ticker.upper()] = {"ts": time.time(), "data": data}
    _save(cache)
