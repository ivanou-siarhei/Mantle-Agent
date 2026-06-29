/**
 * Analytics — health scoring & metrics.
 * Direct port of backend/analytics/health.py.
 *
 * Principle 3 (Python owns all calculations) is preserved in spirit:
 * all derived metrics live here, never in the data layer.
 */

import type { Asset, Pool } from "./models";

function clip(x: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, x));
}

function logScale(x: number): number {
  if (x <= 0) return 0;
  return Math.log10(1 + x);
}

function minmax(x: number, refLow: number, refHigh: number): number {
  if (refHigh <= refLow) return 0;
  return (x - refLow) / (refHigh - refLow);
}

// ---------------------------------------------------------------------------
// Asset sub-scores
// ---------------------------------------------------------------------------

export function liquidityScore(
  tvlUsd: number,
  refLow = 50_000,
  refHigh = 5_000_000
): number {
  const raw = minmax(logScale(tvlUsd), logScale(refLow), logScale(refHigh));
  return clip(raw * 100);
}

export function growthScore(volume24h: number, volume7d: number): number {
  if (volume7d <= 0) return 0;
  const dailyAvg7d = volume7d / 7;
  if (dailyAvg7d <= 0) return 0;
  const ratio = volume24h / dailyAvg7d;
  return clip(minmax(ratio, 0.5, 2.0) * 100);
}

export function spreadQualityScore(premiumAbs: number): number {
  // 0% deviation → 100, 3% deviation → 0
  return clip(100 - minmax(premiumAbs, 0, 3) * 100);
}

export function stabilityScore(premiumAbs: number): number {
  return spreadQualityScore(premiumAbs);
}

export interface AssetHealthBreakdown {
  score: number;
  liquidity: number;
  volume: number;
  spread: number;
  inflows: number;
  stability: number;
}

export function assetHealthScore(params: {
  tvlUsd: number;
  volume24h: number;
  premiumDiscountAbs: number;
  growth: number;
  capitalInflowPct?: number;
}): AssetHealthBreakdown {
  const liq = liquidityScore(params.tvlUsd);
  const vol = clip(
    minmax(logScale(params.volume24h), logScale(1_000), logScale(2_000_000)) * 100
  );
  const spread = spreadQualityScore(params.premiumDiscountAbs);
  const inflow = clip(minmax(params.capitalInflowPct ?? 0, -10, 30) * 100);
  const stab = stabilityScore(params.premiumDiscountAbs);

  const weights = {
    liquidity: 0.3,
    volume: 0.25,
    spread: 0.15,
    inflows: 0.15,
    stability: 0.15,
  };
  const score = clip(
    liq * weights.liquidity +
      vol * weights.volume +
      spread * weights.spread +
      inflow * weights.inflows +
      stab * weights.stability
  );
  return { score, liquidity: liq, volume: vol, spread, inflows: inflow, stability: stab };
}

// ---------------------------------------------------------------------------
// Pool sub-scores
// ---------------------------------------------------------------------------

export function yieldSustainabilityScore(apr: number): number {
  if (apr <= 0) return 0;
  if (apr < 10) return clip(apr * 10);
  if (apr <= 80) return 100;
  return clip(Math.max(0, 100 - (apr - 80) * 0.5));
}

export function capitalRetentionScore(tvlChangePct: number): number {
  return clip(minmax(tvlChangePct, -20, 30) * 100);
}

export function feeEfficiencyScore(fees24h: number, tvlUsd: number): number {
  if (tvlUsd <= 0) return 0;
  const dailyYield = fees24h / tvlUsd;
  return clip(minmax(dailyYield, 0, 0.001) * 100);
}

export interface PoolHealthBreakdown {
  score: number;
  liquidity: number;
  fees: number;
  volume: number;
  yield: number;
  retention: number;
}

export function poolHealthScore(params: {
  tvlUsd: number;
  fees24h: number;
  volume24h: number;
  apr: number;
  tvlChangePct?: number;
}): PoolHealthBreakdown {
  const liq = liquidityScore(params.tvlUsd);
  const feeEff = feeEfficiencyScore(params.fees24h, params.tvlUsd);
  const vol = clip(
    minmax(logScale(params.volume24h), logScale(1_000), logScale(2_000_000)) * 100
  );
  const yld = yieldSustainabilityScore(params.apr);
  const retention = capitalRetentionScore(params.tvlChangePct ?? 0);

  const weights = {
    liquidity: 0.25,
    fees: 0.25,
    volume: 0.2,
    yield: 0.15,
    retention: 0.15,
  };
  const score = clip(
    liq * weights.liquidity +
      feeEff * weights.fees +
      vol * weights.volume +
      yld * weights.yield +
      retention * weights.retention
  );
  return { score, liquidity: liq, fees: feeEff, volume: vol, yield: yld, retention };
}

// ---------------------------------------------------------------------------
// Per-asset / per-pool metric computation
// ---------------------------------------------------------------------------

