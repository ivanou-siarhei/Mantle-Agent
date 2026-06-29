import { NextResponse } from "next/server";
import { llmAvailable, llmLabel } from "@/lib/intel/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    ts: new Date().toISOString(),
    llmAvailable: llmAvailable(),
    llmLabel: llmLabel(),
  });
}
