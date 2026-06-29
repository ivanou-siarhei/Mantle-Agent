/**
 * Refresh pipeline — orchestrates discovery → analytics → opportunities
 * → narrative radar → persistence. Server-side only.
 */

import {
  discoverAssets,
  discoverPools,
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

export async function refreshEcosystem(): Promise<{
  refreshedAt: string;
  assets: number;
  pools: number;
  opportunities: number;
  tradesIndexed: number;
  narratives: number;
}> {
  // 1. Discovery (synthetic — fast & reliable for demo)
  const { assets } = discoverAssets();
  const { pools } = discoverPools(assets);
  const { trades: swaps } = discoverSwaps(pools, assets, 24);
  const { trades: rfq } = discoverRfqTrades(assets, 24);
  const trades = [...swaps, ...rfq];

  // 2. Analytics — enrich with computed scores (use history if available)
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

  // 3. Ecosystem snapshot & opportunities
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
  };
}

export async function ensureLoaded(): Promise<void> {
  if (cache.snapshot === null) {
    await refreshEcosystem();
  }
}

export { previousSnapshot };
