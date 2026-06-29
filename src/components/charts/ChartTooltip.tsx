"use client";

import type { ReactNode } from "react";

type TooltipItem = {
  value: number;
  name?: string;
  payload?: Record<string, unknown>;
};

type Formatted = string | [string, string];

export interface ChartTooltipBoxProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  labelFormatter?: (label: string | number) => ReactNode;
  valueFormatter?: (value: number, name: string, item: TooltipItem) => Formatted;
}

/**
 * Theme-reactive recharts tooltip. Uses Tailwind `dark:` classes (driven by the
 * <html class="dark"> toggle) instead of an inline style read once at render, so
 * the background follows the active light/dark theme reliably and updates on a
 * theme switch without needing the chart to re-render.
 */
export function ChartTooltipBox({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: ChartTooltipBoxProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
      {label !== undefined && label !== "" && (
        <div className="mb-1 font-medium text-zinc-500 dark:text-zinc-400">
          {labelFormatter ? labelFormatter(label) : String(label)}
        </div>
      )}
      {payload.map((item, i) => {
        const out: Formatted = valueFormatter
          ? valueFormatter(item.value, item.name ?? "", item)
          : [String(item.value), item.name ?? ""];
        const [display, name] = Array.isArray(out) ? out : [out, item.name ?? ""];
        return (
          <div key={i} className="flex items-center justify-between gap-3">
            {name ? (
              <span className="text-zinc-500 dark:text-zinc-400">{name}</span>
            ) : null}
            <span className="font-medium tabular-nums">{display}</span>
          </div>
        );
      })}
    </div>
  );
}
