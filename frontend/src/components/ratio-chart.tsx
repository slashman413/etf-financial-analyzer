"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomTooltip } from "@/components/custom-tooltip";
import type { ETFAggregate } from "@/lib/types";

const BAR_COLORS = ["#3b82f6", "#6366f1", "#22c55e", "#f59e0b", "#8b5cf6"];

export function RatioChart({ data }: { data: ETFAggregate }) {
  const items = [
    { name: "PE", value: data.weightedPe ?? 0 },
    { name: "PB", value: data.weightedPb ?? 0 },
    {
      name: "ROE",
      value: data.weightedRoe != null ? +(data.weightedRoe * 100).toFixed(1) : 0,
    },
    { name: "D/E", value: data.weightedDte ?? 0 },
    {
      name: "營收成長",
      value: data.weightedRevGrowth != null ? +(data.weightedRevGrowth * 100).toFixed(1) : 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>加權指標</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={items} barSize={48}>
            <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {items.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
