/**
 * AI Narrator — port of backend/ai/narrator.py.
 *
 * Deterministic narrative generator. All numbers come from the
 * calculated metrics — no hallucinated analysis (Principle 4).
 *
 * The LLM augmenter (src/lib/intel/llm.ts, OpenAI-compatible) is invoked separately and only
 * rewrites the deterministic narrative for tone; it must not add new
 * facts.
 */

import type {
  AIInsight,
  Asset,
  EcosystemSnapshot,
  Opportunity,
  OpportunityKind,
  Pool,
} from "./models";

function fmtUsd(x: number): string {
  if (x >= 1_000_000_000) return `$${(x / 1_000_000_000).toFixed(2)}B`;
  if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `$${(x / 1_000).toFixed(1)}K`;
  return `$${x.toFixed(2)}`;
}

function fmtPct(x: number): string {
  return `${x >= 0 ? "+" : ""}${x.toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// Daily Brief
// ---------------------------------------------------------------------------

export function buildDailyBrief(
  snapshot: EcosystemSnapshot,
  assets: Asset[],
  pools: Pool[],
  previousSnapshot?: EcosystemSnapshot
): AIInsight {
  const bullets: string[] = [];

  let tvlChangePct = 0;
  if (previousSnapshot && previousSnapshot.totalTvl > 0) {
    tvlChangePct =
      ((snapshot.totalTvl - previousSnapshot.totalTvl) / previousSnapshot.totalTvl) * 100;
  }
  bullets.push(
    `Total ecosystem TVL is ${fmtUsd(snapshot.totalTvl)} (${fmtPct(tvlChangePct)} vs previous snapshot).`
  );
  bullets.push(
    `24h volume is ${fmtUsd(snapshot.totalVolume)} across ${snapshot.assetCount} assets and ${snapshot.poolCount} pools.`
  );

  if (snapshot.largestInflows.length > 0) {
    const top = snapshot.largestInflows[0];
    bullets.push(`Largest net inflow: ${top.symbol} (+${fmtUsd(top.usd)}).`);
  }
  if (snapshot.largestOutflows.length > 0) {
    const top = snapshot.largestOutflows[0];
    bullets.push(`Largest net outflow: ${top.symbol} (-${fmtUsd(top.usd)}).`);
  }

  if (assets.length > 0) {
    const topAsset = [...assets].sort((a, b) => b.healthScore - a.healthScore)[0];
    bullets.push(
      `Healthiest asset: ${topAsset.symbol} (health ${topAsset.healthScore.toFixed(1)}, liquidity ${topAsset.liquidityScore.toFixed(1)}).`
    );
  }

  if (pools.length > 0) {
    const sustainable = pools.filter((p) => p.apr >= 10 && p.apr <= 80);
    if (sustainable.length > 0) {
      const topPool = [...sustainable].sort((a, b) => b.apr - a.apr)[0];
      bullets.push(
        `Top sustainable yield pool: ${topPool.assetSymbol} at ${topPool.apr.toFixed(2)}% APR with ${fmtUsd(topPool.tvlUsd)} TVL.`
      );
    }
  }

  if (snapshot.marketConcentration > 0.35) {
    bullets.push(
      `Market concentration is elevated (HHI ${snapshot.marketConcentration.toFixed(2)}) — ecosystem is top-heavy.`
    );
  }

  let body = `The Mantle tokenized equities ecosystem currently holds ${fmtUsd(snapshot.totalTvl)} in total TVL with ${fmtUsd(snapshot.totalVolume)} in 24h volume across ${snapshot.assetCount} assets and ${snapshot.poolCount} pools. `;
  if (snapshot.largestInflows.length > 0) {
    body += `Most net inflows entered ${snapshot.largestInflows[0].symbol}. `;
  }
  if (tvlChangePct > 0) {
    body += "Liquidity is expanding and overall ecosystem health is improving.";
  } else if (tvlChangePct < 0) {
    body += "Liquidity is contracting; traders should monitor outflows.";
  } else {
    body += "Liquidity is roughly flat versus the previous snapshot.";
  }

  return {
    kind: "daily_brief",
    title: "Daily Brief — Mantle Tokenized Equities",
    body,
    bullets,
    generatedAt: new Date().toISOString(),
    evidence: [
      { metric: "total_tvl", value: snapshot.totalTvl },
      { metric: "total_volume", value: snapshot.totalVolume },
      { metric: "tvl_change_pct", value: round(tvlChangePct, 3) },
      { metric: "concentration", value: snapshot.marketConcentration },
    ],
  };
}

// ---------------------------------------------------------------------------
// Ecosystem Health Summary
// ---------------------------------------------------------------------------

export function buildEcosystemHealthSummary(
  snapshot: EcosystemSnapshot,
  assets: Asset[],
  pools: Pool[]
): AIInsight {
  const bullets: string[] = [];
  const bullish: string[] = [];
  const bearish: string[] = [];

  const healthyAssets = assets.filter((a) => a.healthScore >= 60);
  if (healthyAssets.length >= Math.max(3, Math.floor(assets.length / 3))) {
    bullish.push(`${healthyAssets.length}/${assets.length} assets have a health score ≥ 60.`);
  }

  const sustainablePools = pools.filter(
    (p) => p.apr >= 10 && p.apr <= 80 && p.healthScore >= 60
  );
  if (sustainablePools.length > 0) {
    bullish.push(
      `${sustainablePools.length} pools show sustainable yield (10–80% APR) with strong health.`
    );
  }

  const riskyAssets = assets.filter((a) => a.healthScore < 40);
  if (riskyAssets.length > 0) {
    bearish.push(
      `${riskyAssets.length} assets have a health score below 40: ${riskyAssets.slice(0, 5).map((a) => a.symbol).join(", ")}.`
    );
  }

  if (snapshot.marketConcentration > 0.3) {
    bearish.push(
      `Market concentration HHI = ${snapshot.marketConcentration.toFixed(2)} — a single asset drives the majority of TVL.`
    );
  }

  bullets.push(...bullish.map((b) => `Bullish: ${b}`));
  bullets.push(...bearish.map((b) => `Bearish: ${b}`));

  const body =
    `Bullish signals: ${bullish.length}. Bearish signals: ${bearish.length}. ` +
    `Concentration HHI is ${snapshot.marketConcentration.toFixed(2)} (${snapshot.marketConcentration > 0.3 ? "high" : "moderate"}). ` +
    `${healthyAssets.length}/${assets.length} assets are healthy. ` +
    `${sustainablePools.length}/${pools.length} pools offer sustainable yield.`;

  return {
    kind: "ecosystem_health",
    title: "Ecosystem Health Summary",
    body,
    bullets,
    generatedAt: new Date().toISOString(),
    evidence: [
      { metric: "concentration", value: snapshot.marketConcentration },
      { metric: "healthy_assets", value: healthyAssets.length },
      { metric: "risky_assets", value: riskyAssets.length },
      { metric: "sustainable_pools", value: sustainablePools.length },
    ],
  };
}

// ---------------------------------------------------------------------------
// Opportunity Summary
// ---------------------------------------------------------------------------

export function buildOpportunitySummary(opps: Opportunity[]): AIInsight {
  const bullets: string[] = [];
  const byKind = new Map<OpportunityKind, Opportunity[]>();
  for (const o of opps) {
    if (!byKind.has(o.kind)) byKind.set(o.kind, []);
    byKind.get(o.kind)!.push(o);
  }

  const bestYield = (byKind.get("best_yield") ?? []).slice(0, 3);
  for (const o of bestYield) {
    const apr = (o.metrics.apr as number) ?? 0;
    bullets.push(`Yield: ${o.title} — APR ${apr.toFixed(2)}%, score ${o.score.toFixed(1)}.`);
  }

  const hidden = (byKind.get("hidden_gem") ?? []).slice(0, 3);
  for (const o of hidden) {
    const tvl = (o.metrics.tvl as number) ?? 0;
    const fees = (o.metrics.fees_24h as number) ?? 0;
    bullets.push(
      `Gem: ${o.title} — TVL ${fmtUsd(tvl)}, fees ${fmtUsd(fees)}/day, score ${o.score.toFixed(1)}.`
    );
  }

  const risks = (byKind.get("risk") ?? []).slice(0, 3);
  for (const o of risks) {
    bullets.push(`Risk: ${o.title} — ${o.explanation}`);
  }

  const liquidityCount = (byKind.get("liquidity") ?? []).length;
  let body = `Detected ${opps.length} opportunities: ${bestYield.length} best-yield, ${hidden.length} hidden-gem, ${liquidityCount} liquidity, ${risks.length} risk flags. `;
  if (bestYield.length > 0) {
    const apr = (bestYield[0].metrics.apr as number) ?? 0;
    body += `Top yield: ${bestYield[0].title} at ${apr.toFixed(2)}% APR. `;
  }
  if (hidden.length > 0) body += `Top hidden gem: ${hidden[0].title}.`;

  return {
    kind: "opportunity_summary",
    title: "Opportunity Summary",
    body,
    bullets,
    generatedAt: new Date().toISOString(),
    evidence: [
      { metric: "total_opportunities", value: opps.length },
      { metric: "best_yield_count", value: bestYield.length },
      { metric: "hidden_gem_count", value: hidden.length },
      { metric: "risk_count", value: risks.length },
    ],
  };
}

// ---------------------------------------------------------------------------
// Ask Mantle — rule-based NL Q&A grounded in metrics
// ---------------------------------------------------------------------------

const QUESTION_PATTERNS: Array<[RegExp, string]> = [
  [/\b(today|happen|brief|daily)\b/i, "daily_brief"],
  [/\b(health|healthy|bullish|bearish)\b/i, "ecosystem_health"],
  [/\b(opportunit|yield|gem|best)\b/i, "opportunity"],
  [/\b(liquidity|inflow|outflow|capital)\b/i, "liquidity"],
  [/\b(pool|apr|fees)\b/i, "pools"],
  [/\b(asset|stock|momentum|growth|winner)\b/i, "assets"],
  [/\b(risk|warn|danger)\b/i, "risk"],
  [/\b(watch|week|ahead)\b/i, "watch"],
];

function answerLiquidity(snapshot: EcosystemSnapshot): string {
  const inflows = snapshot.largestInflows.slice(0, 3);
  const outflows = snapshot.largestOutflows.slice(0, 3);
  const parts = [`Total TVL is ${fmtUsd(snapshot.totalTvl)}.`];
  if (inflows.length > 0) {
    parts.push(
      "Largest inflows: " +
        inflows.map((i) => `${i.symbol} (+${fmtUsd(i.usd)})`).join(", ")
    );
  }
  if (outflows.length > 0) {
    parts.push(
      "Largest outflows: " +
        outflows.map((o) => `${o.symbol} (-${fmtUsd(o.usd)})`).join(", ")
    );
  }
  return parts.join(" ");
}

function answerPools(pools: Pool[]): string {
  if (pools.length === 0) return "No pools are currently indexed.";
  const topApr = [...pools].sort((a, b) => b.apr - a.apr).slice(0, 3);
  const topHealth = [...pools].sort((a, b) => b.healthScore - a.healthScore).slice(0, 3);
  return [
    `${pools.length} pools indexed.`,
    "Top APR pools: " + topApr.map((p) => `${p.assetSymbol} (${p.apr.toFixed(2)}% APR)`).join(", "),
    "Healthiest pools: " + topHealth.map((p) => `${p.assetSymbol} (health ${p.healthScore.toFixed(1)})`).join(", "),
  ].join(" ");
}

function answerAssets(assets: Asset[]): string {
  if (assets.length === 0) return "No assets are currently indexed.";
  const topTvl = [...assets].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 3);
  const topGrowth = [...assets].sort((a, b) => b.growthScore - a.growthScore).slice(0, 3);
  const topHealth = [...assets].sort((a, b) => b.healthScore - a.healthScore).slice(0, 3);
  return [
    `${assets.length} xStocks indexed.`,
    "Top by TVL: " + topTvl.map((a) => `${a.symbol} (${fmtUsd(a.tvlUsd)})`).join(", "),
    "Top by growth: " + topGrowth.map((a) => `${a.symbol} (growth ${a.growthScore.toFixed(1)})`).join(", "),
    "Healthiest: " + topHealth.map((a) => `${a.symbol} (health ${a.healthScore.toFixed(1)})`).join(", "),
  ].join(" ");
}

function answerRisk(
  snapshot: EcosystemSnapshot,
  opps: Opportunity[]
): string {
  const risks = opps.filter((o) => o.kind === "risk");
  const parts: string[] = [];
  if (risks.length > 0) {
    parts.push(
      `${risks.length} risk flags: ` +
        risks.slice(0, 3).map((o) => `${o.title} (${o.explanation})`).join("; ")
    );
  } else {
    parts.push("No major risk flags detected.");
  }
  if (snapshot.marketConcentration > 0.3) {
    parts.push(`Concentration risk: HHI = ${snapshot.marketConcentration.toFixed(2)}.`);
  }
  return parts.join(" ");
}

function answerWatch(opps: Opportunity[]): string {
  const yieldOpps = opps.filter((o) => o.kind === "best_yield").slice(0, 2);
  const gems = opps.filter((o) => o.kind === "hidden_gem").slice(0, 2);
  const parts = ["This week, watch:"];
  for (const o of yieldOpps) parts.push(`• ${o.title} (yield)`);
  for (const o of gems) parts.push(`• ${o.title} (hidden gem)`);
  if (yieldOpps.length === 0 && gems.length === 0) {
    parts.push("• No standout opportunities — market is balanced.");
  }
  return parts.join(" ");
}

export function answerQuestion(
  question: string,
  snapshot: EcosystemSnapshot,
  assets: Asset[],
  pools: Pool[],
  opportunities: Opportunity[]
): AIInsight {
  let handler = "";
  for (const [pattern, name] of QUESTION_PATTERNS) {
    if (pattern.test(question)) {
      handler = name;
      break;
    }
  }

  if (handler === "daily_brief") return buildDailyBrief(snapshot, assets, pools);
  if (handler === "ecosystem_health") return buildEcosystemHealthSummary(snapshot, assets, pools);
  if (handler === "opportunity") return buildOpportunitySummary(opportunities);

  let body: string;
  switch (handler) {
    case "liquidity":
      body = answerLiquidity(snapshot);
      break;
    case "pools":
      body = answerPools(pools);
      break;
    case "assets":
      body = answerAssets(assets);
      break;
    case "risk":
      body = answerRisk(snapshot, opportunities);
      break;
    case "watch":
      body = answerWatch(opportunities);
      break;
    default:
      body =
        `I can answer questions about liquidity, pools, assets, opportunities, risks, or what to watch. ` +
        `Right now the ecosystem has ${fmtUsd(snapshot.totalTvl)} TVL across ${snapshot.assetCount} assets and ${snapshot.poolCount} pools.`;
  }

  return {
    kind: "ask",
    title: `Q: ${question}`,
    body,
    bullets: [],
    generatedAt: new Date().toISOString(),
    evidence: [{ metric: "question", value: question }],
  };
}

function round(x: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(x * f) / f;
}
