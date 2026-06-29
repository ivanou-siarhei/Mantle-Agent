"use client";

import { cn } from "@/lib/utils";
import type { Opportunity, OpportunityKind } from "@/lib/backend";

interface OpportunityPillProps {
  kind: OpportunityKind;
  className?: string;
}

const kindStyle: Record<OpportunityKind, { label: string; cls: string }> = {
  best_yield: { label: "Best Yield", cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60" },
  hidden_gem: { label: "Hidden Gem", cls: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/60" },
  liquidity: { label: "Liquidity", cls: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/60" },
  risk: { label: "Risk", cls: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60" },
};

export function OpportunityPill({ kind, className }: OpportunityPillProps) {
  const s = kindStyle[kind];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
      s.cls,
      className
    )}>
      {s.label}
    </span>
  );
}

interface OpportunityListProps {
  opportunities: Opportunity[];
  emptyHint?: string;
}

export function OpportunityList({ opportunities, emptyHint = "No opportunities detected." }: OpportunityListProps) {
  if (!opportunities.length) {
    return <div className="text-sm text-zinc-500 dark:text-zinc-400">{emptyHint}</div>;
  }
  return (
    <ul className="space-y-2">
      {opportunities.map((o, i) => (
        <li key={i} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="w-16 shrink-0">
            <OpportunityPill kind={o.kind} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{o.title}</div>
              <div className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">score {o.score.toFixed(1)}</div>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{o.explanation}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
