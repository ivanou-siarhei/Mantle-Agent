/** Formatting helpers for the dashboard. */

export function fmtUsd(x: number, opts: { compact?: boolean } = {}): string {
  if (x == null || isNaN(x)) return "$0";
  if (opts.compact) {
    if (Math.abs(x) >= 1_000_000_000) return `$${(x / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(x) >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
    if (Math.abs(x) >= 1_000) return `$${(x / 1_000).toFixed(1)}K`;
  }
  return `$${x.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function fmtPct(x: number, withSign = true): string {
  const sign = withSign && x > 0 ? "+" : "";
  return `${sign}${x.toFixed(2)}%`;
}

export function fmtNum(x: number, digits = 2): string {
  return x.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function shortAddr(addr: string, head = 6, tail = 4): string {
  if (!addr) return "—";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

export function healthColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

export function healthBg(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

export function premiumColor(p: number): string {
  if (p > 0.5) return "text-emerald-600";
  if (p < -0.5) return "text-rose-600";
  return "text-zinc-500";
}
