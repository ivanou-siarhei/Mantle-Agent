import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureLoaded();
    const url = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));
    const source = cache.poolSourceLabel ?? cache.sourceLabel ?? "";
    return NextResponse.json({
      pools: cache.pools.slice(0, limit),
      total: cache.pools.length,
      source,
      // Live when the pool source is the DefiLlama adapter (not the sample fallback).
      live: source.length > 0 && !/sample data/i.test(source),
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
