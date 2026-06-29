/**
 * In-memory cache of the latest ecosystem view.
 *
 * Refreshed by `refreshEcosystem()` (called on startup and on
 * POST /api/refresh). All API routes read from this cache.
 */

import type {
  AIInsight,
  Asset,
  EcosystemSnapshot,
  NarrativeStat,
  Opportunity,
  Pool,
  Trade,
} from "./models";

class IntelCache {
  assets: Asset[] = [];
  pools: Pool[] = [];
  trades: Trade[] = [];
  snapshot: EcosystemSnapshot | null = null;
  opportunities: Opportunity[] = [];
  narratives: NarrativeStat[] = [];
  narrativeBrief: AIInsight | null = null;
  sourceLabel: string = "SyntheticAdapter (sample data)";
  poolSourceLabel: string = "SyntheticAdapter (sample data)";
  lastRefreshed: string | null = null;

  reset() {
    this.assets = [];
    this.pools = [];
    this.trades = [];
    this.snapshot = null;
    this.opportunities = [];
    this.narratives = [];
    this.narrativeBrief = null;
    this.sourceLabel = "SyntheticAdapter (sample data)";
    this.poolSourceLabel = "SyntheticAdapter (sample data)";
    this.lastRefreshed = null;
  }
}

export const cache = new IntelCache();
