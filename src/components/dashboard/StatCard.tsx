"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "emerald" | "amber" | "rose";
  icon?: React.ReactNode;
}

const accentMap: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "border-zinc-200 dark:border-zinc-800",
  emerald: "border-emerald-300 dark:border-emerald-900/60",
  amber: "border-amber-300 dark:border-amber-900/60",
  rose: "border-rose-300 dark:border-rose-900/60",
};

const valueColor: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "text-zinc-900 dark:text-zinc-100",
  emerald: "text-emerald-700 dark:text-emerald-400",
  amber: "text-amber-700 dark:text-amber-400",
  rose: "text-rose-700 dark:text-rose-400",
};

export function StatCard({ label, value, sub, accent = "default", icon }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-zinc-900",
      accentMap[accent]
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</div>
          <div className={cn("mt-1 text-2xl font-semibold tabular-nums", valueColor[accent])}>{value}</div>
          {sub && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>}
        </div>
        {icon && <div className="text-zinc-300 dark:text-zinc-600">{icon}</div>}
      </div>
    </div>
  );
}
