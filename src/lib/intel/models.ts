/**
 * Data models — TypeScript mirror of the Python Pydantic models.
 * Used across the data, analytics, opportunity and AI layers.
 */

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
  premiumDiscount: number; // % vs reference
  liquidityScore: number; // 0-100
  healthScore: number; // 0-100
  growthScore: number; // 0-100
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
  healthScore: number; // 0-100
  feeEfficiency: number;
  discoveredAt: string;
}

export type TradeKind = "swap" | "rfq" | "mint" | "burn" | "collect";

export interface Trade {
  txHash: string;
  assetSymbol: string;
  poolAddress: string | null;
  amountUsd: number;
  price: number;
  timestamp: string;
  kind: TradeKind;
}

export interface EcosystemSnapshot {
  timestamp: string;
  totalTvl: number;
  totalVolume: number;
  assetCount: number;
  poolCount: number;
  marketConcentration: number; // 0-1
  largestInflows: { symbol: string; usd: number }[];
  largestOutflows: { symbol: string; usd: number }[];
}

export type OpportunityKind = "best_yield" | "hidden_gem" | "liquidity" | "risk";

export interface Opportunity {
  kind: OpportunityKind;
  title: string;
  assetSymbol: string | null;
  poolAddress: string | null;
  score: number; // 0-100
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

export interface DiscoveryReport {
  source: string;
  assetCount: number;
  poolCount: number;
  tradeCount: number;
  errors: string[];
  fallbackUsed: boolean;
}

// ---------------------------------------------------------------------------
// Narrative Radar (Lens 2)
// ---------------------------------------------------------------------------

export type NarrativeStage = "breaking_out" | "emerging" | "mainstream" | "cooling";

export interface NarrativePost {
  id: string;
  source: string; // "X" | "blog" | "Discord" | "onchain"
  author: string;
  text: string;
  narrative: string; // assigned label (NARRATIVES)
  reach: number; // estimated impressions
  timestamp: string;
}

export interface NarrativeStat {
  narrative: string;
  mentions: number;
  mentionsPrior: number;
  deltaPct: number; // momentum vs prior period
  reach: number; // total estimated reach
  breadth: number; // distinct sources
  stage: NarrativeStage;
  sampleHeadlines: string[];
}
