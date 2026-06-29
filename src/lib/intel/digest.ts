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

function equitySignals(a: Asset): string {
  const flags: string[] = [];
  const spread = a.spreadBps ?? 0;
  if (a.tvlUsd < 3_000_000) flags.push(`thin liquidity (${fmtUsd(a.tvlUsd)})`);
  if (spread > 50) flags.push(`wide spread (${spread} bps)`);
  if (Math.abs(a.premiumDiscount) > 1)
    flags.push(`${a.premiumDiscount >= 0 ? "premium" : "discount"} ${pct(a.premiumDiscount)}`);
  return flags.length ? flags.join("; ") : "healthy: tight spread, adequate depth";
}

export function buildDigestMarkdown(args: {
  snapshot: EcosystemSnapshot;
  assets: Asset[];
  pools: Pool[];
  narratives: NarrativeStat[];
  adapter: string;
  llm: string;
  poolSource?: string;
  take?: string;
}): string {
  const { snapshot, assets, pools, narratives, adapter, llm } = args;
  const poolSource = args.poolSource ?? adapter;
  const topEquities = [...assets].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 8);
  const topPools = [...pools].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 10);
  const venue = assets[0]?.venue ?? "Atomic RFQ (xChange)";

  const lines: string[] = [];
  lines.push("# Mantle Research Agent — Daily Digest");
  lines.push(`_equities: ${adapter} · pools: ${poolSource} · LLM: ${llm}_`);
  lines.push("");
  lines.push("## Lens 1 — Market Monitor");
  lines.push(
    `Tokenized equities (${snapshot.assetCount}) settle via ${venue} — issuer-direct RFQ quotes, not AMM pools. "Liquidity" below is RFQ depth.`
  );
  lines.push("");
  lines.push("| Symbol | Onchain | Spread | RFQ Depth | 24h Vol | Premium | Signals |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const a of topEquities) {
    lines.push(
      `| ${a.symbol} | $${a.price.toFixed(2)} | ${a.spreadBps ?? 0} bps | ${fmtUsd(a.tvlUsd)} | ${fmtUsd(a.volume24h)} | ${pct(a.premiumDiscount)} | ${equitySignals(a)} |`
    );
  }
  lines.push("");
  lines.push("## Lens 1b — Fluxion AMM Pools");
  lines.push(
    `On-chain AMM pools (${snapshot.poolCount}) · TVL ${fmtUsd(snapshot.totalTvl)} · 24h vol ${fmtUsd(snapshot.totalVolume)} · source: ${poolSource}`
  );
  lines.push("");
  lines.push("| Pool | TVL | APR | Fees 24h | V/TVL | Health |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const p of topPools) {
    lines.push(
      `| ${p.assetSymbol} | ${fmtUsd(p.tvlUsd)} | ${p.apr.toFixed(2)}% | ${fmtUsd(p.fees24h)} | ${p.volumeToTvl.toFixed(2)} | ${p.healthScore.toFixed(0)}/100 |`
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
