"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ETFAggregate } from "@/lib/types";

const METRICS = [
  { key: "weightedPe" as const, label: "加權 PE", fmt: (v: number) => v.toFixed(2), unit: "" },
  { key: "weightedPb" as const, label: "加權 PB", fmt: (v: number) => v.toFixed(2), unit: "" },
  { key: "weightedRoe" as const, label: "加權 ROE", fmt: (v: number) => (v * 100).toFixed(1), unit: "%" },
  { key: "weightedDte" as const, label: "加權 D/E", fmt: (v: number) => v.toFixed(2), unit: "" },
  { key: "weightedRevGrowth" as const, label: "營收成長", fmt: (v: number) => (v * 100).toFixed(1), unit: "%" },
];

export function MetricCards({ data }: { data: ETFAggregate }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {METRICS.map((m) => {
        const val = data[m.key];
        return (
          <Card key={m.key}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">{m.label}</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                {val != null ? `${m.fmt(val)}${m.unit}` : "—"}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
