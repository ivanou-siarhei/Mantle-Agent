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
 */

import type { AIInsight, NarrativePost, NarrativeStage, NarrativeStat } from "./models";
import { classifyNarrative } from "./llm";

export const NARRATIVES = [
  "AI agents / x402",
  "Tokenized equities",
  "RFQ / deep liquidity",
  "Restaking / mETH",
  "Other",
] as const;

// keyword → narrative (deterministic rule-based classifier / fallback)
const KEYWORDS: Array<[string, RegExp]> = [
  ["AI agents / x402", /\b(ai agent|agentic|x402|erc-?8004|autonomous agent|questflow)\b/i],
  ["Tokenized equities", /\b(xstock|tokeniz(ed|ation)|spcx|tsla|nvda|aapl|equit|rwa|stock)\b/i],
  ["RFQ / deep liquidity", /\b(rfq|liquidity|fluxion|merchant moe|order ?book|spread|market maker|depth)\b/i],
  ["Restaking / mETH", /\b(restak|meth|mantle staked|lst|lrt|eigen)\b/i],
];

export function classifyRuleBased(text: string): string {
  for (const [label, re] of KEYWORDS) if (re.test(text)) return label;
  return "Other";
}

export const STAGE_LABEL: Record<NarrativeStage, string> = {
  breaking_out: "🔥 breaking out",
  emerging: "🚀 emerging",
  mainstream: "📊 mainstream",
  cooling: "📉 cooling",
};

function stageFor(deltaPct: number, breadth: number): NarrativeStage {
  if (deltaPct >= 100 && breadth <= 4) return "breaking_out";
  if (deltaPct > 15) return "emerging";
  if (deltaPct < -15) return "cooling";
  return "mainstream";
}

/**
 * Classify a batch of posts. Uses the LLM classifier when available and
 * the post is not confidently rule-matched; otherwise deterministic
 * keyword rules (so the demo always runs offline).
 */
export async function classifyPosts(posts: NarrativePost[], useLlm = false): Promise<NarrativePost[]> {
  const labels = [...NARRATIVES];
  const out: NarrativePost[] = [];
  for (const p of posts) {
    const ruled = classifyRuleBased(p.text);
    let label = ruled;
    if (useLlm && ruled === "Other") {
      const llm = await classifyNarrative(p.text, labels).catch(() => null);
      if (llm) label = llm;
    }
    out.push({ ...p, narrative: label });
  }
  return out;
}

export function computeNarrativeStats(
  current: NarrativePost[],
  prior: NarrativePost[]
): NarrativeStat[] {
  const byLabel = new Map<string, NarrativePost[]>();
  for (const p of current) {
    if (!byLabel.has(p.narrative)) byLabel.set(p.narrative, []);
    byLabel.get(p.narrative)!.push(p);
  }
  const priorCount = new Map<string, number>();
  for (const p of prior) priorCount.set(p.narrative, (priorCount.get(p.narrative) ?? 0) + 1);

  const stats: NarrativeStat[] = [];
  for (const [label, posts] of byLabel) {
    const mentions = posts.length;
    const mentionsPrior = priorCount.get(label) ?? 0;
    const deltaPct =
      mentionsPrior > 0
        ? ((mentions - mentionsPrior) / mentionsPrior) * 100
        : mentions > 0
          ? 100
          : 0;
    const reach = posts.reduce((s, p) => s + p.reach, 0);
    const breadth = new Set(posts.map((p) => p.source)).size;
    stats.push({
      narrative: label,
      mentions,
      mentionsPrior,
      deltaPct: Math.round(deltaPct),
      reach: Math.round(reach),
      breadth,
      stage: stageFor(deltaPct, breadth),
      sampleHeadlines: posts.slice(0, 2).map((p) => p.text),
    });
  }
  const stageRank: Record<NarrativeStage, number> = {
    breaking_out: 0,
    emerging: 1,
    mainstream: 2,
    cooling: 3,
  };
  return stats.sort(
    (a, b) => stageRank[a.stage] - stageRank[b.stage] || b.deltaPct - a.deltaPct
  );
}

function fmtPct(x: number): string {
  return `${x >= 0 ? "+" : ""}${x.toFixed(0)}%`;
}
function fmtReach(x: number): string {
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
  return String(x);
}

export function buildNarrativeRadar(stats: NarrativeStat[]): AIInsight {
  const bullets = stats.map(
    (s) =>
      `${s.narrative}: ${s.mentions} mentions (${fmtPct(s.deltaPct)} vs prior), reach ${fmtReach(s.reach)}, ${s.breadth} sources — ${STAGE_LABEL[s.stage]}.`
  );

  const breakingOut = stats
    .filter((s) => s.stage === "breaking_out")
    .sort((a, b) => b.deltaPct - a.deltaPct)[0];
  const mainstream = stats.find((s) => s.stage === "mainstream" || s.stage === "cooling");

  let body: string;
  if (breakingOut) {
    body = `"${breakingOut.narrative}" is the fastest-accelerating narrative (${fmtPct(breakingOut.deltaPct)} vs prior) and still under-covered relative to its speed — a prime window to publish before it goes mainstream`;
    body += mainstream
      ? ` like "${mainstream.narrative}". Cooling themes are lower-priority for new content.`
      : `.`;
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
    evidence: stats.map((s) => ({
      metric: s.narrative,
      value: `${fmtPct(s.deltaPct)} (${STAGE_LABEL[s.stage]})`,
    })),
  };
}
