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
 */

import type { Asset, Pool } from "./models";

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
const EQUITY_TICKERS = new Set(
  (process.env.FLUXION_EQUITY_TICKERS ??
    "NVDA,TSLA,AAPL,META,MSFT,GOOGL,AMZN,MSTR,COIN,AMD,SPCX,SPY,QQQ,GOOG,NFLX,HOOD,CRCL")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
);

function isEquityToken(sym: string): boolean {
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
const QUALITY_TOKENS_RAW = (
  process.env.FLUXION_QUALITY_TOKENS ??
  "MNT,WMNT,USDC,USDC.E,USDT,USDT0,USDE,SUSDE,USDY,DAI,FRAX,USD0,WETH,ETH,WBTC,BTC,FBTC,SOLVBTC,METH,CMETH,STONE,SWETH,STETH,WSTETH"
).trim();
const QUALITY_DISABLED = QUALITY_TOKENS_RAW === "*";
// Tokenized equities only trade against a stable quote (USDC) on Fluxion.
const EQUITY_QUOTE_TOKENS = new Set(
  (process.env.FLUXION_EQUITY_QUOTE_TOKENS ?? "USDC,USDT,USDT0")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
);

// Surface ONLY tokenized-equity pools (an equity quoted in a stable, e.g.
// NVDAx-USDC). Crypto major pairs (MNT-USDC, …) and long-tail / memecoin pairs
// are both dropped. Set FLUXION_QUALITY_TOKENS="*" to disable filtering entirely.
function isAcceptablePair(t0: string, t1: string): boolean {
  if (QUALITY_DISABLED) return true;
  const eq0 = isEquityToken(t0);
  const eq1 = isEquityToken(t1);
  if (eq0 === eq1) return false; // need exactly one equity (drops crypto pairs and equity-equity)
  const quote = (eq0 ? t1 : t0).toUpperCase();
  return EQUITY_QUOTE_TOKENS.has(quote);
}

function round(x: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(x * f) / f;
}

export interface LiveEcosystem {
  live: boolean;
  source: string;
  totalTvl: number | null;
  totalVolume24h: number | null;
  fees24h: number | null;
  fees7d: number | null;
}

function offline(): LiveEcosystem {
  return {
    live: false,
    source: SYNTHETIC_SOURCE,
    totalTvl: null,
    totalVolume24h: null,
    fees24h: null,
    fees7d: null,
  };
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Pull live Fluxion ecosystem metrics from DefiLlama. Never throws. */
export async function fetchLiveEcosystem(): Promise<LiveEcosystem> {
  if (process.env.USE_LIVE_DATA === "false") return offline();

  const [tvlRaw, dexs, fees] = await Promise.all([
    getJson(`${BASE}/tvl/${SLUG}`),
    getJson(`${BASE}/summary/dexs/${SLUG}`),
    getJson(`${BASE}/summary/fees/${SLUG}`),
  ]);

  const totalTvl = num(tvlRaw);
  const dexObj = (dexs ?? {}) as Record<string, unknown>;
  const feeObj = (fees ?? {}) as Record<string, unknown>;
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
    fees7d,
  };
}

/**
 * Proportional scale factors mapping the synthetic per-asset distribution onto
 * the real ecosystem totals. Returns 1 (no-op) whenever the live overlay is
 * unavailable or a denominator is non-positive.
 */
export interface LivePoolsResult {
  live: boolean;
  source: string;
  pools: Pool[];
}

// Raw shape of a DefiLlama yields pool (only the fields we use).
interface LlamaYieldPool {
  pool?: string;
  chain?: string;
  project?: string;
  symbol?: string;
  tvlUsd?: number;
  apy?: number;
  apyBase?: number;
  apyReward?: number;
  volumeUsd1d?: number;
  volumeUsd7d?: number;
  underlyingTokens?: string[];
}

function splitPair(symbol: string): { token0: string; token1: string } {
  const parts = symbol
    .toUpperCase()
    .split(/[-/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { token0: parts[0] ?? symbol, token1: parts[1] ?? "" };
}

/**
 * Pull REAL Fluxion pools from the DefiLlama yields API (no key).
 *
 * Surfaces ONLY tokenized-equity AMM pools quoted in a stable
 * (NVDAx/USDC, TSLAx/USDC, …). Crypto major pairs and long-tail / memecoin
 * pairs are filtered out. Override accepted quotes via FLUXION_EQUITY_QUOTE_TOKENS.
 *
 * Never throws. Returns live=false (empty pools) on any failure or when
 * USE_LIVE_DATA=false, so the pipeline falls back to synthetic sample pools.
 */
export async function fetchLivePools(): Promise<LivePoolsResult> {
  if (process.env.USE_LIVE_DATA === "false") {
    return { live: false, source: SYNTHETIC_SOURCE, pools: [] };
  }

  const raw = await getJson(`${YIELDS_BASE}/pools`);
  const data = (raw as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) {
    return { live: false, source: SYNTHETIC_SOURCE, pools: [] };
  }

  const wantProject = YIELDS_PROJECT.toLowerCase();
  const wantChain = YIELDS_CHAIN.toLowerCase();
  const now = new Date().toISOString();
  const pools: Pool[] = [];

  for (const row of data as LlamaYieldPool[]) {
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
    const fees24h = Math.max(0, (tvlUsd * (feeApr / 100)) / 365);
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
      live: true,
    });
  }

  if (pools.length === 0) {
    return { live: false, source: SYNTHETIC_SOURCE, pools: [] };
  }
  return { live: true, source: LIVE_POOLS_SOURCE, pools };
}

export function liveScaleFactors(
  assets: Asset[],
  live: LiveEcosystem
): { scaleTvl: number; scaleVol: number } {
  const synthTvl = assets.reduce((s, a) => s + a.tvlUsd, 0);
  const synthVol = assets.reduce((s, a) => s + a.volume24h, 0);
  const scaleTvl =
    live.live && live.totalTvl !== null && synthTvl > 0
      ? live.totalTvl / synthTvl
      : 1;
  const scaleVol =
    live.live && live.totalVolume24h !== null && synthVol > 0
      ? live.totalVolume24h / synthVol
      : 1;
  return { scaleTvl, scaleVol };
}