export function computeAssetMetrics(
  asset: Asset,
  history?: Array<{ tvlUsd?: number }>
): Asset {
  const premiumAbs = Math.abs(asset.premiumDiscount);

  let inflowPct = 0;
  if (history && history.length >= 2) {
    const prevTvl = history[history.length - 2]?.tvlUsd ?? 0;
    if (prevTvl > 0) {
      inflowPct = ((asset.tvlUsd - prevTvl) / prevTvl) * 100;
    }
  }

  const growth = growthScore(asset.volume24h, asset.volume7d);
  const liq = liquidityScore(asset.tvlUsd);
  const health = assetHealthScore({
    tvlUsd: asset.tvlUsd,
    volume24h: asset.volume24h,
    premiumDiscountAbs: premiumAbs,
    growth,
    capitalInflowPct: inflowPct,
  });

  return {
    ...asset,
    liquidityScore: round(liq, 2),
    growthScore: round(growth, 2),
    healthScore: round(health.score, 2),
    premiumDiscount:
      asset.referencePrice > 0
        ? round(
            ((asset.price - asset.referencePrice) / asset.referencePrice) * 100,
            3
          )
        : asset.premiumDiscount,
  };
}

export function computePoolMetrics(
  pool: Pool,
  history?: Array<{ tvlUsd?: number }>
): Pool {
  let tvlChangePct = 0;
  if (history && history.length >= 2) {
    const prevTvl = history[history.length - 2]?.tvlUsd ?? 0;
    if (prevTvl > 0) {
      tvlChangePct = ((pool.tvlUsd - prevTvl) / prevTvl) * 100;
    }
  }

  // Live DefiLlama pools report a real (total) APY that may include reward APR
  // beyond swap fees — preserve it. Synthetic pools recompute APR from fees.
  const apr = pool.live
    ? pool.apr
    : pool.tvlUsd > 0 ? (pool.fees24h * 365) / pool.tvlUsd * 100 : 0;
  const health = poolHealthScore({
    tvlUsd: pool.tvlUsd,
    fees24h: pool.fees24h,
    volume24h: pool.volume24h,
    apr,
    tvlChangePct,
  });

  return {
    ...pool,
    apr: round(apr, 2),
    volumeToTvl: pool.tvlUsd > 0 ? round(pool.volume24h / pool.tvlUsd, 4) : 0,
    healthScore: round(health.score, 2),
    feeEfficiency: round(health.fees, 2),
  };
}

export function rankAssetsByHealth(assets: Asset[]): Asset[] {
  return [...assets].sort((a, b) => b.healthScore - a.healthScore);
}

export function rankPoolsByHealth(pools: Pool[]): Pool[] {
  return [...pools].sort((a, b) => b.healthScore - a.healthScore);
}

// ---------------------------------------------------------------------------
// Ecosystem-level
// ---------------------------------------------------------------------------

export function computeConcentration(tvlByAsset: number[]): number {
  const total = tvlByAsset.reduce((s, v) => s + v, 0);
  if (total <= 0 || tvlByAsset.length === 0) return 0;
  const shares = tvlByAsset.map((v) => v / total);
  return Math.min(1, shares.reduce((s, sh) => s + sh * sh, 0));
}

export function buildEcosystemSnapshot(
  assets: Asset[],
  pools: Pool[],
  trades: Trade[]
): EcosystemSnapshot {
  // Ecosystem TVL / volume are the REAL on-chain AMM pool figures (Fluxion via
  // DefiLlama when live). Equities trade via RFQ and are NOT pooled, so they
  // are intentionally excluded from ecosystem TVL. Fall back to asset figures
  // only if no pools are present.
  const totalTvl = pools.length > 0
    ? pools.reduce((s, p) => s + p.tvlUsd, 0)
    : assets.reduce((s, a) => s + a.tvlUsd, 0);
  const totalVolume = pools.length > 0
    ? pools.reduce((s, p) => s + p.volume24h, 0)
    : assets.reduce((s, a) => s + a.volume24h, 0);
  const concentration = pools.length > 0
    ? computeConcentration(pools.map((p) => p.tvlUsd))
    : computeConcentration(assets.map((a) => a.tvlUsd));

  const buyVolume = new Map<string, number>();
  const sellVolume = new Map<string, number>();
  for (const t of trades) {
    buyVolume.set(t.assetSymbol, (buyVolume.get(t.assetSymbol) ?? 0) + t.amountUsd * 0.6);
    sellVolume.set(t.assetSymbol, (sellVolume.get(t.assetSymbol) ?? 0) + t.amountUsd * 0.4);
  }
  const net = new Map<string, number>();
  for (const a of assets) {
    net.set(a.symbol, (buyVolume.get(a.symbol) ?? 0) - (sellVolume.get(a.symbol) ?? 0));
  }
  const inflows = [...net.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .filter(([, v]) => v > 0)
    .map(([symbol, v]) => ({ symbol, usd: round(v, 2) }));
  const outflows = [...net.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .filter(([, v]) => v < 0)
    .map(([symbol, v]) => ({ symbol, usd: round(Math.abs(v), 2) }));

  return {
    timestamp: new Date().toISOString(),
    totalTvl: round(totalTvl, 2),
    totalVolume: round(totalVolume, 2),
    assetCount: assets.length,
    poolCount: pools.length,
    marketConcentration: round(concentration, 4),
    largestInflows: inflows,
    largestOutflows: outflows,
  };
}

// Need to import Trade type for buildEcosystemSnapshot
import type { EcosystemSnapshot, Trade } from "./models";

function round(x: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(x * f) / f;
}
