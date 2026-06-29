/**
 * Deterministic synthetic adapter — port of the Python SyntheticAdapter.
 *
 * Generates a varied universe of xStocks, Fluxion pools, swaps and RFQ
 * trades. The generator is seeded (per-asset, per-pool, per-session)
 * so the demo is reproducible while still "moving" between calls.
 *
 * Session cadence: 60 seconds. Values drift within a session using a
 * Gaussian random walk.
 */

import type { Asset, DiscoveryReport, Pool, Trade } from "./models";

// Seed universe — represents the known issuance universe of Backed
// Finance xStocks. The real adapter would discover this dynamically
// from the registry contract on Mantle; we keep it here so the demo
// always has data.
const SEED_EQUITIES: Array<[string, string, string, number]> = [
  ["NVDAx", "NVIDIA Corp", "NVDA", 178.42],
  ["TSLAx", "Tesla Inc", "TSLA", 248.5],
  ["AAPLx", "Apple Inc", "AAPL", 229.87],
  ["METAx", "Meta Platforms", "META", 567.43],
  ["MSFTx", "Microsoft Corp", "MSFT", 421.55],
  ["GOOGLx", "Alphabet Inc", "GOOGL", 175.28],
  ["AMZNx", "Amazon.com Inc", "AMZN", 186.34],
  ["MSTRx", "MicroStrategy", "MSTR", 1789.2],
  ["COINx", "Coinbase Global", "COIN", 245.71],
  ["AMDx", "Advanced Micro Devices", "AMD", 158.92],
];

export const STABLE_SYMBOL = "MNT";

const MASTER_SEED = 0x4d414e54; // "MANT"

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32 + seeded hash)
// ---------------------------------------------------------------------------

