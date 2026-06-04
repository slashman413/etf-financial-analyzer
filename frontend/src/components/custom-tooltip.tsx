"use client";

import type { TooltipProps } from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

export function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-md">
      {label && (
        <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="text-sm tabular-nums text-slate-900">
          {p.name}:{" "}
          <span className="font-semibold">
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
            {p.name === "ROE" || p.name === "營收成長" ? "%" : ""}
          </span>
        </p>
      ))}
    </div>
  );
}
