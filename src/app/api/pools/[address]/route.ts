import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";
import { listPoolHistory } from "@/lib/intel/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    await ensureLoaded();
    const { address } = await params;
    const p = cache.pools.find((x) => x.address.toLowerCase() === address.toLowerCase());
    if (!p) {
      return NextResponse.json({ error: "pool not found" }, { status: 404 });
    }
    const history = await listPoolHistory(p.address, 168);
    return NextResponse.json({ pool: p, history });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
