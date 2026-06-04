"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { HoldingWithRatios } from "@/lib/types";

export function HoldingsTable({
  holdings,
}: {
  holdings: HoldingWithRatios[];
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  代號
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  名稱
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  比重
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  PE
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  PB
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ROE
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  D/E
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  營收成長
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr
                  key={h.symbol}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {h.symbol}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{h.name}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-900">
                    {h.weight.toFixed(2)}%
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-900">
                    {h.ratios.pe?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-900">
                    {h.ratios.pb?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-900">
                    {h.ratios.roe != null
                      ? (h.ratios.roe * 100).toFixed(1) + "%"
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-900">
                    {h.ratios.debtToEquity?.toFixed(2) ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-slate-900">
                    {h.ratios.revenueGrowth != null
                      ? (h.ratios.revenueGrowth * 100).toFixed(1) + "%"
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
