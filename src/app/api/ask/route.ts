import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";
import { answerQuestion } from "@/lib/intel/narrator";
import { rewriteInsight } from "@/lib/intel/llm";
import { writeAiSummary } from "@/lib/intel/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureLoaded();
    const body = await request.json();
    const question = String(body?.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }
    const insight = await rewriteInsight(
      answerQuestion(question, cache.snapshot!, cache.assets, cache.pools, cache.opportunities)
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
