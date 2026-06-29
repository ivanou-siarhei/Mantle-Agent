"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Asset } from "@/lib/backend";
import { fmtUsd } from "@/lib/format";
import { ChartTooltipBox, type ChartTooltipBoxProps } from "./ChartTooltip";

const PALETTE = ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#06b6d4"];

/**
 * Reads the effective theme from <html class="dark"> — set by next-themes.
 * Not a React hook (no state/effect), just a DOM read.
 */
function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function axisStroke(): string {
  return isDarkMode() ? "#52525b" : "#71717a";
}

interface EcosystemDonutProps {
  assets: Asset[];
}

export function EcosystemDonut({ assets }: EcosystemDonutProps) {
  const data = assets
    .map(a => ({ name: a.symbol, value: a.tvlUsd }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return <div className="text-sm text-zinc-500">No TVL data</div>;
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <ChartTooltipBox
                  {...(props as unknown as ChartTooltipBoxProps)}
                  valueFormatter={(v, _name, item) => {
                    const pct = total > 0 ? (v / total) * 100 : 0;
                    const symbol = (item.payload as { name?: string } | undefined)?.name ?? "";
                    return [`${fmtUsd(v, { compact: true })} (${pct.toFixed(1)}%)`, symbol];
                  }}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Color legend — maps each slice color to its asset symbol + share */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          const color = PALETTE[i % PALETTE.length];
          return (
            <li key={d.name} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="font-mono text-zinc-700 dark:text-zinc-300">{d.name}</span>
              <span className="ml-auto tabular-nums text-zinc-500 dark:text-zinc-400">{pct.toFixed(1)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface AssetBarsProps {
  assets: Asset[];
}

export function AssetBars({ assets }: AssetBarsProps) {
  const data = assets
    .map(a => ({ name: a.symbol, tvl: a.tvlUsd, volume: a.volume24h }))
    .filter(d => d.tvl > 0);

  if (data.length === 0) {
    return <div className="text-sm text-zinc-500">No data</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={axisStroke()} />
          <YAxis tickFormatter={(v) => fmtUsd(Number(v), { compact: true })} tick={{ fontSize: 11 }} stroke={axisStroke()} />
          <Tooltip
            content={(props) => (
              <ChartTooltipBox
                {...(props as unknown as ChartTooltipBoxProps)}
                valueFormatter={(v, name) => [fmtUsd(v, { compact: true }), name]}
              />
            )}
          />
          <Bar dataKey="tvl" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface HistoryChartProps {
  data: { ts: string; value: number }[];
  color?: string;
  height?: number;
  label?: string;
}

export function HistoryChart({ data, color = "#10b981", height = 200, label }: HistoryChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-zinc-500 dark:text-zinc-400">No history yet</div>;
  }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <XAxis
            dataKey="ts"
            tick={{ fontSize: 10 }}
            stroke={axisStroke()}
            tickFormatter={(v) => new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          />
          <YAxis tick={{ fontSize: 10 }} stroke={axisStroke()} />
          <Tooltip
            content={(props) => (
              <ChartTooltipBox
                {...(props as unknown as ChartTooltipBoxProps)}
                labelFormatter={(l) => new Date(String(l)).toLocaleString()}
                valueFormatter={(v) => [fmtUsd(v, { compact: true }), label ?? "value"]}
              />
            )}
          />
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
