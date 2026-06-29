/**
 * Opportunity engine — port of backend/opportunities/detector.py.
 *
 * Detects: best_yield, hidden_gem, liquidity, risk.
 * All scores 0..100, all explanations grounded in metrics.
 */

import type { Asset, Opportunity, OpportunityKind, Pool } from "./models";

function poolExplanation(p: Pool, kind: OpportunityKind): string {
  switch (kind) {
    case "best_yield":
      return `${p.assetSymbol} pool: APR ${p.apr.toFixed(2)}% on TVL $${fmtUsd(p.tvlUsd)} with healthy volume $${fmtUsd(p.volume24h)} (${p.volumeToTvl.toFixed(2)} V/TVL) and health score ${p.healthScore.toFixed(1)}.`;
    case "hidden_gem":
      return `${p.assetSymbol} pool: small TVL $${fmtUsd(p.tvlUsd)} but strong fees $${fmtUsd(p.fees24h)}/day and volume $${fmtUsd(p.volume24h)} — fee efficiency ${p.feeEfficiency.toFixed(1)}/100.`;
    case "liquidity":
      return `${p.assetSymbol} pool: improving liquidity, TVL $${fmtUsd(p.tvlUsd)}, health score ${p.healthScore.toFixed(1)}.`;
    case "risk":
      return `${p.assetSymbol} pool: risk flag — TVL $${fmtUsd(p.tvlUsd)}, volume $${fmtUsd(p.volume24h)}, APR ${p.apr.toFixed(2)}%, health ${p.healthScore.toFixed(1)}.`;
  }
}

function fmtUsd(x: number): string {
  if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `$${(x / 1_000).toFixed(1)}K`;
  return `$${x.toFixed(2)}`;
}

function detectBestYield(pools: Pool[]): Opportunity[] {
  const out: Opportunity[] = [];
  for (const p of pools) {
    if (!(p.apr >= 10 && p.apr <= 80)) continue;
    if (p.volumeToTvl < 0.05) continue;
    if (p.healthScore < 60) continue;
    const score = Math.min(
      100,
      0.4 * Math.min(100, p.apr) +
        0.4 * p.healthScore +
        0.2 * Math.min(100, p.volumeToTvl * 100)
    );
    out.push({
      kind: "best_yield",
      title: `Best Yield: ${p.assetSymbol}`,
      assetSymbol: p.assetSymbol,
      poolAddress: p.address,
      score: round(score, 1),
      metrics: {
        apr: p.apr,
        tvl: p.tvlUsd,
        volume_24h: p.volume24h,
        volume_to_tvl: p.volumeToTvl,
        health_score: p.healthScore,
      },
      explanation: poolExplanation(p, "best_yield"),
    });
  }
  return out;
}

function detectHiddenGems(pools: Pool[]): Opportunity[] {
  const out: Opportunity[] = [];
  for (const p of pools) {
    if (p.tvlUsd >= 500_000 || p.tvlUsd <= 0) continue;
    const feeYield = p.tvlUsd > 0 ? p.fees24h / p.tvlUsd : 0;
    if (feeYield < 0.0005) continue;
    if (p.volume24h < 50_000) continue;
    const score = Math.min(
      100,
      50 * feeYield * 1000 +
        0.3 * p.feeEfficiency +
        0.2 * Math.min(100, p.volume24h / 1000)
    );
    out.push({
      kind: "hidden_gem",
      title: `Hidden Gem: ${p.assetSymbol}`,
      assetSymbol: p.assetSymbol,
      poolAddress: p.address,
      score: round(score, 1),
      metrics: {
        tvl: p.tvlUsd,
        fees_24h: p.fees24h,
        fee_yield_daily: round(feeYield * 100, 4),
        volume_24h: p.volume24h,
        fee_efficiency: p.feeEfficiency,
      },
      explanation: poolExplanation(p, "hidden_gem"),
    });
  }
  return out;
}

function detectLiquidity(pools: Pool[], assets: Asset[]): Opportunity[] {
  const out: Opportunity[] = [];
  const assetBySymbol = new Map(assets.map((a) => [a.symbol, a]));
  for (const p of pools) {
    const a = assetBySymbol.get(p.assetSymbol);
    if (!a) continue;
    if (a.growthScore < 55) continue;
    if (p.healthScore < 55) continue;
    const score = Math.min(100, 0.5 * a.growthScore + 0.5 * p.healthScore);
    out.push({
      kind: "liquidity",
      title: `Rising Liquidity: ${p.assetSymbol}`,
      assetSymbol: p.assetSymbol,
      poolAddress: p.address,
      score: round(score, 1),
      metrics: {
        growth_score: a.growthScore,
        pool_health: p.healthScore,
        tvl: p.tvlUsd,
        asset_tvl: a.tvlUsd,
      },
      explanation: poolExplanation(p, "liquidity"),
    });
  }
  return out;
}

function detectRisks(pools: Pool[], assets: Asset[]): Opportunity[] {
  const out: Opportunity[] = [];
  const assetBySymbol = new Map(assets.map((a) => [a.symbol, a]));
  for (const p of pools) {
    const reasons: string[] = [];
    if (p.healthScore < 40) reasons.push(`low health (${p.healthScore.toFixed(1)})`);
    if (p.volumeToTvl < 0.02 && p.tvlUsd > 50_000)
      reasons.push(`low volume/TVL (${p.volumeToTvl.toFixed(3)})`);
    if (p.apr > 150) reasons.push(`unsustainable APR (${p.apr.toFixed(1)}%)`);
    const a = assetBySymbol.get(p.assetSymbol);
    if (a && Math.abs(a.premiumDiscount) > 1.5)
      reasons.push(`wide premium/discount (${a.premiumDiscount >= 0 ? "+" : ""}${a.premiumDiscount.toFixed(2)}%)`);
    if (reasons.length === 0) continue;
    const score = Math.max(0, 100 - p.healthScore);
    out.push({
      kind: "risk",
      title: `Risk: ${p.assetSymbol}`,
      assetSymbol: p.assetSymbol,
      poolAddress: p.address,
      score: round(score, 1),
      metrics: {
        health_score: p.healthScore,
        volume_to_tvl: p.volumeToTvl,
        apr: p.apr,
        reasons,
      },
      explanation: poolExplanation(p, "risk") + ` Reasons: ${reasons.join("; ")}.`,
    });
  }
  return out;
}

export function detectOpportunities(
  pools: Pool[],
  assets: Asset[]
): Opportunity[] {
  const opps: Opportunity[] = [
    ...detectBestYield(pools),
    ...detectHiddenGems(pools),
    ...detectLiquidity(pools, assets),
    ...detectRisks(pools, assets),
  ];
  return rankOpportunities(opps);
}

export function rankOpportunities(opps: Opportunity[]): Opportunity[] {
  const priority: Record<OpportunityKind, number> = {
    best_yield: 0,
    hidden_gem: 1,
    liquidity: 2,
    risk: 3,
  };
  return [...opps].sort((a, b) => {
    const pa = priority[a.kind] ?? 99;
    const pb = priority[b.kind] ?? 99;
    if (pa !== pb) return pa - pb;
    return b.score - a.score;
  });
}

function round(x: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(x * f) / f;
}
