import { NextResponse } from "next/server";
import { listSnapshots } from "@/lib/intel/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(2000, Math.max(1, parseInt(url.searchParams.get("limit") ?? "168", 10)));
    const snapshots = await listSnapshots(limit);
    return NextResponse.json({ snapshots });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
