"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  title: string;
  body: string;
  bullets?: string[];
  evidence?: { metric: string; value: string | number }[];
  accent?: "default" | "emerald" | "amber" | "rose" | "violet";
  icon?: React.ReactNode;
}

const accentBorder: Record<NonNullable<InsightCardProps["accent"]>, string> = {
  default: "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
  emerald: "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20",
  amber: "border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20",
  rose: "border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20",
  violet: "border-violet-200 bg-violet-50/30 dark:border-violet-900/40 dark:bg-violet-950/20",
};

export function InsightCard({ title, body, bullets, evidence, accent = "default", icon }: InsightCardProps) {
  return (
    <Card className={cn("border p-5", accentBorder[accent])}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon && <div className="text-zinc-400 dark:text-zinc-500">{icon}</div>}
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{body}</p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {evidence && evidence.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {evidence.map((e, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-400">{e.metric}:</span>
              <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{typeof e.value === "number" ? e.value.toLocaleString("en-US", { maximumFractionDigits: 3 }) : e.value}</span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
