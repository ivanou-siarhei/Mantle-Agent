/**
 * Two-lens Markdown research digest — the single artifact a human or
 * another agent can act on. Mirrors the Mantle Research Agent concept:
 * Lens 1 (Market Monitor) + Lens 2 (Narrative Radar) + Agent's take.
 */

import type { Asset, EcosystemSnapshot, NarrativeStat, Pool } from "./models";
import { STAGE_LABEL, buildNarrativeRadar } from "./narrative";

function fmtUsd(x: number): string {
  if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `$${(x / 1_000).toFixed(1)}K`;
  return `$${x.toFixed(2)}`;
}
function fmtReach(x: number): string {
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
  return String(x);
}
function pct(x: number): string {
  return `${x >= 0 ? "+" : ""}${x.toFixed(0)}%`;
}

export function buildDigestMarkdown(args: {
  snapshot: EcosystemSnapshot;
  assets: Asset[];
  pools: Pool[];
  narratives: NarrativeStat[];
  adapter: string;
  llm: string;
  take?: string;
}): string {
  const { snapshot, assets, pools, narratives, adapter, llm } = args;
  const poolBySymbol = new Map(pools.map((p) => [p.assetSymbol, p]));
  const top = [...assets].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 8);

  const lines: string[] = [];
  lines.push("# Mantle Research Agent — Daily Digest");
  lines.push(`_source: ${adapter} · LLM: ${llm}_`);
  lines.push("");
  lines.push("## Lens 1 — Market Monitor");
  lines.push(
    `Coverage: ${snapshot.assetCount} equities · TVL ${fmtUsd(snapshot.totalTvl)} · 24h vol ${fmtUsd(snapshot.totalVolume)}`
  );
  lines.push("");
  lines.push("| Symbol | Price | Premium | TVL | 24h Vol | Health |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const a of top) {
    const p = poolBySymbol.get(a.symbol);
    void p;
    lines.push(
      `| ${a.symbol} | $${a.price.toFixed(2)} | ${pct(a.premiumDiscount)} | ${fmtUsd(a.tvlUsd)} | ${fmtUsd(a.volume24h)} | ${a.healthScore.toFixed(0)}/100 |`
    );
  }
  lines.push("");
  lines.push("## Lens 2 — Narrative Radar");
  lines.push("| Narrative | Mentions | Δ vs prior | Reach | Sources | Stage |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const s of narratives) {
    lines.push(
      `| ${s.narrative} | ${s.mentions} | ${pct(s.deltaPct)} | ${fmtReach(s.reach)} | ${s.breadth} | ${STAGE_LABEL[s.stage]} |`
    );
  }
  lines.push("");
  lines.push("## Agent's take");
  lines.push(args.take ?? buildNarrativeRadar(narratives).body);
  return lines.join("\n");
}
