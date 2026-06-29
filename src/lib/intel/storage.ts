/**
 * Storage layer — Prisma-based persistence for snapshots, asset/pool
 * time series, trades, opportunities and AI summaries.
 *
 * Mirrors backend/storage/__init__.py.
 */

import { db } from "@/lib/db";
import type {
  AIInsight,
  Asset,
  EcosystemSnapshot,
  Opportunity,
  Pool,
  Trade,
} from "./models";

// ---------------------------------------------------------------------------
// Writers
// ---------------------------------------------------------------------------

export async function writeSnapshot(snap: EcosystemSnapshot): Promise<number> {
  const r = await db.snapshot.create({
    data: {
      ts: new Date(snap.timestamp),
      totalTvl: snap.totalTvl,
      totalVolume: snap.totalVolume,
      assetCount: snap.assetCount,
      poolCount: snap.poolCount,
      concentration: snap.marketConcentration,
      payload: JSON.stringify(snap),
    },
  });
  return r.id;
}

export async function writeAssetSeries(
  assets: Asset[],
  ts: Date = new Date()
): Promise<void> {
  if (assets.length === 0) return;
  await db.assetSeries.createMany({
    data: assets.map((a) => ({
      ts,
      symbol: a.symbol,
      address: a.address,
      tvlUsd: a.tvlUsd,
      volume24h: a.volume24h,
      price: a.price,
      premium: a.premiumDiscount,
      healthScore: a.healthScore,
      liquidityScore: a.liquidityScore,
      growthScore: a.growthScore,
    })),
  });
}

export async function writePoolSeries(
  pools: Pool[],
  ts: Date = new Date()
): Promise<void> {
  if (pools.length === 0) return;
  await db.poolSeries.createMany({
    data: pools.map((p) => ({
      ts,
      address: p.address,
      assetSymbol: p.assetSymbol,
      tvlUsd: p.tvlUsd,
      volume24h: p.volume24h,
      fees24h: p.fees24h,
      apr: p.apr,
      volumeToTvl: p.volumeToTvl,
      healthScore: p.healthScore,
    })),
  });
}

export async function writeTrades(trades: Trade[]): Promise<number> {
  if (trades.length === 0) return 0;
  // SQLite UNIQUE on txHash — skip duplicates
  let count = 0;
  for (const t of trades) {
    try {
      await db.trade.create({
        data: {
          ts: new Date(t.timestamp),
          txHash: t.txHash,
          assetSymbol: t.assetSymbol,
          poolAddress: t.poolAddress,
          amountUsd: t.amountUsd,
          price: t.price,
          kind: t.kind,
        },
      });
      count++;
    } catch {
      // duplicate txHash — skip
    }
  }
  return count;
}

export async function writeOpportunities(
  opps: Opportunity[],
  ts: Date = new Date()
): Promise<void> {
  if (opps.length === 0) return;
  await db.opportunityLog.createMany({
    data: opps.map((o) => ({
      ts,
      kind: o.kind,
      title: o.title,
      payload: JSON.stringify(o),
    })),
  });
}

export async function writeAiSummary(insight: AIInsight): Promise<number> {
  const r = await db.aiSummary.create({
    data: {
      ts: new Date(insight.generatedAt),
      kind: insight.kind,
      title: insight.title,
      body: insight.body,
      bullets: JSON.stringify(insight.bullets),
      evidence: JSON.stringify(insight.evidence),
    },
  });
  return r.id;
}

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

export async function listSnapshots(limit = 168): Promise<EcosystemSnapshot[]> {
  const rows = await db.snapshot.findMany({
    orderBy: { ts: "desc" },
    take: limit,
  });
  return rows.map((r) => JSON.parse(r.payload) as EcosystemSnapshot);
}

export async function latestSnapshot(): Promise<EcosystemSnapshot | null> {
  const rows = await listSnapshots(1);
  return rows[0] ?? null;
}

export async function listAssetHistory(
  symbol: string,
  limit = 168
): Promise<Array<{ ts: string; tvlUsd: number; volume24h: number; price: number; premium: number; healthScore: number; liquidityScore: number; growthScore: number }>> {
  const rows = await db.assetSeries.findMany({
    where: { symbol },
    orderBy: { ts: "desc" },
    take: limit,
  });
  return rows
    .reverse()
    .map((r) => ({
      ts: r.ts.toISOString(),
      tvlUsd: r.tvlUsd,
      volume24h: r.volume24h,
      price: r.price,
      premium: r.premium,
      healthScore: r.healthScore,
      liquidityScore: r.liquidityScore,
      growthScore: r.growthScore,
    }));
}

export async function listPoolHistory(
  address: string,
  limit = 168
): Promise<Array<{ ts: string; tvlUsd: number; volume24h: number; fees24h: number; apr: number; volumeToTvl: number; healthScore: number }>> {
  const rows = await db.poolSeries.findMany({
    where: { address },
    orderBy: { ts: "desc" },
    take: limit,
  });
  return rows
    .reverse()
    .map((r) => ({
      ts: r.ts.toISOString(),
      tvlUsd: r.tvlUsd,
      volume24h: r.volume24h,
      fees24h: r.fees24h,
      apr: r.apr,
      volumeToTvl: r.volumeToTvl,
      healthScore: r.healthScore,
    }));
}

export async function previousSnapshot(): Promise<EcosystemSnapshot | null> {
  const rows = await listSnapshots(2);
  return rows[1] ?? null;
}
