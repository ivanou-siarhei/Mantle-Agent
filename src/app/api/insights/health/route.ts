import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";
import { buildEcosystemHealthSummary } from "@/lib/intel/narrator";
import { rewriteInsight } from "@/lib/intel/llm";
import { writeAiSummary } from "@/lib/intel/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureLoaded();
    const insight = await rewriteInsight(
      buildEcosystemHealthSummary(cache.snapshot!, cache.assets, cache.pools)
    );
    await writeAiSummary(insight);
    return NextResponse.json(insight);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
