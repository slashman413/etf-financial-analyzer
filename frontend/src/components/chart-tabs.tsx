"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectorPie } from "@/components/sector-pie";
import type { ETFAggregate } from "@/lib/types";

export function ChartTabs({ data }: { data: ETFAggregate }) {
  const [tab, setTab] = useState("sector");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="sector">產業配置</TabsTrigger>
        <TabsTrigger value="ratio">加權指標</TabsTrigger>
      </TabsList>
      <TabsContent value="sector">
        <SectorPie data={data.sectorAllocation} />
      </TabsContent>
      <TabsContent value="ratio">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h3 className="mb-1 text-sm font-semibold tracking-tight text-slate-900">
            加權指標
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            ETF 整體的財務健康概要
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              {
                label: "加權 PE",
                value: data.weightedPe,
                fmt: (v: number) => v.toFixed(2),
              },
              {
                label: "加權 PB",
                value: data.weightedPb,
                fmt: (v: number) => v.toFixed(2),
              },
              {
                label: "加權 ROE",
                value: data.weightedRoe,
                fmt: (v: number) => (v * 100).toFixed(1) + "%",
              },
              {
                label: "加權 D/E",
                value: data.weightedDte,
                fmt: (v: number) => v.toFixed(2),
              },
              {
                label: "營收成長",
                value: data.weightedRevGrowth,
                fmt: (v: number) => (v * 100).toFixed(1) + "%",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                  {m.value != null ? m.fmt(m.value) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
