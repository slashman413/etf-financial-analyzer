"use client";

import { useState, useEffect } from "react";
import type { ETFAggregate } from "@/lib/types";
import { getETFAggregate, prefetchCache } from "@/lib/api";
import { SearchBar } from "@/components/etf-search";
import StockDetailModal from "@/components/StockDetailModal";

// ─── StatementDog inspired palette ───
const navy   = "#13243b";
const blue   = "#0386f4";
const accent = "#2fae90";
const red    = "#e74c3c";

const POPULAR = [
  { t: "SPY", n: "S&P 500" }, { t: "QQQ", n: "Nasdaq 100" },
  { t: "VTI", n: "Total US" }, { t: "VOO", n: "S&P 500" },
  { t: "0050.TW", n: "台灣 50" }, { t: "0056.TW", n: "高股息" },
];

const SECTOR_COLORS = ["#0386f4","#e74c3c","#2fae90","#f39c12","#9b59b6","#1abc9c","#e91e63","#8bc34a","#00bcd4","#ff5722","#3f51b5"];

const METRICS: { k: keyof ETFAggregate; l: string; f: (v: number) => string }[] = [
  { k: "weightedPe" as any, l: "PE", f: (v) => v.toFixed(2) },
  { k: "weightedPb" as any, l: "PB", f: (v) => v.toFixed(2) },
  { k: "weightedRoe" as any, l: "ROE", f: (v) => (v * 100).toFixed(1) + "%" },
  { k: "weightedDte" as any, l: "D/E", f: (v) => v.toFixed(2) },
  { k: "weightedRevGrowth" as any, l: "營收成長", f: (v) => (v * 100).toFixed(1) + "%" },
];

const LoadingSpinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
    <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid #e0e0e0`, borderTopColor: blue, animation: "spin 0.6s linear infinite" }} />
  </div>
);

