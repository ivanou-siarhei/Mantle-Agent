module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/intel/cache.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * In-memory cache of the latest ecosystem view.
 *
 * Refreshed by `refreshEcosystem()` (called on startup and on
 * POST /api/refresh). All API routes read from this cache.
 */ __turbopack_context__.s([
    "cache",
    ()=>cache
]);
class IntelCache {
    assets = [];
    pools = [];
    trades = [];
    snapshot = null;
    opportunities = [];
    narratives = [];
    narrativeBrief = null;
    sourceLabel = "SyntheticAdapter (sample data)";
    poolSourceLabel = "SyntheticAdapter (sample data)";
    lastRefreshed = null;
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
const cache = new IntelCache();
}),
"[project]/src/lib/intel/synthetic.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Deterministic synthetic adapter — port of the Python SyntheticAdapter.
 *
 * Generates a varied universe of xStocks, Fluxion pools, swaps and RFQ
 * trades. The generator is seeded (per-asset, per-pool, per-session)
 * so the demo is reproducible while still "moving" between calls.
 *
 * Session cadence: 60 seconds. Values drift within a session using a
 * Gaussian random walk.
 */ __turbopack_context__.s([
    "STABLE_SYMBOL",
    ()=>STABLE_SYMBOL,
    "discoverAssets",
    ()=>discoverAssets,
    "discoverPosts",
    ()=>discoverPosts,
    "discoverRfqTrades",
    ()=>discoverRfqTrades,
    "discoverSwaps",
    ()=>discoverSwaps,
    "discoverSyntheticPools",
    ()=>discoverSyntheticPools
]);
// Seed universe — represents the known issuance universe of Backed
// Finance xStocks. The real adapter would discover this dynamically
// from the registry contract on Mantle; we keep it here so the demo
// always has data.
const SEED_EQUITIES = [
    [
        "NVDAx",
        "NVIDIA Corp",
        "NVDA",
        178.42
    ],
    [
        "TSLAx",
        "Tesla Inc",
        "TSLA",
        248.5
    ],
    [
        "AAPLx",
        "Apple Inc",
        "AAPL",
        229.87
    ],
    [
        "METAx",
        "Meta Platforms",
        "META",
        567.43
    ],
    [
        "MSFTx",
        "Microsoft Corp",
        "MSFT",
        421.55
    ],
    [
        "GOOGLx",
        "Alphabet Inc",
        "GOOGL",
        175.28
    ],
    [
        "AMZNx",
        "Amazon.com Inc",
        "AMZN",
        186.34
    ],
    [
        "MSTRx",
        "MicroStrategy",
        "MSTR",
        1789.2
    ],
    [
        "COINx",
        "Coinbase Global",
        "COIN",
        245.71
    ],
    [
        "AMDx",
        "Advanced Micro Devices",
        "AMD",
        158.92
    ]
];
const STABLE_SYMBOL = "MNT";
const MASTER_SEED = 0x4d414e54; // "MANT"
// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32 + seeded hash)
// ---------------------------------------------------------------------------
function seedFor(...parts) {
    const raw = parts.map((p)=>String(p)).join("|");
    let h = 2166136261;
    for(let i = 0; i < raw.length; i++){
        h ^= raw.charCodeAt(i);
        h = h * 16777619 >>> 0;
    }
    return h >>> 0;
}
function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
        a = a + 0x6d2b79f5 >>> 0;
        let t = a;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
