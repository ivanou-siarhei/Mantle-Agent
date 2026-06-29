"use client";

import { cn } from "@/lib/utils";

interface HealthBadgeProps {
  score: number;
  className?: string;
}

export function HealthBadge({ score, className }: HealthBadgeProps) {
  const color =
    score >= 70 ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60"
    : score >= 50 ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60"
    : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums",
      color,
      className
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {score.toFixed(1)}
    </span>
  );
}

interface ScoreBarProps {
  score: number;
  max?: number;
  label?: string;
  className?: string;
}

export function ScoreBar({ score, max = 100, label, className }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color =
    score >= 70 ? "bg-emerald-500"
    : score >= 50 ? "bg-amber-500"
    : "bg-rose-500";
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
          <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">{score.toFixed(1)}</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
