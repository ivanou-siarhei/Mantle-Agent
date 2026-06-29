import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";
import { buildDigestMarkdown } from "@/lib/intel/digest";
import { llmLabel } from "@/lib/intel/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureLoaded();
    const markdown = buildDigestMarkdown({
      snapshot: cache.snapshot!,
      assets: cache.assets,
      pools: cache.pools,
      narratives: cache.narratives,
      adapter: "SyntheticAdapter (sample data)",
      poolSource: cache.poolSourceLabel,
      llm: llmLabel(),
      take: cache.narrativeBrief?.body,
    });
    return NextResponse.json({ markdown });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
