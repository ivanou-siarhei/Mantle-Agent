import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";
import { answerQuestion } from "@/lib/intel/narrator";
import { answerWithContext } from "@/lib/intel/llm";
import { writeAiSummary } from "@/lib/intel/storage";
import type { AIInsight } from "@/lib/intel/models";

export const dynamic = "force-dynamic";

function fmtUsd(x: number): string {
  if (x >= 1_000_000_000) return `$${(x / 1_000_000_000).toFixed(2)}B`;
  if (x >= 1_000_000) return `$${(x / 1_000_000).toFixed(2)}M`;
  if (x >= 1_000) return `$${(x / 1_000).toFixed(1)}K`;
  return `$${x.toFixed(2)}`;
}

/**
 * Compact, fully-computed context handed to the LLM. Every number here
 * comes from the analytics layer — the model may only reason over these
 * figures, never invent new ones (enforced by the guardrail in llm.ts).
 */
function buildContext(): string {
  const s = cache.snapshot!;
  const lines: string[] = [];
  lines.push(
    `ECOSYSTEM: total TVL ${fmtUsd(s.totalTvl)}, 24h volume ${fmtUsd(s.totalVolume)}, ` +
      `${s.assetCount} assets, ${s.poolCount} pools, concentration HHI ${s.marketConcentration.toFixed(2)}.`
  );
  if (s.largestInflows.length) {
    lines.push(
      "INFLOWS: " +
        s.largestInflows.slice(0, 3).map((i) => `${i.symbol} +${fmtUsd(i.usd)}`).join(", ") +
        "."
    );
  }
  if (s.largestOutflows.length) {
    lines.push(
      "OUTFLOWS: " +
        s.largestOutflows.slice(0, 3).map((o) => `${o.symbol} -${fmtUsd(o.usd)}`).join(", ") +
        "."
    );
  }
  lines.push("ASSETS (tokenized equities):");
  for (const a of cache.assets.slice(0, 10)) {
    lines.push(
      `- ${a.symbol}: price $${a.price.toFixed(2)}, premium/discount ${a.premiumDiscount.toFixed(2)}%, ` +
        `TVL ${fmtUsd(a.tvlUsd)}, 24h vol ${fmtUsd(a.volume24h)}, ` +
        `liquidity ${a.liquidityScore.toFixed(0)}/100, health ${a.healthScore.toFixed(0)}/100, growth ${a.growthScore.toFixed(0)}/100.`
    );
  }
  lines.push("POOLS:");
  for (const p of cache.pools.slice(0, 8)) {
    lines.push(
      `- ${p.assetSymbol}: TVL ${fmtUsd(p.tvlUsd)}, 24h vol ${fmtUsd(p.volume24h)}, ` +
        `fees ${fmtUsd(p.fees24h)}, APR ${p.apr.toFixed(2)}%, vol/TVL ${p.volumeToTvl.toFixed(2)}, health ${p.healthScore.toFixed(0)}/100.`
    );
  }
  if (cache.narratives.length) {
    lines.push("NARRATIVES (7d momentum):");
    for (const n of cache.narratives) {
      lines.push(
        `- ${n.narrative}: ${n.mentions} mentions, ${n.deltaPct}% vs prior, reach ${n.reach}, ${n.breadth} sources, stage ${n.stage}.`
      );
    }
  }
  if (cache.opportunities.length) {
    lines.push("OPPORTUNITIES:");
    for (const o of cache.opportunities.slice(0, 6)) {
      lines.push(`- [${o.kind}] ${o.title} (score ${o.score.toFixed(0)}): ${o.explanation}`);
    }
  }
  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    await ensureLoaded();
    const body = await request.json();
    const question = String(body?.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    // Deterministic answer is always computed: it supplies verifiable
    // bullets/evidence and a safe fallback if the LLM is offline or its
    // answer trips the grounding guardrail.
    const ruleBased = answerQuestion(
      question,
      cache.snapshot!,
      cache.assets,
      cache.pools,
      cache.opportunities
    );

    // Free-form, data-grounded answer (null → use rule-based body).
    const llmBody = await answerWithContext(question, buildContext());

    const insight: AIInsight = llmBody ? { ...ruleBased, body: llmBody } : ruleBased;

    await writeAiSummary(insight);
    return NextResponse.json(insight);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