function seedFor(...parts: (string | number)[]): number {
  const raw = parts.map((p) => String(p)).join("|");
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Rng {
  private a: number;
  constructor(seed: number) {
    this.a = seed >>> 0;
  }
  next(): number {
    this.a = (this.a + 0x6d2b79f5) >>> 0;
    let t = this.a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // Standard normal via Box-Muller
  gauss(mean = 0, std = 1): number {
    const u1 = Math.max(this.next(), 1e-12);
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + std * z;
  }
  uniform(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }
  randint(lo: number, hi: number): number {
    return Math.floor(this.uniform(lo, hi + 1));
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  random(): number {
    return this.next();
  }
}

function assetRng(symbol: string): Rng {
  return new Rng(seedFor(MASTER_SEED, "asset", symbol));
}

function poolRng(address: string): Rng {
  return new Rng(seedFor(MASTER_SEED, "pool", address));
}

function sessionRng(): Rng {
  // Changes every 60 seconds so the demo "moves"
  const bucket = Math.floor(Date.now() / 60_000);
  return new Rng(seedFor(MASTER_SEED, "session", bucket));
}

function drift(base: number, vol: number, rng: Rng): number {
  return base * (1 + vol * rng.gauss(0, 1));
}

function sha256hex(s: string, len: number): string {
  // Simple FNV-1a hash → hex (deterministic, good enough for demo addresses)
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ (c + 0x9e), 2246822519) >>> 0;
  }
  let hex = (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
  // Stretch to required length by re-hashing
  while (hex.length < len) {
    h1 = Math.imul(h1 ^ hex.length, 16777619) >>> 0;
    hex += h1.toString(16).padStart(8, "0");
  }
  return hex.slice(0, len);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function discoverAssets(): { assets: Asset[]; report: DiscoveryReport } {
  const now = new Date().toISOString();
  const session = sessionRng();
  const assets: Asset[] = [];

  for (const [symbol, name, ticker, refPrice] of SEED_EQUITIES) {
    const rng = assetRng(symbol);
    const baseTvl = rng.uniform(180_000, 4_500_000);
    const baseVol24h = rng.uniform(40_000, 1_200_000);

    const tvl = drift(baseTvl, 0.04, session);
    const vol24h = drift(baseVol24h, 0.1, session);
    const vol7d = vol24h * rng.uniform(5.8, 7.6);

    const price = drift(refPrice, 0.015, session);
    const premiumDiscount = session.gauss(0, 0.6);

    // RFQ bid/ask spread (bps): thinner RFQ depth → wider spread.
    // tvlUsd here represents the RFQ-quoted depth available via the market maker.
    const depthFrac = Math.max(
      0,
      Math.min(1, (Math.log10(1 + tvl) - Math.log10(180_000)) / (Math.log10(4_500_000) - Math.log10(180_000)))
    );
    const spreadBps = Math.round(
      Math.max(6, Math.min(120, 14 + (1 - depthFrac) * 70 + session.gauss(0, 4)))
    );

    const address = "0x" + sha256hex(`${symbol}|mantle`, 40);

    assets.push({
      symbol,
      address,
      name,
      underlyingTicker: ticker,
      tvlUsd: round(tvl, 2),
      volume24h: round(vol24h, 2),
      volume7d: round(vol7d, 2),
      price: round(price, 4),
      referencePrice: refPrice,
      premiumDiscount: round(premiumDiscount, 3),
      liquidityScore: 0,
      healthScore: 0,
      growthScore: 0,
      discoveredAt: now,
      // xStocks equities settle via Atomic RFQ (xChange) — issuer-direct quotes,
      // not AMM pools. See README § "Tokenized equities are RFQ, not pools".
      venue: "Atomic RFQ (xChange)",
      spreadBps,
    });
  }

  return {
    assets,
    report: {
      source: "synthetic",
      assetCount: assets.length,
      poolCount: 0,
      tradeCount: 0,
      errors: [],
      fallbackUsed: true,
    },
  };
}

// Synthetic FALLBACK pools — realistic *generic* Fluxion AMM pairs (regular
// crypto pools, NOT tokenized equities). Used only when the live DefiLlama
// yields feed is unreachable. The TVL distribution roughly mirrors the real
// Fluxion tokenized-equity pools (~$2.2M). The Pools lens tracks ONLY
// tokenized-equity AMM pools (each xStock quoted in USDC); crypto-only pairs
// are intentionally excluded to keep the agent focused on tokenized equities.
const SEED_POOLS: Array<[string, string, number, number]> = [
  // [token0, token1, baseTvlUsd, baseApyPct] — tokenized equity quoted in USDC.
  // TVLs anchored to real Fluxion scale (NVDAx-USDC ≈ $105K observed on-DEX).
  // These are SAMPLE numbers for offline mode; live mode pulls exact TVL from
  // DefiLlama. Sizes are kept in the realistic ~$10K–$110K per-pool range.
  ["NVDAx", "USDC", 105_180, 9.2],
  ["TSLAx", "USDC", 96_000, 7.8],
  ["AAPLx", "USDC", 78_000, 6.4],
  ["METAx", "USDC", 61_000, 5.5],
  ["MSFTx", "USDC", 54_000, 4.9],
  ["GOOGLx", "USDC", 43_000, 5.1],
  ["AMZNx", "USDC", 37_000, 4.3],
  ["COINx", "USDC", 31_000, 8.7],
  ["MSTRx", "USDC", 22_000, 11.2],
  ["AMDx", "USDC", 14_000, 6.0],
];

export function discoverSyntheticPools(): { pools: Pool[]; report: DiscoveryReport } {
  const now = new Date().toISOString();
  const session = sessionRng();
  const pools: Pool[] = [];
  const feeTier = 0.003;

  for (const [token0, token1, baseTvl, baseApy] of SEED_POOLS) {
    const symbol = `${token0}-${token1}`;
    const address = "0x" + sha256hex(`${symbol}|pool|fluxion`, 40);
    const rng = poolRng(address);

    const tvlUsd = drift(baseTvl * rng.uniform(0.9, 1.1), 0.03, session);
    // Derive fees from the intended APY so analytics' recomputed APR is stable.
    const apyDrift = Math.max(0, drift(baseApy, 0.05, session));
    const fees24h = (tvlUsd * (apyDrift / 100)) / 365;
    const volume24h = fees24h / feeTier;
    const apr = tvlUsd > 0 ? (fees24h * 365) / tvlUsd * 100 : 0;

    pools.push({
      address,
      assetSymbol: symbol,
      token0,
      token1,
      tvlUsd: round(tvlUsd, 2),
      volume24h: round(volume24h, 2),
      fees24h: round(fees24h, 2),
      apr: round(apr, 2),
      volumeToTvl: tvlUsd > 0 ? round(volume24h / tvlUsd, 4) : 0,
      healthScore: 0,
      feeEfficiency: 0,
      discoveredAt: now,
      source: "SyntheticAdapter (sample data)",
      live: false,
    });
  }

  return {
    pools,
    report: {
      source: "synthetic",
      assetCount: 0,
      poolCount: pools.length,
      tradeCount: 0,
      errors: [],
      fallbackUsed: true,
    },
  };
}

export function discoverSwaps(
  pools: Pool[],
  assets: Asset[],
  lookbackHours = 24
): { trades: Trade[]; report: DiscoveryReport } {
  const session = sessionRng();
  const assetBySymbol = new Map(assets.map((a) => [a.symbol, a]));
  const trades: Trade[] = [];
  const now = Date.now();

  for (const pool of pools) {
    const nSwaps = Math.max(0, Math.floor(session.gauss(120, 60)));
    const sampleN = Math.min(nSwaps, 25);
    for (let i = 0; i < sampleN; i++) {
      const ts = new Date(now - session.uniform(0, lookbackHours * 3600_000)).toISOString();
      const amount = Math.exp(session.gauss(8.5, 1.3));
      const asset = assetBySymbol.get(pool.assetSymbol);
      const price = (asset?.price ?? 100) * (1 + session.gauss(0, 0.002));
      const txSeed = sha256hex(`${pool.address}|${i}|${ts}`, 64);
      trades.push({
        txHash: "0x" + txSeed,
        assetSymbol: pool.assetSymbol,
        poolAddress: pool.address,
        amountUsd: round(amount, 2),
        price: round(price, 4),
        timestamp: ts,
        kind: "swap",
      });
    }
  }

  return {
    trades,
    report: {
      source: "synthetic",
      assetCount: 0,
      poolCount: 0,
      tradeCount: trades.length,
      errors: [],
      fallbackUsed: true,
    },
  };
}

export function discoverRfqTrades(
  assets: Asset[],
  lookbackHours = 24
): { trades: Trade[]; report: DiscoveryReport } {
  const session = sessionRng();
  const trades: Trade[] = [];
  const now = Date.now();

  for (const asset of assets) {
    if (session.random() < 0.4) continue;
    const n = session.randint(1, 4);
    for (let i = 0; i < n; i++) {
      const ts = new Date(now - session.uniform(0, lookbackHours * 3600_000)).toISOString();
      const amount = session.uniform(25_000, 800_000);
      const price = asset.price * (1 + session.gauss(0, 0.001));
      const txSeed = sha256hex(`rfq|${asset.symbol}|${i}|${ts}`, 64);
      trades.push({
        txHash: "0x" + txSeed,
        assetSymbol: asset.symbol,
        poolAddress: null,
        amountUsd: round(amount, 2),
        price: round(price, 4),
        timestamp: ts,
        kind: "rfq",
      });
    }
  }

  return {
    trades,
    report: {
      source: "synthetic-rfq",
      assetCount: 0,
      poolCount: 0,
      tradeCount: trades.length,
      errors: [],
      fallbackUsed: true,
    },
  };
}

function round(x: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(x * f) / f;
}

// ---------------------------------------------------------------------------
// Narrative Radar — synthetic social / ecosystem chatter (Lens 2)
// ---------------------------------------------------------------------------

import type { NarrativePost } from "./models";

const POST_SOURCES = ["X", "blog", "Discord", "onchain"];

// Seed post templates (text only; the classifier — rule-based or LLM —
// assigns the narrative downstream, so realistic text is exercised).
const POST_TEMPLATES: Array<[string, string]> = [
  ["AI agents / x402", "New ERC-8004 agent shipped on Mantle — autonomous x402 payments are live"],
  ["AI agents / x402", "QuestFlow agent scaffold makes building agentic apps on Mantle trivial"],
  ["AI agents / x402", "x402 HTTP-402 micropayments are the missing primitive for AI agents"],
  ["AI agents / x402", "Agentic finance is coming to Mantle faster than anyone expected"],
  ["Tokenized equities", "SPCXx tokenized SpaceX now trading on Fluxion + Merchant Moe"],
  ["Tokenized equities", "xStocks brings TSLAx, NVDAx, AAPLx onchain via Mantle"],
  ["RFQ / deep liquidity", "Atomic RFQ on Fluxion brings institutional-grade liquidity to xStocks"],
  ["Restaking / mETH", "mETH restaking yields tick up as TVL grows"],
  ["Other", "Mantle ecosystem grant program round 3 announced"],
];

export function discoverPosts(): { current: NarrativePost[]; prior: NarrativePost[] } {
  const now = Date.now();

  const gen = (periodSeed: string, hoursAgoBase: number, boost: number): NarrativePost[] => {
    const rng = new Rng(seedFor(MASTER_SEED, "posts", periodSeed, Math.floor(now / 600_000)));
    const posts: NarrativePost[] = [];
    for (const [label, text] of POST_TEMPLATES) {
      const base = label === "AI agents / x402" ? 1.2 * boost : 1.0;
      const n = Math.max(0, Math.round(rng.gauss(base, 0.7)));
      for (let i = 0; i < n; i++) {
        const source = rng.choice(POST_SOURCES);
        const reach = Math.round(Math.exp(rng.gauss(11.0, 1.4)));
        const ts = new Date(now - (hoursAgoBase + rng.uniform(0, 84)) * 3600_000).toISOString();
        posts.push({
          id: "post_" + sha256hex(`${periodSeed}|${label}|${i}|${ts}`, 16),
          source,
          author: "@" + sha256hex(`${label}|${i}|${source}`, 6),
          text,
          narrative: label, // placeholder; re-assigned by classifyPosts
          reach,
          timestamp: ts,
        });
      }
    }
    return posts;
  };

  // Current period over-weights "AI agents / x402" so it breaks out vs prior.
  const current = gen("current", 0, 2.4);
  const prior = gen("prior", 168, 1.0);
  return { current, prior };
}
