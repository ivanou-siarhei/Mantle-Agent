"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fmtUsd } from "@/lib/format";
import type { SnapshotRow } from "@/lib/backend";

/**
 * Reads the effective theme from <html class="dark"> — set by next-themes.
 * Not a React hook (no state/effect), just a DOM read.
 */
function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function tooltipStyle(): React.CSSProperties {
  const dark = isDarkMode();
  return {
    borderRadius: 8,
    border: `1px solid ${dark ? "#3f3f46" : "#e4e4e7"}`,
    background: dark ? "#18181b" : "#ffffff",
    color: dark ? "#f4f4f5" : "#18181b",
    fontSize: 12,
  };
}

function axisStroke(): string {
  return isDarkMode() ? "#52525b" : "#71717a";
}

function gridStroke(): string {
  return isDarkMode() ? "#27272a" : "#e4e4e7";
}

interface TvlHistoryChartProps {
  snapshots: SnapshotRow[];
  height?: number;
}

export function TvlHistoryChart({ snapshots, height = 220 }: TvlHistoryChartProps) {
  if (!snapshots || snapshots.length === 0) {
    return <div className="text-sm text-zinc-500">No history yet — refresh a few times to build a trend.</div>;
  }
  const data = [...snapshots].reverse().map((s) => ({
    ts: s.timestamp,
    tvl: s.totalTvl,
    volume: s.totalVolume,
  }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke()} vertical={false} />
          <XAxis
            dataKey="ts"
            tick={{ fontSize: 10 }}
            stroke={axisStroke()}
            tickFormatter={(v) =>
              new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            }
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke={axisStroke()}
            tickFormatter={(v) => fmtUsd(Number(v), { compact: true })}
          />
          <Tooltip
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
            formatter={(v: number, name: string) => [
              fmtUsd(v, { compact: true }),
              name === "tvl" ? "TVL" : "Volume",
            ]}
            contentStyle={tooltipStyle()}
          />
          <Area type="monotone" dataKey="tvl" stroke="#10b981" strokeWidth={2} fill="url(#tvlGradient)" />
          <Area type="monotone" dataKey="volume" stroke="#0ea5e9" strokeWidth={1.5} fill="url(#volumeGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AssetHistoryChartProps {
  data: Array<{ ts: string; tvlUsd: number; price: number; premium: number }>;
  height?: number;
}

export function AssetHistoryChart({ data, height = 180 }: AssetHistoryChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-zinc-500 dark:text-zinc-400">No history yet.</div>;
  }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke()} vertical={false} />
          <XAxis
            dataKey="ts"
            tick={{ fontSize: 10 }}
            stroke={axisStroke()}
            tickFormatter={(v) =>
              new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            }
          />
          <YAxis tick={{ fontSize: 10 }} stroke={axisStroke()} />
          <Tooltip
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
            contentStyle={tooltipStyle()}
          />
          <Line type="monotone" dataKey="tvlUsd" stroke="#10b981" strokeWidth={2} dot={false} name="TVL" />
          <Line type="monotone" dataKey="price" stroke="#0ea5e9" strokeWidth={1.5} dot={false} name="Price" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
