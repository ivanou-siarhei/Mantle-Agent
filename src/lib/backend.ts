/**
 * Backend API client for the Mantle Tokenized Equities Intelligence Agent.
 *
 * All requests go to Next.js API routes (no XTransformPort needed).
 */

// ---------------------------------------------------------------------------
// Types — mirror the TypeScript models in src/lib/intel/models.ts
// ---------------------------------------------------------------------------

export interface EcosystemSnapshot {
  timestamp: string;
  totalTvl: number;
  totalVolume: number;
  assetCount: number;
  poolCount: number;
  marketConcentration: number;
  largestInflows: { symbol: string; usd: number }[];
  largestOutflows: { symbol: string; usd: number }[];
}

export interface Asset {
  symbol: string;
  address: string;
  name: string;
  underlyingTicker: string;
  tvlUsd: number;
  volume24h: number;
  volume7d: number;
  price: number;
  referencePrice: number;
  premiumDiscount: number;
  liquidityScore: number;
  healthScore: number;
  growthScore: number;
  discoveredAt: string;
}

export interface Pool {
  address: string;
  assetSymbol: string;
  token0: string;
  token1: string;
  tvlUsd: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  volumeToTvl: number;
  healthScore: number;
  feeEfficiency: number;
  discoveredAt: string;
}

export interface AssetHistoryPoint {
  ts: string;
  tvlUsd: number;
  volume24h: number;
  price: number;
  premium: number;
  healthScore: number;
  liquidityScore: number;
  growthScore: number;
}

export interface PoolHistoryPoint {
  ts: string;
  tvlUsd: number;
  volume24h: number;
  fees24h: number;
  apr: number;
  volumeToTvl: number;
  healthScore: number;
}

export type OpportunityKind = "best_yield" | "hidden_gem" | "liquidity" | "risk";

export interface Opportunity {
  kind: OpportunityKind;
  title: string;
  assetSymbol: string | null;
  poolAddress: string | null;
  score: number;
  metrics: Record<string, number | string | string[]>;
  explanation: string;
}

export interface AIInsight {
  kind: string;
  title: string;
  body: string;
  bullets: string[];
  generatedAt: string;
  evidence: { metric: string; value: number | string }[];
}

export interface SnapshotRow {
  timestamp: string;
  totalTvl: number;
  totalVolume: number;
  assetCount: number;
  poolCount: number;
  marketConcentration: number;
}

export type NarrativeStage = "breaking_out" | "emerging" | "mainstream" | "cooling";

export interface NarrativeStat {
  narrative: string;
  mentions: number;
  mentionsPrior: number;
  deltaPct: number;
  reach: number;
  breadth: number;
  stage: NarrativeStage;
  sampleHeadlines: string[];
}
// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export const backend = {
  health() {
    return getJson<{ status: string; ts: string; llmAvailable?: boolean; llmLabel?: string }>("/api/health");
  },

  refresh() {
    return getJson<{
      refreshedAt: string;
      assets: number;
      pools: number;
      opportunities: number;
      tradesIndexed: number;
      narratives?: number;
    }>("/api/refresh", { method: "POST" });
  },

  overview() {
    return getJson<{
      snapshot: EcosystemSnapshot;
      topAssets: Asset[];
      topPools: Pool[];
      opportunityCounts: Record<string, number>;
      lastRefreshed: string | null;
    }>("/api/overview");
  },

  assets(limit = 50) {
    return getJson<{ assets: Asset[]; total: number }>(`/api/assets?limit=${limit}`);
  },

  assetDetail(symbol: string) {
    return getJson<{ asset: Asset; history: AssetHistoryPoint[] }>(
      `/api/assets/${encodeURIComponent(symbol)}`
    );
  },

  pools(limit = 50) {
    return getJson<{ pools: Pool[]; total: number; source?: string; live?: boolean }>(`/api/pools?limit=${limit}`);
  },

  poolDetail(address: string) {
    return getJson<{ pool: Pool; history: PoolHistoryPoint[] }>(
      `/api/pools/${encodeURIComponent(address)}`
    );
  },

  opportunities(kind?: string, limit = 20) {
    const q = new URLSearchParams();
    if (kind) q.set("kind", kind);
    q.set("limit", String(limit));
    return getJson<{ opportunities: Opportunity[]; total: number }>(
      `/api/opportunities?${q.toString()}`
    );
  },

  dailyBrief() {
    return getJson<AIInsight>("/api/insights/daily-brief");
  },

  healthSummary() {
    return getJson<AIInsight>("/api/insights/health");
  },

  opportunitySummary() {
    return getJson<AIInsight>("/api/insights/opportunities");
  },

  ask(question: string) {
    return getJson<AIInsight>("/api/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  },

  snapshots(limit = 168) {
    return getJson<{ snapshots: SnapshotRow[] }>(`/api/snapshots?limit=${limit}`);
  },

  narratives() {
    return getJson<{
      narratives: NarrativeStat[];
      brief: AIInsight | null;
      lookbackDays: number;
    }>("/api/narratives");
  },

  digest() {
    return getJson<{ markdown: string }>("/api/digest");
  },
};
