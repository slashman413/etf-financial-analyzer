"use client";

import { useEffect, useState } from "react";
import { getStockDetail } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid,
} from "recharts";

interface Props {
  open: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
}

interface Ratios {
  pe?: number | null;
  pb?: number | null;
  roe?: number | null;
  debtToEquity?: number | null;
  revenueGrowth?: number | null;
  grossMargin?: number | null;
  netMargin?: number | null;
  currentRatio?: number | null;
  fcfMargin?: number | null;
  epsGrowth?: number | null;
  dividendYield?: number | null;
  payoutRatio?: number | null;
}

interface Trend {
  revenueTrend: string;
  roeTrend: string;
  consistencyScore: number;
  periods: number;
}

interface Insight {
  summary: string;
  score: number;
  notes: string[];
}

const navy = "#13243b";
const blue = "#0386f4";
const green = "#2fae90";
const red = "#e74c3c";

export default function StockDetailModal({ open, onClose, symbol, name }: Props) {
  const [data, setData] = useState<{
    ratios: Ratios;
    trend: Trend;
    incomeTrend: { date: string; revenue?: number; netIncome?: number; eps?: number }[];
    insights: Insight;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !symbol) return;
    setLoading(true);
    setError("");
    getStockDetail(symbol)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, symbol]);

  if (!open) return null;

  const r = data?.ratios;

  const ratioBars = r
    ? [
        { name: "PE", value: r.pe != null ? Math.min(r.pe, 100) : 0, raw: r.pe },
        { name: "PB", value: r.pb != null ? Math.min(r.pb, 30) : 0, raw: r.pb },
        { name: "ROE%", value: r.roe != null ? +(r.roe * 100).toFixed(1) : 0, raw: r.roe },
        { name: "D/E", value: r.debtToEquity != null ? Math.min(r.debtToEquity, 10) : 0, raw: r.debtToEquity },
        { name: "營收成長%", value: r.revenueGrowth != null ? +(r.revenueGrowth * 100).toFixed(1) : 0, raw: r.revenueGrowth },
      ].filter((b) => b.raw != null)
    : [];

  const trendLine = data?.incomeTrend?.length
    ? data.incomeTrend.map((d) => ({
        date: d.date?.slice(0, 7) ?? "",
        revenue: d.revenue ? +(d.revenue / 1e9).toFixed(1) : 0,
        netIncome: d.netIncome ? +(d.netIncome / 1e9).toFixed(1) : 0,
        eps: d.eps ? +d.eps.toFixed(2) : 0,
      }))
    : [];

  const trendColor = (t: string) =>
    t === "growing" ? green : t === "declining" ? red : "#888";

  const infoRow = (label: string, val: string | number | null | undefined, fmt?: (v: number) => string) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ fontWeight: 600, color: navy, fontVariantNumeric: "tabular-nums" }}>
        {val != null ? (fmt ? fmt(Number(val)) : val) : "—"}
      </span>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.45)", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12, width: "100%", maxWidth: 800,
          maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #eee" }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: navy }}>{symbol}</span>
            <span style={{ fontSize: 13, color: "#888", marginLeft: 10 }}>{name}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#999", padding: "0 4px" }}>✕</button>
        </div>

        {loading && (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid #e0e0e0`, borderTopColor: blue, animation: "spin 0.6s linear infinite", margin: "0 auto" }} />
          </div>
        )}

        {error && (
          <div style={{ padding: "20px 24px", color: red, fontSize: 13 }}>{error}</div>
        )}

        {data && !loading && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ─── Insight summary ─── */}
            {data.insights && (
              <div style={{ background: data.insights.score >= 6 ? "#f0fdf4" : data.insights.score >= 4 ? "#fefce8" : "#fef2f2", borderRadius: 8, padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: data.insights.score >= 6 ? green : data.insights.score >= 4 ? "#ca8a04" : red }}>
                    {data.insights.summary}
                  </span>
                  <span style={{ fontSize: 11, color: "#888" }}>評分 {data.insights.score}/10</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#666", lineHeight: 1.8 }}>
                  {data.insights.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}

            {/* ─── Ratio bars ─── */}
            {ratioBars.length > 0 && (
              <div style={{ background: "#fafafa", borderRadius: 8, padding: 20 }}>
                <h4 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: navy }}>關鍵比率</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ratioBars} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                    <Tooltip
                      formatter={(v: number, n: string) => {
                        const raw = ratioBars.find((b) => b.name === n)?.raw;
                        return [raw != null ? raw.toFixed(2) : v, n];
                      }}
                    />
                    <Bar dataKey="value" fill={blue} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ─── Ratio detail rows ─── */}
            {r && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: navy }}>估值指標</h4>
                  {infoRow("本益比 (PE)", r.pe, (v) => v.toFixed(2))}
                  {infoRow("股價淨值比 (PB)", r.pb, (v) => v.toFixed(2))}
                  {infoRow("股價營收比 (PS)", (r as any).ps, (v) => v.toFixed(2))}
                  {infoRow("股價現金流比 (PCF)", (r as any).pcf, (v) => v.toFixed(2))}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: navy }}>盈利指標</h4>
                  {infoRow("ROE", r.roe, (v) => (v * 100).toFixed(1) + "%")}
                  {infoRow("ROA", (r as any).roa, (v) => (v * 100).toFixed(1) + "%")}
                  {infoRow("毛利率", r.grossMargin, (v) => (v * 100).toFixed(1) + "%")}
                  {infoRow("營益率", (r as any).operatingMargin, (v) => (v * 100).toFixed(1) + "%")}
                  {infoRow("淨利率", r.netMargin, (v) => (v * 100).toFixed(1) + "%")}
                </div>
              </div>
            )}

            {r && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: navy }}>成長指標</h4>
                  {infoRow("營收成長", r.revenueGrowth, (v) => (v * 100).toFixed(1) + "%")}
                  {infoRow("EPS 成長", r.epsGrowth, (v) => (v * 100).toFixed(1) + "%")}
                  {infoRow("FCF Margin", r.fcfMargin, (v) => (v * 100).toFixed(1) + "%")}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: navy }}>財務健康</h4>
                  {infoRow("流動比率", r.currentRatio, (v) => v.toFixed(2))}
                  {infoRow("D/E", r.debtToEquity, (v) => v.toFixed(2))}
                  {infoRow("殖利率", r.dividendYield, (v) => (v * 100).toFixed(2) + "%")}
                  {infoRow("配息率", r.payoutRatio, (v) => (v * 100).toFixed(1) + "%")}
                </div>
              </div>
            )}

            {/* ─── Trend ─── */}
            {data.trend && (
              <div style={{ background: "#fafafa", borderRadius: 8, padding: 20 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: navy }}>趨勢分析</h4>
                <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                  {[
                    { l: "營收趨勢", v: data.trend.revenueTrend, c: trendColor(data.trend.revenueTrend) },
                    { l: "ROE 趨勢", v: data.trend.roeTrend, c: trendColor(data.trend.roeTrend) },
                    { l: "一致性", v: (data.trend.consistencyScore * 100).toFixed(0) + "%", c: data.trend.consistencyScore >= 0.7 ? green : data.trend.consistencyScore >= 0.4 ? "#ca8a04" : red },
                    { l: "期數", v: data.trend.periods, c: "#888" },
                  ].map((s) => (
                    <div key={s.l} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>{s.l}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {trendLine.length > 1 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendLine} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#aaa" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke={blue} strokeWidth={2} dot={false} name="營收 (B)" />
                      <Line type="monotone" dataKey="netIncome" stroke={green} strokeWidth={2} dot={false} name="淨利 (B)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