class Rng {
    a;
    constructor(seed){
        this.a = seed >>> 0;
    }
    next() {
        this.a = this.a + 0x6d2b79f5 >>> 0;
        let t = this.a;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    // Standard normal via Box-Muller
    gauss(mean = 0, std = 1) {
        const u1 = Math.max(this.next(), 1e-12);
        const u2 = this.next();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + std * z;
    }
    uniform(lo, hi) {
        return lo + (hi - lo) * this.next();
    }
    randint(lo, hi) {
        return Math.floor(this.uniform(lo, hi + 1));
    }
    choice(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
    random() {
        return this.next();
    }
}
function assetRng(symbol) {
    return new Rng(seedFor(MASTER_SEED, "asset", symbol));
}
function poolRng(address) {
    return new Rng(seedFor(MASTER_SEED, "pool", address));
}
function sessionRng() {
    // Changes every 60 seconds so the demo "moves"
    const bucket = Math.floor(Date.now() / 60_000);
    return new Rng(seedFor(MASTER_SEED, "session", bucket));
}
function drift(base, vol, rng) {
    return base * (1 + vol * rng.gauss(0, 1));
}
function sha256hex(s, len) {
    // Simple FNV-1a hash → hex (deterministic, good enough for demo addresses)
    let h1 = 2166136261;
    let h2 = 16777619;
    for(let i = 0; i < s.length; i++){
        const c = s.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
        h2 = Math.imul(h2 ^ c + 0x9e, 2246822519) >>> 0;
    }
    let hex = (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
    // Stretch to required length by re-hashing
    while(hex.length < len){
        h1 = Math.imul(h1 ^ hex.length, 16777619) >>> 0;
        hex += h1.toString(16).padStart(8, "0");
    }
    return hex.slice(0, len);
}
function discoverAssets() {
    const now = new Date().toISOString();
    const session = sessionRng();
    const assets = [];
    for (const [symbol, name, ticker, refPrice] of SEED_EQUITIES){
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
        const depthFrac = Math.max(0, Math.min(1, (Math.log10(1 + tvl) - Math.log10(180_000)) / (Math.log10(4_500_000) - Math.log10(180_000))));
        const spreadBps = Math.round(Math.max(6, Math.min(120, 14 + (1 - depthFrac) * 70 + session.gauss(0, 4))));
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
            spreadBps
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
            fallbackUsed: true
        }
    };
}
// Synthetic FALLBACK pools — realistic *generic* Fluxion AMM pairs (regular
// crypto pools, NOT tokenized equities). Used only when the live DefiLlama
// yields feed is unreachable. The TVL distribution roughly mirrors the real
// Fluxion tokenized-equity pools (~$2.2M). The Pools lens tracks ONLY
// tokenized-equity AMM pools (each xStock quoted in USDC); crypto-only pairs
// are intentionally excluded to keep the agent focused on tokenized equities.
const SEED_POOLS = [
    // [token0, token1, baseTvlUsd, baseApyPct] — tokenized equity quoted in USDC.
    // TVLs anchored to real Fluxion scale (NVDAx-USDC ≈ $105K observed on-DEX).
    // These are SAMPLE numbers for offline mode; live mode pulls exact TVL from
    // DefiLlama. Sizes are kept in the realistic ~$10K–$110K per-pool range.
    [
        "NVDAx",
        "USDC",
        105_180,
        9.2
    ],
    [
        "TSLAx",
        "USDC",
        96_000,
        7.8
    ],
    [
        "AAPLx",
        "USDC",
        78_000,
        6.4
    ],
    [
        "METAx",
        "USDC",
        61_000,
        5.5
    ],
    [
        "MSFTx",
        "USDC",
        54_000,
        4.9
    ],
    [
        "GOOGLx",
        "USDC",
        43_000,
        5.1
    ],
    [
        "AMZNx",
        "USDC",
        37_000,
        4.3
    ],
    [
        "COINx",
        "USDC",
        31_000,
        8.7
    ],
    [
        "MSTRx",
        "USDC",
        22_000,
        11.2
    ],
    [
        "AMDx",
        "USDC",
        14_000,
        6.0
    ]
];
function discoverSyntheticPools() {
    const now = new Date().toISOString();
    const session = sessionRng();
    const pools = [];
    const feeTier = 0.003;
    for (const [token0, token1, baseTvl, baseApy] of SEED_POOLS){
        const symbol = `${token0}-${token1}`;
        const address = "0x" + sha256hex(`${symbol}|pool|fluxion`, 40);
        const rng = poolRng(address);
        const tvlUsd = drift(baseTvl * rng.uniform(0.9, 1.1), 0.03, session);
        // Derive fees from the intended APY so analytics' recomputed APR is stable.
        const apyDrift = Math.max(0, drift(baseApy, 0.05, session));
        const fees24h = tvlUsd * (apyDrift / 100) / 365;
        const volume24h = fees24h / feeTier;
        const apr = tvlUsd > 0 ? fees24h * 365 / tvlUsd * 100 : 0;
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
            live: false
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
            fallbackUsed: true
        }
    };
}
function discoverSwaps(pools, assets, lookbackHours = 24) {
    const session = sessionRng();
    const assetBySymbol = new Map(assets.map((a)=>[
            a.symbol,
            a
        ]));
    const trades = [];
    const now = Date.now();
    for (const pool of pools){
        const nSwaps = Math.max(0, Math.floor(session.gauss(120, 60)));
        const sampleN = Math.min(nSwaps, 25);
        for(let i = 0; i < sampleN; i++){
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
                kind: "swap"
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
            fallbackUsed: true
        }
    };
}
function discoverRfqTrades(assets, lookbackHours = 24) {
    const session = sessionRng();
    const trades = [];
    const now = Date.now();
    for (const asset of assets){
        if (session.random() < 0.4) continue;
        const n = session.randint(1, 4);
        for(let i = 0; i < n; i++){
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
                kind: "rfq"
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
            fallbackUsed: true
        }
    };
}
function round(x, digits) {
    const f = Math.pow(10, digits);
    return Math.round(x * f) / f;
}
const POST_SOURCES = [
    "X",
    "blog",
    "Discord",
    "onchain"
];
// Seed post templates (text only; the classifier — rule-based or LLM —
// assigns the narrative downstream, so realistic text is exercised).
const POST_TEMPLATES = [
    [
        "AI agents / x402",
        "New ERC-8004 agent shipped on Mantle — autonomous x402 payments are live"
    ],
    [
        "AI agents / x402",
        "QuestFlow agent scaffold makes building agentic apps on Mantle trivial"
    ],
    [
        "AI agents / x402",
        "x402 HTTP-402 micropayments are the missing primitive for AI agents"
    ],
    [
        "AI agents / x402",
        "Agentic finance is coming to Mantle faster than anyone expected"
    ],
    [
        "Tokenized equities",
        "SPCXx tokenized SpaceX now trading on Fluxion + Merchant Moe"
    ],
    [
        "Tokenized equities",
        "xStocks brings TSLAx, NVDAx, AAPLx onchain via Mantle"
    ],
    [
        "RFQ / deep liquidity",
        "Atomic RFQ on Fluxion brings institutional-grade liquidity to xStocks"
    ],
    [
        "Restaking / mETH",
        "mETH restaking yields tick up as TVL grows"
    ],
    [
        "Other",
        "Mantle ecosystem grant program round 3 announced"
    ]
];
function discoverPosts() {
    const now = Date.now();
    const gen = (periodSeed, hoursAgoBase, boost)=>{
        const rng = new Rng(seedFor(MASTER_SEED, "posts", periodSeed, Math.floor(now / 600_000)));
        const posts = [];
        for (const [label, text] of POST_TEMPLATES){
            const base = label === "AI agents / x402" ? 1.2 * boost : 1.0;
            const n = Math.max(0, Math.round(rng.gauss(base, 0.7)));
            for(let i = 0; i < n; i++){
                const source = rng.choice(POST_SOURCES);
                const reach = Math.round(Math.exp(rng.gauss(11.0, 1.4)));
                const ts = new Date(now - (hoursAgoBase + rng.uniform(0, 84)) * 3600_000).toISOString();
                posts.push({
                    id: "post_" + sha256hex(`${periodSeed}|${label}|${i}|${ts}`, 16),
                    source,
                    author: "@" + sha256hex(`${label}|${i}|${source}`, 6),
                    text,
                    narrative: label,
                    reach,
                    timestamp: ts
                });
            }
        }
        return posts;
    };
    // Current period over-weights "AI agents / x402" so it breaks out vs prior.
    const current = gen("current", 0, 2.4);
    const prior = gen("prior", 168, 1.0);
    return {
        current,
        prior
    };
}
}),
"[project]/src/lib/intel/analytics.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Analytics — health scoring & metrics.
 * Direct port of backend/analytics/health.py.
 *
 * Principle 3 (Python owns all calculations) is preserved in spirit:
 * all derived metrics live here, never in the data layer.
 */ __turbopack_context__.s([
    "assetHealthScore",
    ()=>assetHealthScore,
    "buildEcosystemSnapshot",
    ()=>buildEcosystemSnapshot,
    "capitalRetentionScore",
    ()=>capitalRetentionScore,
    "computeAssetMetrics",
    ()=>computeAssetMetrics,
    "computeConcentration",
    ()=>computeConcentration,
    "computePoolMetrics",
    ()=>computePoolMetrics,
    "feeEfficiencyScore",
    ()=>feeEfficiencyScore,
    "growthScore",
    ()=>growthScore,
    "liquidityScore",
    ()=>liquidityScore,
    "poolHealthScore",
    ()=>poolHealthScore,
    "rankAssetsByHealth",
    ()=>rankAssetsByHealth,
    "rankPoolsByHealth",
    ()=>rankPoolsByHealth,
    "spreadQualityScore",
    ()=>spreadQualityScore,
    "stabilityScore",
    ()=>stabilityScore,
    "yieldSustainabilityScore",
    ()=>yieldSustainabilityScore
]);
function clip(x, lo = 0, hi = 100) {
    return Math.max(lo, Math.min(hi, x));
}
function logScale(x) {
    if (x <= 0) return 0;
    return Math.log10(1 + x);
}
function minmax(x, refLow, refHigh) {
    if (refHigh <= refLow) return 0;
    return (x - refLow) / (refHigh - refLow);
}
function liquidityScore(tvlUsd, refLow = 50_000, refHigh = 5_000_000) {
    const raw = minmax(logScale(tvlUsd), logScale(refLow), logScale(refHigh));
    return clip(raw * 100);
}
function growthScore(volume24h, volume7d) {
    if (volume7d <= 0) return 0;
    const dailyAvg7d = volume7d / 7;
    if (dailyAvg7d <= 0) return 0;
    const ratio = volume24h / dailyAvg7d;
    return clip(minmax(ratio, 0.5, 2.0) * 100);
}
function spreadQualityScore(premiumAbs) {
    // 0% deviation → 100, 3% deviation → 0
    return clip(100 - minmax(premiumAbs, 0, 3) * 100);
}
function stabilityScore(premiumAbs) {
    return spreadQualityScore(premiumAbs);
}
function assetHealthScore(params) {
    const liq = liquidityScore(params.tvlUsd);
    const vol = clip(minmax(logScale(params.volume24h), logScale(1_000), logScale(2_000_000)) * 100);
    const spread = spreadQualityScore(params.premiumDiscountAbs);
    const inflow = clip(minmax(params.capitalInflowPct ?? 0, -10, 30) * 100);
    const stab = stabilityScore(params.premiumDiscountAbs);
    const weights = {
        liquidity: 0.3,
        volume: 0.25,
        spread: 0.15,
        inflows: 0.15,
        stability: 0.15
    };
    const score = clip(liq * weights.liquidity + vol * weights.volume + spread * weights.spread + inflow * weights.inflows + stab * weights.stability);
    return {
        score,
        liquidity: liq,
        volume: vol,
        spread,
        inflows: inflow,
        stability: stab
    };
}
function yieldSustainabilityScore(apr) {
    if (apr <= 0) return 0;
    if (apr < 10) return clip(apr * 10);
    if (apr <= 80) return 100;
    return clip(Math.max(0, 100 - (apr - 80) * 0.5));
}
function capitalRetentionScore(tvlChangePct) {
    return clip(minmax(tvlChangePct, -20, 30) * 100);
}
function feeEfficiencyScore(fees24h, tvlUsd) {
    if (tvlUsd <= 0) return 0;
    const dailyYield = fees24h / tvlUsd;
    return clip(minmax(dailyYield, 0, 0.001) * 100);
}
function poolHealthScore(params) {
    const liq = liquidityScore(params.tvlUsd);
    const feeEff = feeEfficiencyScore(params.fees24h, params.tvlUsd);
    const vol = clip(minmax(logScale(params.volume24h), logScale(1_000), logScale(2_000_000)) * 100);
    const yld = yieldSustainabilityScore(params.apr);
    const retention = capitalRetentionScore(params.tvlChangePct ?? 0);
    const weights = {
        liquidity: 0.25,
        fees: 0.25,
        volume: 0.2,
        yield: 0.15,
        retention: 0.15
    };
    const score = clip(liq * weights.liquidity + feeEff * weights.fees + vol * weights.volume + yld * weights.yield + retention * weights.retention);
    return {
        score,
        liquidity: liq,
        fees: feeEff,
        volume: vol,
        yield: yld,
        retention
    };
}
function computeAssetMetrics(asset, history) {
    const premiumAbs = Math.abs(asset.premiumDiscount);
    let inflowPct = 0;
    if (history && history.length >= 2) {
        const prevTvl = history[history.length - 2]?.tvlUsd ?? 0;
        if (prevTvl > 0) {
            inflowPct = (asset.tvlUsd - prevTvl) / prevTvl * 100;
        }
    }
    const growth = growthScore(asset.volume24h, asset.volume7d);
    const liq = liquidityScore(asset.tvlUsd);
    const health = assetHealthScore({
        tvlUsd: asset.tvlUsd,
        volume24h: asset.volume24h,
        premiumDiscountAbs: premiumAbs,
        growth,
        capitalInflowPct: inflowPct
    });
    return {
        ...asset,
        liquidityScore: round(liq, 2),
        growthScore: round(growth, 2),
        healthScore: round(health.score, 2),
        premiumDiscount: asset.referencePrice > 0 ? round((asset.price - asset.referencePrice) / asset.referencePrice * 100, 3) : asset.premiumDiscount
    };
}
function computePoolMetrics(pool, history) {
    let tvlChangePct = 0;
    if (history && history.length >= 2) {
        const prevTvl = history[history.length - 2]?.tvlUsd ?? 0;
        if (prevTvl > 0) {
            tvlChangePct = (pool.tvlUsd - prevTvl) / prevTvl * 100;
        }
    }
    // Live DefiLlama pools report a real (total) APY that may include reward APR
    // beyond swap fees — preserve it. Synthetic pools recompute APR from fees.
    const apr = pool.live ? pool.apr : pool.tvlUsd > 0 ? pool.fees24h * 365 / pool.tvlUsd * 100 : 0;
    const health = poolHealthScore({
        tvlUsd: pool.tvlUsd,
        fees24h: pool.fees24h,
        volume24h: pool.volume24h,
        apr,
        tvlChangePct
    });
    return {
        ...pool,
        apr: round(apr, 2),
        volumeToTvl: pool.tvlUsd > 0 ? round(pool.volume24h / pool.tvlUsd, 4) : 0,
        healthScore: round(health.score, 2),
        feeEfficiency: round(health.fees, 2)
    };
}
function rankAssetsByHealth(assets) {
    return [
        ...assets
    ].sort((a, b)=>b.healthScore - a.healthScore);
}
function rankPoolsByHealth(pools) {
    return [
        ...pools
    ].sort((a, b)=>b.healthScore - a.healthScore);
}
function computeConcentration(tvlByAsset) {
    const total = tvlByAsset.reduce((s, v)=>s + v, 0);
    if (total <= 0 || tvlByAsset.length === 0) return 0;
    const shares = tvlByAsset.map((v)=>v / total);
    return Math.min(1, shares.reduce((s, sh)=>s + sh * sh, 0));
}
function buildEcosystemSnapshot(assets, pools, trades) {
    // Ecosystem TVL / volume are the REAL on-chain AMM pool figures (Fluxion via
    // DefiLlama when live). Equities trade via RFQ and are NOT pooled, so they
    // are intentionally excluded from ecosystem TVL. Fall back to asset figures
    // only if no pools are present.
    const totalTvl = pools.length > 0 ? pools.reduce((s, p)=>s + p.tvlUsd, 0) : assets.reduce((s, a)=>s + a.tvlUsd, 0);
    const totalVolume = pools.length > 0 ? pools.reduce((s, p)=>s + p.volume24h, 0) : assets.reduce((s, a)=>s + a.volume24h, 0);
    const concentration = pools.length > 0 ? computeConcentration(pools.map((p)=>p.tvlUsd)) : computeConcentration(assets.map((a)=>a.tvlUsd));
    const buyVolume = new Map();
    const sellVolume = new Map();
    for (const t of trades){
        buyVolume.set(t.assetSymbol, (buyVolume.get(t.assetSymbol) ?? 0) + t.amountUsd * 0.6);
        sellVolume.set(t.assetSymbol, (sellVolume.get(t.assetSymbol) ?? 0) + t.amountUsd * 0.4);
    }
    const net = new Map();
    for (const a of assets){
        net.set(a.symbol, (buyVolume.get(a.symbol) ?? 0) - (sellVolume.get(a.symbol) ?? 0));
    }
    const inflows = [
        ...net.entries()
    ].sort((a, b)=>b[1] - a[1]).slice(0, 5).filter(([, v])=>v > 0).map(([symbol, v])=>({
            symbol,
            usd: round(v, 2)
        }));
    const outflows = [
        ...net.entries()
    ].sort((a, b)=>a[1] - b[1]).slice(0, 5).filter(([, v])=>v < 0).map(([symbol, v])=>({
            symbol,
            usd: round(Math.abs(v), 2)
        }));
    return {
        timestamp: new Date().toISOString(),
        totalTvl: round(totalTvl, 2),
        totalVolume: round(totalVolume, 2),
        assetCount: assets.length,
        poolCount: pools.length,
        marketConcentration: round(concentration, 4),
        largestInflows: inflows,
        largestOutflows: outflows
    };
}
function round(x, digits) {
    const f = Math.pow(10, digits);
    return Math.round(x * f) / f;
}
}),
"[project]/src/lib/intel/opportunities.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Opportunity engine — port of backend/opportunities/detector.py.
 *
 * Detects: best_yield, hidden_gem, liquidity, risk.
 * All scores 0..100, all explanations grounded in metrics.
 */ __turbopack_context__.s([
    "detectOpportunities",
    ()=>detectOpportunities,
    "rankOpportunities",
    ()=>rankOpportunities
]);
function poolExplanation(p, kind) {
    switch(kind){
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
function fmtUsd(x) {
    if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
    if (x >= 1_000) return `$${(x / 1_000).toFixed(1)}K`;
    return `$${x.toFixed(2)}`;
}
function detectBestYield(pools) {
    const out = [];
    for (const p of pools){
        if (!(p.apr >= 10 && p.apr <= 80)) continue;
        if (p.volumeToTvl < 0.05) continue;
        if (p.healthScore < 60) continue;
        const score = Math.min(100, 0.4 * Math.min(100, p.apr) + 0.4 * p.healthScore + 0.2 * Math.min(100, p.volumeToTvl * 100));
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
                health_score: p.healthScore
            },
            explanation: poolExplanation(p, "best_yield")
        });
    }
    return out;
}
function detectHiddenGems(pools) {
    const out = [];
    for (const p of pools){
        if (p.tvlUsd >= 500_000 || p.tvlUsd <= 0) continue;
        const feeYield = p.tvlUsd > 0 ? p.fees24h / p.tvlUsd : 0;
        if (feeYield < 0.0005) continue;
        if (p.volume24h < 50_000) continue;
        const score = Math.min(100, 50 * feeYield * 1000 + 0.3 * p.feeEfficiency + 0.2 * Math.min(100, p.volume24h / 1000));
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
                fee_efficiency: p.feeEfficiency
            },
            explanation: poolExplanation(p, "hidden_gem")
        });
    }
    return out;
}
function detectLiquidity(pools, assets) {
    const out = [];
    const assetBySymbol = new Map(assets.map((a)=>[
            a.symbol,
            a
        ]));
    for (const p of pools){
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
                asset_tvl: a.tvlUsd
            },
            explanation: poolExplanation(p, "liquidity")
        });
    }
    return out;
}
function detectRisks(pools, assets) {
    const out = [];
    const assetBySymbol = new Map(assets.map((a)=>[
            a.symbol,
            a
        ]));
    for (const p of pools){
        const reasons = [];
        if (p.healthScore < 40) reasons.push(`low health (${p.healthScore.toFixed(1)})`);
        if (p.volumeToTvl < 0.02 && p.tvlUsd > 50_000) reasons.push(`low volume/TVL (${p.volumeToTvl.toFixed(3)})`);
        if (p.apr > 150) reasons.push(`unsustainable APR (${p.apr.toFixed(1)}%)`);
        const a = assetBySymbol.get(p.assetSymbol);
        if (a && Math.abs(a.premiumDiscount) > 1.5) reasons.push(`wide premium/discount (${a.premiumDiscount >= 0 ? "+" : ""}${a.premiumDiscount.toFixed(2)}%)`);
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
                reasons
            },
            explanation: poolExplanation(p, "risk") + ` Reasons: ${reasons.join("; ")}.`
        });
    }
    return out;
}
function detectOpportunities(pools, assets) {
    const opps = [
        ...detectBestYield(pools),
        ...detectHiddenGems(pools),
        ...detectLiquidity(pools, assets),
        ...detectRisks(pools, assets)
    ];
    return rankOpportunities(opps);
}
function rankOpportunities(opps) {
    const priority = {
        best_yield: 0,
        hidden_gem: 1,
        liquidity: 2,
        risk: 3
    };
    return [
        ...opps
    ].sort((a, b)=>{
        const pa = priority[a.kind] ?? 99;
        const pb = priority[b.kind] ?? 99;
        if (pa !== pb) return pa - pb;
        return b.score - a.score;
    });
}
function round(x, digits) {
    const f = Math.pow(10, digits);
    return Math.round(x * f) / f;
}
}),
"[project]/src/lib/intel/llm.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Pluggable LLM client — OpenAI-compatible Chat Completions.
 *
 * Offline-first: when no API key is set, every function is a no-op that
 * returns the deterministic input unchanged. This is the "OpenAILLM /
 * MockLLM" auto-switch from the agent concept, implemented in code.
 *
 * Guardrail: the model may only REWRITE tone or pick a label from a
 * fixed list. It must never introduce new numbers — enforced below.
 *
 * Going live is just environment variables (no code change):
 *   OPENAI_API_KEY          (required to enable the LLM)
 *   OPENAI_BASE_URL         (default https://api.openai.com/v1 — any compatible endpoint)
 *   OPENAI_MODEL            (default gpt-4o-mini)
 *   OPENAI_REASONING_EFFORT (optional: low|medium|high — for reasoning models
 *                            like Groq openai/gpt-oss-120b; keeps the answer from
 *                            being eaten by the reasoning token budget)
 *
 * Example (Groq + gpt-oss-120b):
 *   OPENAI_API_KEY=gsk_...
 *   OPENAI_BASE_URL=https://api.groq.com/openai/v1
 *   OPENAI_MODEL=openai/gpt-oss-120b
 *   OPENAI_REASONING_EFFORT=low
 */ __turbopack_context__.s([
    "answerWithContext",
    ()=>answerWithContext,
    "classifyNarrative",
    ()=>classifyNarrative,
    "llmAvailable",
    ()=>llmAvailable,
    "llmConfig",
    ()=>llmConfig,
    "llmLabel",
    ()=>llmLabel,
    "llmRewrite",
    ()=>llmRewrite,
    "rewriteInsight",
    ()=>rewriteInsight
]);
function llmConfig() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;
    return {
        apiKey,
        baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        reasoningEffort: process.env.OPENAI_REASONING_EFFORT?.trim() || undefined
    };
}
function llmAvailable() {
    return llmConfig() !== null;
}
function llmLabel() {
    const cfg = llmConfig();
    return cfg ? `OpenAILLM (${cfg.model})` : "MockLLM (offline)";
}
async function chat(system, user, opts = {}) {
    const cfg = llmConfig();
    if (!cfg) return null;
    try {
        const payload = {
            model: cfg.model,
            messages: [
                {
                    role: "system",
                    content: system
                },
                {
                    role: "user",
                    content: user
                }
            ],
            temperature: opts.temperature ?? 0.4,
            max_tokens: opts.maxTokens ?? 400
        };
        // Reasoning models (e.g. Groq openai/gpt-oss-120b) spend completion tokens
        // on hidden reasoning. A low effort keeps the visible answer from being
        // truncated; the param is ignored by non-reasoning models.
        if (cfg.reasoningEffort) payload.reasoning_effort = cfg.reasoningEffort;
        const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cfg.apiKey}`
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30_000)
        });
        if (!res.ok) return null;
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        return typeof text === "string" ? text.trim() : null;
    } catch  {
        return null;
    }
}
// --- number guardrail -------------------------------------------------------
function numberSet(s) {
    const m = s.match(/\d+(?:[.,]\d+)?/g) ?? [];
    return new Set(m.map((x)=>x.replace(/,/g, "")));
}
function introducesNewNumbers(original, rewritten) {
    const orig = numberSet(original);
    for (const n of numberSet(rewritten)){
        if (!orig.has(n)) return true;
    }
    return false;
}
const REWRITE_SYSTEM = "You are a crypto market analyst editor. Rewrite the given research note so it reads " + "naturally and concisely for a professional audience. STRICT RULES: do not add, remove, " + "or change any numbers, percentages, tickers or facts; do not invent data; only improve " + "clarity, flow and tone. Keep it under 90 words. Return plain text only.";
async function llmRewrite(text) {
    if (!text.trim() || !llmAvailable()) return text;
    const out = await chat(REWRITE_SYSTEM, text, {
        temperature: 0.4,
        maxTokens: 300
    });
    if (!out) return text;
    if (introducesNewNumbers(text, out)) return text; // reject hallucinated numbers
    return out;
}
async function rewriteInsight(insight) {
    if (!llmAvailable()) return insight;
    const body = await llmRewrite(insight.body);
    return body === insight.body ? insight : {
        ...insight,
        body
    };
}
async function classifyNarrative(text, labels) {
    if (!llmAvailable()) return null;
    const system = `You are a classifier. Assign the text to exactly ONE of these narrative labels: ` + `${labels.join(" | ")}. Reply with ONLY the exact label string, nothing else.`;
    const out = await chat(system, text, {
        temperature: 0,
        maxTokens: 20
    });
    if (!out) return null;
    const norm = out.trim().toLowerCase();
    return labels.find((l)=>l.toLowerCase() === norm) ?? labels.find((l)=>norm.includes(l.toLowerCase())) ?? null;
}
// ---------------------------------------------------------------------------
// Free-form, data-grounded Q&A ("Ask Mantle")
// ---------------------------------------------------------------------------
const ASK_SYSTEM = "You are the Mantle Research Agent, an analyst for the Mantle tokenized-equities " + "ecosystem. Answer the user's question using ONLY the data in the CONTEXT block. " + "STRICT RULES: never invent or estimate numbers, prices, tickers or facts that are " + "not in the context; every figure you cite must appear in the context; if the context " + "lacks the data needed, say so plainly. Be concise (under 110 words), specific, and " + "reference concrete figures from the context. Return plain text only.";
function canonNumberSet(s) {
    const set = new Set();
    for (const raw of s.match(/\d+(?:[.,]\d+)?/g) ?? []){
        const v = parseFloat(raw.replace(/,/g, ""));
        if (Number.isFinite(v)) set.add(String(v));
    }
    return set;
}
// Grounding guardrail: police only decimal figures (prices, %, $M/$K — the
// dangerous, precise-looking numbers). Bare integers (counts, days, scores)
// are allowed through. Returns true if the answer cites a decimal number
// that is not present in the context.
function fabricatesNumbers(context, answer) {
    const ctx = canonNumberSet(context);
    for (const raw of answer.match(/\d+\.\d+/g) ?? []){
        if (!ctx.has(String(parseFloat(raw)))) return true;
    }
    return false;
}
async function answerWithContext(question, context) {
    if (!llmAvailable()) return null;
    const out = await chat(ASK_SYSTEM, `CONTEXT:\n${context}\n\nQUESTION: ${question}`, {
        temperature: 0.3,
        // Generous budget so reasoning models still have room for the visible answer.
        maxTokens: 1200
    });
    if (!out) return null;
    if (fabricatesNumbers(context, out)) return null; // never invent numbers
    return out;
}
}),
"[project]/src/lib/intel/narrative.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Narrative Radar — Lens 2 of the Mantle Research Agent.
 *
 * Tracks which ecosystem narratives are accelerating across social /
 * blog / Discord / on-chain chatter. Deterministic & offline-first:
 * posts come from the synthetic adapter; classification is rule-based
 * by default and upgrades to an LLM classifier via llm.ts when a key
 * is present.
 *
 * Principle 4 (all numbers computed here): momentum, reach and breadth
 * are calculated in this module — the LLM may only rewrite the take.
 */ __turbopack_context__.s([
    "NARRATIVES",
    ()=>NARRATIVES,
    "STAGE_LABEL",
    ()=>STAGE_LABEL,
    "buildNarrativeRadar",
    ()=>buildNarrativeRadar,
    "classifyPosts",
    ()=>classifyPosts,
    "classifyRuleBased",
    ()=>classifyRuleBased,
    "computeNarrativeStats",
    ()=>computeNarrativeStats
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/llm.ts [app-route] (ecmascript)");
;
const NARRATIVES = [
    "AI agents / x402",
    "Tokenized equities",
    "RFQ / deep liquidity",
    "Restaking / mETH",
    "Other"
];
// keyword → narrative (deterministic rule-based classifier / fallback)
const KEYWORDS = [
    [
        "AI agents / x402",
        /\b(ai agent|agentic|x402|erc-?8004|autonomous agent|questflow)\b/i
    ],
    [
        "Tokenized equities",
        /\b(xstock|tokeniz(ed|ation)|spcx|tsla|nvda|aapl|equit|rwa|stock)\b/i
    ],
    [
        "RFQ / deep liquidity",
        /\b(rfq|liquidity|fluxion|merchant moe|order ?book|spread|market maker|depth)\b/i
    ],
    [
        "Restaking / mETH",
        /\b(restak|meth|mantle staked|lst|lrt|eigen)\b/i
    ]
];
function classifyRuleBased(text) {
    for (const [label, re] of KEYWORDS)if (re.test(text)) return label;
    return "Other";
}
const STAGE_LABEL = {
    breaking_out: "🔥 breaking out",
    emerging: "🚀 emerging",
    mainstream: "📊 mainstream",
    cooling: "📉 cooling"
};
function stageFor(deltaPct, breadth) {
    if (deltaPct >= 100 && breadth <= 4) return "breaking_out";
    if (deltaPct > 15) return "emerging";
    if (deltaPct < -15) return "cooling";
    return "mainstream";
}
async function classifyPosts(posts, useLlm = false) {
    const labels = [
        ...NARRATIVES
    ];
    const out = [];
    for (const p of posts){
        const ruled = classifyRuleBased(p.text);
        let label = ruled;
        if (useLlm && ruled === "Other") {
            const llm = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["classifyNarrative"])(p.text, labels).catch(()=>null);
            if (llm) label = llm;
        }
        out.push({
            ...p,
            narrative: label
        });
    }
    return out;
}
function computeNarrativeStats(current, prior) {
    const byLabel = new Map();
    for (const p of current){
        if (!byLabel.has(p.narrative)) byLabel.set(p.narrative, []);
        byLabel.get(p.narrative).push(p);
    }
    const priorCount = new Map();
    for (const p of prior)priorCount.set(p.narrative, (priorCount.get(p.narrative) ?? 0) + 1);
    const stats = [];
    for (const [label, posts] of byLabel){
        const mentions = posts.length;
        const mentionsPrior = priorCount.get(label) ?? 0;
        const deltaPct = mentionsPrior > 0 ? (mentions - mentionsPrior) / mentionsPrior * 100 : mentions > 0 ? 100 : 0;
        const reach = posts.reduce((s, p)=>s + p.reach, 0);
        const breadth = new Set(posts.map((p)=>p.source)).size;
        stats.push({
            narrative: label,
            mentions,
            mentionsPrior,
            deltaPct: Math.round(deltaPct),
            reach: Math.round(reach),
            breadth,
            stage: stageFor(deltaPct, breadth),
            sampleHeadlines: posts.slice(0, 2).map((p)=>p.text)
        });
    }
    const stageRank = {
        breaking_out: 0,
        emerging: 1,
        mainstream: 2,
        cooling: 3
    };
    return stats.sort((a, b)=>stageRank[a.stage] - stageRank[b.stage] || b.deltaPct - a.deltaPct);
}
function fmtPct(x) {
    return `${x >= 0 ? "+" : ""}${x.toFixed(0)}%`;
}
function fmtReach(x) {
    if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(2)}M`;
    if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
    return String(x);
}
function buildNarrativeRadar(stats) {
    const bullets = stats.map((s)=>`${s.narrative}: ${s.mentions} mentions (${fmtPct(s.deltaPct)} vs prior), reach ${fmtReach(s.reach)}, ${s.breadth} sources — ${STAGE_LABEL[s.stage]}.`);
    const breakingOut = stats.filter((s)=>s.stage === "breaking_out").sort((a, b)=>b.deltaPct - a.deltaPct)[0];
    const mainstream = stats.find((s)=>s.stage === "mainstream" || s.stage === "cooling");
    let body;
    if (breakingOut) {
        body = `"${breakingOut.narrative}" is the fastest-accelerating narrative (${fmtPct(breakingOut.deltaPct)} vs prior) and still under-covered relative to its speed — a prime window to publish before it goes mainstream`;
        body += mainstream ? ` like "${mainstream.narrative}". Cooling themes are lower-priority for new content.` : `.`;
    } else if (stats.length > 0) {
        const top = stats[0];
        body = `No narrative is breaking out right now. "${top.narrative}" leads with ${top.mentions} mentions (${fmtPct(top.deltaPct)} vs prior). The conversation is balanced across themes.`;
    } else {
        body = "No narrative chatter indexed in this window.";
    }
    return {
        kind: "narrative_radar",
        title: "Narrative Radar — what's accelerating",
        body,
        bullets,
        generatedAt: new Date().toISOString(),
        evidence: stats.map((s)=>({
                metric: s.narrative,
                value: `${fmtPct(s.deltaPct)} (${STAGE_LABEL[s.stage]})`
            }))
    };
}
}),
"[project]/src/lib/intel/live.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Live data adapter — real Fluxion ecosystem metrics via DefiLlama (no API key).
 *
 * DefiLlama tracks Fluxion at slug `fluxion-network` and exposes free, public,
 * key-less endpoints for protocol TVL, DEX volume and fees. This adapter pulls
 * those ecosystem-level figures; the refresh pipeline then scales the modeled
 * per-asset distribution to match the real totals, so headline TVL / 24h volume
 * are live while the per-asset breakdown stays illustrative.
 *
 * Fully fail-safe: any network/API error (or USE_LIVE_DATA=false) makes
 * fetchLiveEcosystem() report live=false and the pipeline runs pure synthetic.
 */ __turbopack_context__.s([
    "fetchLiveEcosystem",
    ()=>fetchLiveEcosystem,
    "fetchLivePools",
    ()=>fetchLivePools,
    "liveScaleFactors",
    ()=>liveScaleFactors
]);
const BASE = process.env.DEFILLAMA_BASE_URL ?? "https://api.llama.fi";
const SLUG = process.env.FLUXION_DEFILLAMA_SLUG ?? "fluxion-network";
// DefiLlama yields API (separate host) exposes per-pool TVL/APY, no key.
const YIELDS_BASE = process.env.DEFILLAMA_YIELDS_BASE_URL ?? "https://yields.llama.fi";
// yields "project" slug can differ from the TVL adapter slug; match flexibly.
const YIELDS_PROJECT = process.env.FLUXION_YIELDS_PROJECT ?? "fluxion";
const YIELDS_CHAIN = process.env.FLUXION_YIELDS_CHAIN ?? "Mantle";
const TIMEOUT_MS = 12_000;
const SYNTHETIC_SOURCE = "SyntheticAdapter (sample data)";
const LIVE_SOURCE = "Fluxion via DefiLlama (live)";
const LIVE_POOLS_SOURCE = "Fluxion pools via DefiLlama yields (live)";
// Tokenized equities (xStocks) settle via Atomic RFQ, NOT AMM pools. Some data
// sources still list them as "pools"; exclude any pool whose tokens are
// equities so they never leak into the AMM pools tab.
const EQUITY_TICKERS = new Set((process.env.FLUXION_EQUITY_TICKERS ?? "NVDA,TSLA,AAPL,META,MSFT,GOOGL,AMZN,MSTR,COIN,AMD,SPCX,SPY,QQQ,GOOG,NFLX,HOOD,CRCL").split(",").map((s)=>s.trim().toUpperCase()).filter(Boolean));
function isEquityToken(sym) {
    const s = sym.toUpperCase();
    // xStocks use an "x" suffix, e.g. NVDAx -> "NVDAX".
    const base = s.endsWith("X") ? s.slice(0, -1) : s;
    return EQUITY_TICKERS.has(s) || EQUITY_TICKERS.has(base);
}
// Recognized Mantle "major" tokens. The DefiLlama yields feed for Fluxion also
// lists long-tail / memecoin pairs (USDT0-BSB, ELSA-WMNT, USDT0-VOOI, …) that
// clutter the dashboard. We only surface a pool when BOTH tokens are known
// majors. Override / extend via FLUXION_QUALITY_TOKENS (comma-separated). Set it
// to "*" to disable the allowlist and show every pool.
const QUALITY_TOKENS_RAW = (process.env.FLUXION_QUALITY_TOKENS ?? "MNT,WMNT,USDC,USDC.E,USDT,USDT0,USDE,SUSDE,USDY,DAI,FRAX,USD0,WETH,ETH,WBTC,BTC,FBTC,SOLVBTC,METH,CMETH,STONE,SWETH,STETH,WSTETH").trim();
const QUALITY_DISABLED = QUALITY_TOKENS_RAW === "*";
// Tokenized equities only trade against a stable quote (USDC) on Fluxion.
const EQUITY_QUOTE_TOKENS = new Set((process.env.FLUXION_EQUITY_QUOTE_TOKENS ?? "USDC,USDT,USDT0").split(",").map((s)=>s.trim().toUpperCase()).filter(Boolean));
// Surface ONLY tokenized-equity pools (an equity quoted in a stable, e.g.
// NVDAx-USDC). Crypto major pairs (MNT-USDC, …) and long-tail / memecoin pairs
// are both dropped. Set FLUXION_QUALITY_TOKENS="*" to disable filtering entirely.
function isAcceptablePair(t0, t1) {
    if (QUALITY_DISABLED) return true;
    const eq0 = isEquityToken(t0);
    const eq1 = isEquityToken(t1);
    if (eq0 === eq1) return false; // need exactly one equity (drops crypto pairs and equity-equity)
    const quote = (eq0 ? t1 : t0).toUpperCase();
    return EQUITY_QUOTE_TOKENS.has(quote);
}
function round(x, digits) {
    const f = Math.pow(10, digits);
    return Math.round(x * f) / f;
}
function offline() {
    return {
        live: false,
        source: SYNTHETIC_SOURCE,
        totalTvl: null,
        totalVolume24h: null,
        fees24h: null,
        fees7d: null
    };
}
async function getJson(url) {
    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(TIMEOUT_MS),
            headers: {
                accept: "application/json"
            }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch  {
        return null;
    }
}
function num(v) {
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}
async function fetchLiveEcosystem() {
    if (process.env.USE_LIVE_DATA === "false") return offline();
    const [tvlRaw, dexs, fees] = await Promise.all([
        getJson(`${BASE}/tvl/${SLUG}`),
        getJson(`${BASE}/summary/dexs/${SLUG}`),
        getJson(`${BASE}/summary/fees/${SLUG}`)
    ]);
    const totalTvl = num(tvlRaw);
    const dexObj = dexs ?? {};
    const feeObj = fees ?? {};
    const totalVolume24h = num(dexObj.total24h);
    const fees24h = num(feeObj.total24h);
    const fees7d = num(feeObj.total7d);
    if (totalTvl === null && totalVolume24h === null) return offline();
    return {
        live: true,
        source: LIVE_SOURCE,
        totalTvl,
        totalVolume24h,
        fees24h,
        fees7d
    };
}
function splitPair(symbol) {
    const parts = symbol.toUpperCase().split(/[-/]/).map((s)=>s.trim()).filter(Boolean);
    return {
        token0: parts[0] ?? symbol,
        token1: parts[1] ?? ""
    };
}
async function fetchLivePools() {
    if (process.env.USE_LIVE_DATA === "false") {
        return {
            live: false,
            source: SYNTHETIC_SOURCE,
            pools: []
        };
    }
    const raw = await getJson(`${YIELDS_BASE}/pools`);
    const data = raw?.data;
    if (!Array.isArray(data)) {
        return {
            live: false,
            source: SYNTHETIC_SOURCE,
            pools: []
        };
    }
    const wantProject = YIELDS_PROJECT.toLowerCase();
    const wantChain = YIELDS_CHAIN.toLowerCase();
    const now = new Date().toISOString();
    const pools = [];
    for (const row of data){
        const project = (row.project ?? "").toLowerCase();
        const chain = (row.chain ?? "").toLowerCase();
        if (!project.includes(wantProject)) continue;
        if (wantChain && chain !== wantChain) continue;
        const tvlUsd = num(row.tvlUsd) ?? 0;
        if (tvlUsd <= 0) continue;
        const symbol = (row.symbol ?? "").trim() || "POOL";
        const { token0, token1 } = splitPair(symbol);
        // Keep equity-USDC pools and major-major pools; drop long-tail / memecoin pairs.
        if (!isAcceptablePair(token0, token1)) continue;
        const apr = num(row.apy) ?? num(row.apyBase) ?? 0;
        // yields gives APY, not fees directly. apyBase is the swap-fee component;
        // estimate daily fees from it, falling back to total apy.
        const feeApr = num(row.apyBase) ?? apr;
        const fees24h = Math.max(0, tvlUsd * (feeApr / 100) / 365);
        // Prefer real reported 24h volume; otherwise infer from fees @ 0.3% tier.
        const volume24h = num(row.volumeUsd1d) ?? (fees24h > 0 ? fees24h / 0.003 : 0);
        pools.push({
            address: row.pool ?? "0x" + symbol.toLowerCase(),
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
            source: LIVE_POOLS_SOURCE,
            live: true
        });
    }
    if (pools.length === 0) {
        return {
            live: false,
            source: SYNTHETIC_SOURCE,
            pools: []
        };
    }
    return {
        live: true,
        source: LIVE_POOLS_SOURCE,
        pools
    };
}
function liveScaleFactors(assets, live) {
    const synthTvl = assets.reduce((s, a)=>s + a.tvlUsd, 0);
    const synthVol = assets.reduce((s, a)=>s + a.volume24h, 0);
    const scaleTvl = live.live && live.totalTvl !== null && synthTvl > 0 ? live.totalTvl / synthTvl : 1;
    const scaleVol = live.live && live.totalVolume24h !== null && synthVol > 0 ? live.totalVolume24h / synthVol : 1;
    return {
        scaleTvl,
        scaleVol
    };
}
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        'query'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[project]/src/lib/intel/storage.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "latestSnapshot",
    ()=>latestSnapshot,
    "listAssetHistory",
    ()=>listAssetHistory,
    "listPoolHistory",
    ()=>listPoolHistory,
    "listSnapshots",
    ()=>listSnapshots,
    "previousSnapshot",
    ()=>previousSnapshot,
    "writeAiSummary",
    ()=>writeAiSummary,
    "writeAssetSeries",
    ()=>writeAssetSeries,
    "writeOpportunities",
    ()=>writeOpportunities,
    "writePoolSeries",
    ()=>writePoolSeries,
    "writeSnapshot",
    ()=>writeSnapshot,
    "writeTrades",
    ()=>writeTrades
]);
/**
 * Storage layer — Prisma-based persistence for snapshots, asset/pool
 * time series, trades, opportunities and AI summaries.
 *
 * Mirrors backend/storage/__init__.py.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
async function writeSnapshot(snap) {
    const r = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].snapshot.create({
        data: {
            ts: new Date(snap.timestamp),
            totalTvl: snap.totalTvl,
            totalVolume: snap.totalVolume,
            assetCount: snap.assetCount,
            poolCount: snap.poolCount,
            concentration: snap.marketConcentration,
            payload: JSON.stringify(snap)
        }
    });
    return r.id;
}
async function writeAssetSeries(assets, ts = new Date()) {
    if (assets.length === 0) return;
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assetSeries.createMany({
        data: assets.map((a)=>({
                ts,
                symbol: a.symbol,
                address: a.address,
                tvlUsd: a.tvlUsd,
                volume24h: a.volume24h,
                price: a.price,
                premium: a.premiumDiscount,
                healthScore: a.healthScore,
                liquidityScore: a.liquidityScore,
                growthScore: a.growthScore
            }))
    });
}
async function writePoolSeries(pools, ts = new Date()) {
    if (pools.length === 0) return;
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].poolSeries.createMany({
        data: pools.map((p)=>({
                ts,
                address: p.address,
                assetSymbol: p.assetSymbol,
                tvlUsd: p.tvlUsd,
                volume24h: p.volume24h,
                fees24h: p.fees24h,
                apr: p.apr,
                volumeToTvl: p.volumeToTvl,
                healthScore: p.healthScore
            }))
    });
}
async function writeTrades(trades) {
    if (trades.length === 0) return 0;
    // SQLite UNIQUE on txHash — skip duplicates
    let count = 0;
    for (const t of trades){
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].trade.create({
                data: {
                    ts: new Date(t.timestamp),
                    txHash: t.txHash,
                    assetSymbol: t.assetSymbol,
                    poolAddress: t.poolAddress,
                    amountUsd: t.amountUsd,
                    price: t.price,
                    kind: t.kind
                }
            });
            count++;
        } catch  {
        // duplicate txHash — skip
        }
    }
    return count;
}
async function writeOpportunities(opps, ts = new Date()) {
    if (opps.length === 0) return;
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].opportunityLog.createMany({
        data: opps.map((o)=>({
                ts,
                kind: o.kind,
                title: o.title,
                payload: JSON.stringify(o)
            }))
    });
}
async function writeAiSummary(insight) {
    const r = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].aiSummary.create({
        data: {
            ts: new Date(insight.generatedAt),
            kind: insight.kind,
            title: insight.title,
            body: insight.body,
            bullets: JSON.stringify(insight.bullets),
            evidence: JSON.stringify(insight.evidence)
        }
    });
    return r.id;
}
async function listSnapshots(limit = 168) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].snapshot.findMany({
        orderBy: {
            ts: "desc"
        },
        take: limit
    });
    return rows.map((r)=>JSON.parse(r.payload));
}
async function latestSnapshot() {
    const rows = await listSnapshots(1);
    return rows[0] ?? null;
}
async function listAssetHistory(symbol, limit = 168) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assetSeries.findMany({
        where: {
            symbol
        },
        orderBy: {
            ts: "desc"
        },
        take: limit
    });
    return rows.reverse().map((r)=>({
            ts: r.ts.toISOString(),
            tvlUsd: r.tvlUsd,
            volume24h: r.volume24h,
            price: r.price,
            premium: r.premium,
            healthScore: r.healthScore,
            liquidityScore: r.liquidityScore,
            growthScore: r.growthScore
        }));
}
async function listPoolHistory(address, limit = 168) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].poolSeries.findMany({
        where: {
            address
        },
        orderBy: {
            ts: "desc"
        },
        take: limit
    });
    return rows.reverse().map((r)=>({
            ts: r.ts.toISOString(),
            tvlUsd: r.tvlUsd,
            volume24h: r.volume24h,
            fees24h: r.fees24h,
            apr: r.apr,
            volumeToTvl: r.volumeToTvl,
            healthScore: r.healthScore
        }));
}
async function previousSnapshot() {
    const rows = await listSnapshots(2);
    return rows[1] ?? null;
}
}),
"[project]/src/lib/intel/refresh.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureLoaded",
    ()=>ensureLoaded,
    "refreshEcosystem",
    ()=>refreshEcosystem
]);
/**
 * Refresh pipeline — orchestrates discovery → analytics → opportunities
 * → narrative radar → persistence. Server-side only.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$synthetic$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/synthetic.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$analytics$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/analytics.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$opportunities$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/opportunities.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$narrative$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/narrative.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/llm.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$live$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/live.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/cache.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/storage.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
// Single-flight guard. In Next dev (and under bursty traffic) several API
// routes can call refreshEcosystem() concurrently on first load. SQLite allows
// only ONE writer, so parallel refreshes serialize and then trip Prisma's
// "Socket timeout (the database failed to respond...)". Deduping to a single
// in-flight run removes the contention.
let refreshInFlight = null;
function refreshEcosystem() {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = runRefresh().finally(()=>{
        refreshInFlight = null;
    });
    return refreshInFlight;
}
async function runRefresh() {
    // 1. Discovery
    //    - Equities: RFQ instruments (Atomic RFQ / xChange) — issuer-direct quotes,
    //      NOT AMM pools. Modeled sample data (no public per-asset RFQ feed).
    //    - Pools: REAL Fluxion AMM pools via DefiLlama yields (no key); falls back
    //      to generic synthetic crypto-pair pools if the feed is unreachable.
    const { assets } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$synthetic$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["discoverAssets"])();
    const livePools = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$live$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchLivePools"])();
    const pools = livePools.live ? livePools.pools : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$synthetic$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["discoverSyntheticPools"])().pools;
    const poolSource = livePools.live ? livePools.source : "SyntheticAdapter (sample data)";
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].sourceLabel = poolSource;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].poolSourceLabel = poolSource;
    const { trades: swaps } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$synthetic$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["discoverSwaps"])(pools, assets, 24);
    const { trades: rfq } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$synthetic$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["discoverRfqTrades"])(assets, 24);
    const trades = [
        ...swaps,
        ...rfq
    ];
    // 2. Analytics — enrich with computed scores (use history if available).
    //    Equities are NOT scaled to pool TVL: their depth is RFQ depth, distinct
    //    from on-chain AMM TVL.
    const enrichedAssets = [];
    for (const a of assets){
        const history = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listAssetHistory"])(a.symbol, 168);
        enrichedAssets.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$analytics$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["computeAssetMetrics"])(a, history));
    }
    const enrichedPools = [];
    for (const p of pools){
        const history = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listPoolHistory"])(p.address, 168);
        enrichedPools.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$analytics$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["computePoolMetrics"])(p, history));
    }
    // 3. Ecosystem snapshot & opportunities (TVL/volume from REAL pools)
    const snapshot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$analytics$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildEcosystemSnapshot"])(enrichedAssets, enrichedPools, trades);
    const opps = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$opportunities$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["detectOpportunities"])(enrichedPools, enrichedAssets);
    // 4. Narrative Radar (Lens 2) — classify chatter, compute momentum
    const useLlm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["llmAvailable"])();
    const { current, prior } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$synthetic$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["discoverPosts"])();
    const [classifiedCurrent, classifiedPrior] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$narrative$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["classifyPosts"])(current, useLlm),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$narrative$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["classifyPosts"])(prior, useLlm)
    ]);
    const narratives = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$narrative$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["computeNarrativeStats"])(classifiedCurrent, classifiedPrior);
    const narrativeBrief = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rewriteInsight"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$narrative$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildNarrativeRadar"])(narratives));
    // 5. Persist
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeSnapshot"])(snapshot);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeAssetSeries"])(enrichedAssets, new Date(snapshot.timestamp));
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writePoolSeries"])(enrichedPools, new Date(snapshot.timestamp));
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeTrades"])(trades);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeOpportunities"])(opps, new Date(snapshot.timestamp));
    // 6. Update cache (sorted)
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].assets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$analytics$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rankAssetsByHealth"])(enrichedAssets);
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].pools = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$analytics$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rankPoolsByHealth"])(enrichedPools);
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].trades = trades;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].snapshot = snapshot;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].opportunities = opps;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].narratives = narratives;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].narrativeBrief = narrativeBrief;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].lastRefreshed = new Date().toISOString();
    return {
        refreshedAt: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].lastRefreshed,
        assets: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].assets.length,
        pools: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].pools.length,
        opportunities: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].opportunities.length,
        tradesIndexed: trades.length,
        narratives: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].narratives.length,
        source: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].sourceLabel
    };
}
async function ensureLoaded() {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].snapshot === null) {
        await refreshEcosystem();
    }
}
;
}),
"[project]/src/lib/intel/digest.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Two-lens Markdown research digest — the single artifact a human or
 * another agent can act on. Mirrors the Mantle Research Agent concept:
 * Lens 1 (Market Monitor) + Lens 2 (Narrative Radar) + Agent's take.
 */ __turbopack_context__.s([
    "buildDigestMarkdown",
    ()=>buildDigestMarkdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$narrative$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/narrative.ts [app-route] (ecmascript)");
;
function fmtUsd(x) {
    if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
    if (x >= 1_000) return `$${(x / 1_000).toFixed(1)}K`;
    return `$${x.toFixed(2)}`;
}
function fmtReach(x) {
    if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(2)}M`;
    if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
    return String(x);
}
function pct(x) {
    return `${x >= 0 ? "+" : ""}${x.toFixed(0)}%`;
}
function equitySignals(a) {
    const flags = [];
    const spread = a.spreadBps ?? 0;
    if (a.tvlUsd < 3_000_000) flags.push(`thin liquidity (${fmtUsd(a.tvlUsd)})`);
    if (spread > 50) flags.push(`wide spread (${spread} bps)`);
    if (Math.abs(a.premiumDiscount) > 1) flags.push(`${a.premiumDiscount >= 0 ? "premium" : "discount"} ${pct(a.premiumDiscount)}`);
    return flags.length ? flags.join("; ") : "healthy: tight spread, adequate depth";
}
function buildDigestMarkdown(args) {
    const { snapshot, assets, pools, narratives, adapter, llm } = args;
    const poolSource = args.poolSource ?? adapter;
    const topEquities = [
        ...assets
    ].sort((a, b)=>b.tvlUsd - a.tvlUsd).slice(0, 8);
    const topPools = [
        ...pools
    ].sort((a, b)=>b.tvlUsd - a.tvlUsd).slice(0, 10);
    const venue = assets[0]?.venue ?? "Atomic RFQ (xChange)";
    const lines = [];
    lines.push("# Mantle Research Agent — Daily Digest");
    lines.push(`_equities: ${adapter} · pools: ${poolSource} · LLM: ${llm}_`);
    lines.push("");
    lines.push("## Lens 1 — Market Monitor");
    lines.push(`Tokenized equities (${snapshot.assetCount}) settle via ${venue} — issuer-direct RFQ quotes, not AMM pools. "Liquidity" below is RFQ depth.`);
    lines.push("");
    lines.push("| Symbol | Onchain | Spread | RFQ Depth | 24h Vol | Premium | Signals |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- |");
    for (const a of topEquities){
        lines.push(`| ${a.symbol} | $${a.price.toFixed(2)} | ${a.spreadBps ?? 0} bps | ${fmtUsd(a.tvlUsd)} | ${fmtUsd(a.volume24h)} | ${pct(a.premiumDiscount)} | ${equitySignals(a)} |`);
    }
    lines.push("");
    lines.push("## Lens 1b — Fluxion AMM Pools");
    lines.push(`On-chain AMM pools (${snapshot.poolCount}) · TVL ${fmtUsd(snapshot.totalTvl)} · 24h vol ${fmtUsd(snapshot.totalVolume)} · source: ${poolSource}`);
    lines.push("");
    lines.push("| Pool | TVL | APR | Fees 24h | V/TVL | Health |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const p of topPools){
        lines.push(`| ${p.assetSymbol} | ${fmtUsd(p.tvlUsd)} | ${p.apr.toFixed(2)}% | ${fmtUsd(p.fees24h)} | ${p.volumeToTvl.toFixed(2)} | ${p.healthScore.toFixed(0)}/100 |`);
    }
    lines.push("");
    lines.push("## Lens 2 — Narrative Radar");
    lines.push("| Narrative | Mentions | Δ vs prior | Reach | Sources | Stage |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const s of narratives){
        lines.push(`| ${s.narrative} | ${s.mentions} | ${pct(s.deltaPct)} | ${fmtReach(s.reach)} | ${s.breadth} | ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$narrative$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAGE_LABEL"][s.stage]} |`);
    }
    lines.push("");
    lines.push("## Agent's take");
    lines.push(args.take ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$narrative$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildNarrativeRadar"])(narratives).body);
    return lines.join("\n");
}
}),
"[project]/src/app/api/digest/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/cache.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$refresh$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/intel/refresh.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$digest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/digest.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/intel/llm.ts [app-route] (ecmascript)");
;
;
;
;
;
const dynamic = "force-dynamic";
async function GET() {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$refresh$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ensureLoaded"])();
        const markdown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$digest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildDigestMarkdown"])({
            snapshot: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].snapshot,
            assets: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].assets,
            pools: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].pools,
            narratives: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].narratives,
            adapter: "SyntheticAdapter (sample data)",
            poolSource: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].poolSourceLabel,
            llm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$llm$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["llmLabel"])(),
            take: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$intel$2f$cache$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"].narrativeBrief?.body
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            markdown
        });
    } catch (e) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: e instanceof Error ? e.message : String(e)
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0_qpxbh._.js.map