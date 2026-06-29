import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureLoaded();
    const snap = cache.snapshot!;
    return NextResponse.json({
      snapshot: snap,
      topAssets: cache.assets.slice(0, 5),
      topPools: cache.pools.slice(0, 5),
      opportunityCounts: {
        best_yield: cache.opportunities.filter((o) => o.kind === "best_yield").length,
        hidden_gem: cache.opportunities.filter((o) => o.kind === "hidden_gem").length,
        liquidity: cache.opportunities.filter((o) => o.kind === "liquidity").length,
        risk: cache.opportunities.filter((o) => o.kind === "risk").length,
      },
      lastRefreshed: cache.lastRefreshed,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
