import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";
import type { OpportunityKind } from "@/lib/intel/models";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureLoaded();
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") as OpportunityKind | null;
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    let items = cache.opportunities;
    if (kind) items = items.filter((o) => o.kind === kind);
    return NextResponse.json({
      opportunities: items.slice(0, limit),
      total: items.length,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
