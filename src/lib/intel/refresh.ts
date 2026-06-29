/**
 * Refresh pipeline — orchestrates discovery → analytics → opportunities
 * → narrative radar → persistence. Server-side only.
 */

import {
  discoverAssets,
  discoverSyntheticPools,
  discoverPosts,
  discoverRfqTrades,
  discoverSwaps,
} from "./synthetic";
import {
  buildEcosystemSnapshot,
  computeAssetMetrics,
  computePoolMetrics,
  rankAssetsByHealth,
  rankPoolsByHealth,
} from "./analytics";
import { detectOpportunities } from "./opportunities";
import {
  buildNarrativeRadar,
  classifyPosts,
  computeNarrativeStats,
} from "./narrative";
import { llmAvailable, rewriteInsight } from "./llm";
import { fetchLivePools } from "./live";
import { cache } from "./cache";
import {
  listAssetHistory,
  listPoolHistory,
  previousSnapshot,
  writeAssetSeries,
  writeOpportunities,
  writePoolSeries,
  writeSnapshot,
  writeTrades,
} from "./storage";
import type { Asset, Pool } from "./models";

export type RefreshResult = {
  refreshedAt: string;
  assets: number;
  pools: number;
  opportunities: number;
  tradesIndexed: number;
  narratives: number;
  source: string;
};

// Single-flight guard. In Next dev (and under bursty traffic) several API
// routes can call refreshEcosystem() concurrently on first load. SQLite allows
// only ONE writer, so parallel refreshes serialize and then trip Prisma's
// "Socket timeout (the database failed to respond...)". Deduping to a single
// in-flight run removes the contention.
let refreshInFlight: Promise<RefreshResult> | null = null;

export function refreshEcosystem(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function runRefresh(): Promise<RefreshResult> {
  // 1. Discovery
  //    - Equities: RFQ instruments (Atomic RFQ / xChange) — issuer-direct quotes,
  //      NOT AMM pools. Modeled sample data (no public per-asset RFQ feed).
  //    - Pools: REAL Fluxion AMM pools via DefiLlama yields (no key); falls back
  //      to generic synthetic crypto-pair pools if the feed is unreachable.
  const { assets } = discoverAssets();

  const livePools = await fetchLivePools();
  const pools = livePools.live ? livePools.pools : discoverSyntheticPools().pools;
  const poolSource = livePools.live ? livePools.source : "SyntheticAdapter (sample data)";
  cache.sourceLabel = poolSource;
  cache.poolSourceLabel = poolSource;

  const { trades: swaps } = discoverSwaps(pools, assets, 24);
  const { trades: rfq } = discoverRfqTrades(assets, 24);
  const trades = [...swaps, ...rfq];

  // 2. Analytics — enrich with computed scores (use history if available).
  //    Equities are NOT scaled to pool TVL: their depth is RFQ depth, distinct
  //    from on-chain AMM TVL.
  const enrichedAssets: Asset[] = [];
  for (const a of assets) {
    const history = await listAssetHistory(a.symbol, 168);
    enrichedAssets.push(computeAssetMetrics(a, history));
  }
  const enrichedPools: Pool[] = [];
  for (const p of pools) {
    const history = await listPoolHistory(p.address, 168);
    enrichedPools.push(computePoolMetrics(p, history));
  }

  // 3. Ecosystem snapshot & opportunities (TVL/volume from REAL pools)
  const snapshot = buildEcosystemSnapshot(enrichedAssets, enrichedPools, trades);
  const opps = detectOpportunities(enrichedPools, enrichedAssets);

  // 4. Narrative Radar (Lens 2) — classify chatter, compute momentum
  const useLlm = llmAvailable();
  const { current, prior } = discoverPosts();
  const [classifiedCurrent, classifiedPrior] = await Promise.all([
    classifyPosts(current, useLlm),
    classifyPosts(prior, useLlm),
  ]);
  const narratives = computeNarrativeStats(classifiedCurrent, classifiedPrior);
  const narrativeBrief = await rewriteInsight(buildNarrativeRadar(narratives));

  // 5. Persist
  await writeSnapshot(snapshot);
  await writeAssetSeries(enrichedAssets, new Date(snapshot.timestamp));
  await writePoolSeries(enrichedPools, new Date(snapshot.timestamp));
  await writeTrades(trades);
  await writeOpportunities(opps, new Date(snapshot.timestamp));

  // 6. Update cache (sorted)
  cache.assets = rankAssetsByHealth(enrichedAssets);
  cache.pools = rankPoolsByHealth(enrichedPools);
  cache.trades = trades;
  cache.snapshot = snapshot;
  cache.opportunities = opps;
  cache.narratives = narratives;
  cache.narrativeBrief = narrativeBrief;
  cache.lastRefreshed = new Date().toISOString();

  return {
    refreshedAt: cache.lastRefreshed,
    assets: cache.assets.length,
    pools: cache.pools.length,
    opportunities: cache.opportunities.length,
    tradesIndexed: trades.length,
    narratives: cache.narratives.length,
    source: cache.sourceLabel,
  };
}

export async function ensureLoaded(): Promise<void> {
  if (cache.snapshot === null) {
    await refreshEcosystem();
  }
}

export { previousSnapshot };