export default function DesktopHome() {
  const [data, setData] = useState<ETFAggregate | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [active, setActive] = useState("");
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [detailName, setDetailName] = useState("");

  const load = async (t: string) => {
    setLoading(true); setErr(""); setActive(t);
    setData(null); // ← clear old data immediately
    try { setData(await getETFAggregate(t)); }
    catch (e: any) { setErr(e.message); setData(null); }
    setLoading(false);
  };

  // Mount: load SPY first, then warm cache in background
  useEffect(() => {
    load("SPY");
    // warm cache for all defaults (no await — background)
    prefetchCache();
  }, []);

  const sectors = data ? Object.entries(data.sectorAllocation).map(([k, v]) => ({ n: k, v })).sort((a, b) => b.v - a.v) : [];

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh" }}>

      {/* inject keyframes */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ─── Top Bar ─── */}
      <div style={{ background: navy }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: blue, width: 8, height: 8, borderRadius: "50%" }} />
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 600, letterSpacing: 0.5 }}>ETF 財務分析</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginLeft: 4 }}>by yfinance</span>
            </div>
            <div style={{ position: "relative", width: 260 }}>
            <SearchBar onSelect={load} />
            </div>
          </div>
          {/* pills row */}
          <div style={{ display: "flex", gap: 4, paddingBottom: 10, flexWrap: "wrap" }}>
            {POPULAR.map(e => (
              <button key={e.t} onClick={() => load(e.t)}
                style={{
                  padding: "3px 12px", fontSize: 12, borderRadius: 4, border: 0, cursor: "pointer", transition: "all 0.15s",
                  background: active === e.t ? blue : "rgba(255,255,255,0.08)",
                  color: active === e.t ? "#fff" : "rgba(255,255,255,0.7)",
                  fontWeight: active === e.t ? 600 : 400,
                }}>
                {e.t} <span style={{ opacity: 0.5, fontWeight: 400 }}>{e.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main content ─── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 40px" }}>

        {err && (
          <div style={{ background: "#fff0f0", border: "1px solid #ffd4d4", borderRadius: 6, padding: "12px 16px", fontSize: 13, color: "#c00" }}>{err}</div>
        )}

        {loading && !data && <LoadingSpinner />}

        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ─── ETF header info ─── */}
            <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: navy }}>{data.symbol}</span>
                  <span style={{ fontSize: 13, color: "#888" }}>{data.name}</span>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 6 }}>
                  {METRICS.map(m => {
                    const v = (data as any)[m.k];
                    return (
                      <div key={m.k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 11, color: "#999" }}>{m.l}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: navy, fontVariantNumeric: "tabular-nums" }}>{v != null ? m.f(v) : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#bbb" }}>
                {data.topHoldings.length} 檔成分股
              </div>
            </div>

            {/* ─── Two columns ─── */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>

              {/* Sector */}
              <div style={{ background: "#fff", borderRadius: 8, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: navy, margin: 0, marginBottom: 2 }}>產業配置</h3>
                <p style={{ fontSize: 11, color: "#aaa", marginTop: 0, marginBottom: 16 }}>依市值加權占比</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sectors.map((s, i) => (
                    <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: SECTOR_COLORS[i % SECTOR_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#555", width: 100, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.n}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f0f0f0", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: SECTOR_COLORS[i % SECTOR_COLORS.length], width: `${s.v}%`, transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: navy, fontVariantNumeric: "tabular-nums", width: 36, textAlign: "right" }}>{s.v.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ background: "#fff", borderRadius: 8, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: navy, margin: 0, marginBottom: 2 }}>指標摘要</h3>
                <p style={{ fontSize: 11, color: "#aaa", marginTop: 0, marginBottom: 16 }}>加權平均</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { l: "加權 PE", v: data.weightedPe, f: (v: number) => v.toFixed(2) },
                    { l: "加權 PB", v: data.weightedPb, f: (v: number) => v.toFixed(2) },
                    { l: "ROE", v: data.weightedRoe != null ? (data.weightedRoe * 100).toFixed(1) + "%" : "—" },
                    { l: "D/E", v: data.weightedDte, f: (v: number) => v.toFixed(2) },
                    { l: "營收成長", v: data.weightedRevGrowth != null ? (data.weightedRevGrowth * 100).toFixed(1) + "%" : "—" },
                    { l: "成分股數", v: data.topHoldings.length },
                  ].map(s => (
                    <div key={s.l} style={{ background: "#fafafa", borderRadius: 6, padding: "10px 12px" }}>
                      <p style={{ margin: 0, fontSize: 10, color: "#999", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, color: navy, fontVariantNumeric: "tabular-nums" }}>
                        {s.v != null ? s.v : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Holdings table ─── */}
            <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0" }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: navy, margin: 0 }}>成分股列表</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      {["#", "代號", "名稱", "比重(%)", "PE", "PB", "ROE(%)", "D/E", "營收成長(%)", "評分"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: h === "名稱" ? "left" : "right", fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #eee" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topHoldings.map((h, i) => (
                      <tr key={h.symbol} style={{ borderBottom: "1px solid #f5f5f5", transition: "background 0.15s", cursor: "pointer" }}
                        onClick={() => { setDetailSymbol(h.symbol); setDetailName(h.name); }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={{ padding: "10px 14px", textAlign: "center", color: "#bbb", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: navy }}>{h.symbol}</td>
                        <td style={{ padding: "10px 14px", color: "#666" }}>{h.name}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: navy }}>{h.weight.toFixed(2)}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#555" }}>{h.ratios.pe?.toFixed(1) ?? "—"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#555" }}>{h.ratios.pb?.toFixed(1) ?? "—"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#555" }}>{h.ratios.roe != null ? (h.ratios.roe * 100).toFixed(1) : "—"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#555" }}>{h.ratios.debtToEquity?.toFixed(2) ?? "—"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: h.ratios.revenueGrowth != null ? (h.ratios.revenueGrowth > 0 ? accent : red) : "#555" }}>
                          {h.ratios.revenueGrowth != null ? (h.ratios.revenueGrowth * 100).toFixed(1) : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums",
                          background: h.score != null ? (h.score >= 7 ? "#e8f5e9" : h.score >= 4 ? "#fff8e1" : "#ffebee") : "transparent",
                          color: h.score != null ? (h.score >= 7 ? "#2e7d32" : h.score >= 4 ? "#f57f17" : "#c62828") : "#999",
                          borderRadius: 4 }}>{h.score?.toFixed(1) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", paddingTop: 12 }}>
              <span style={{ fontSize: 10, color: "#ccc", letterSpacing: 1, textTransform: "uppercase" }}>資料來源: yfinance · 即時更新</span>
            </div>
          </div>
        )}
      </div>
      <StockDetailModal
        open={detailSymbol != null}
        onClose={() => { setDetailSymbol(null); setDetailName(""); }}
        symbol={detailSymbol ?? ""}
        name={detailName}
      />
    </div>
  );
}
