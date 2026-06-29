import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureLoaded();
    return NextResponse.json({
      narratives: cache.narratives,
      brief: cache.narrativeBrief,
      lookbackDays: 7,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
