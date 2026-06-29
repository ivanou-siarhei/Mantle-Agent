import { NextResponse } from "next/server";
import { cache } from "@/lib/intel/cache";
import { ensureLoaded } from "@/lib/intel/refresh";
import { listAssetHistory } from "@/lib/intel/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    await ensureLoaded();
    const { symbol } = await params;
    const a = cache.assets.find((x) => x.symbol.toLowerCase() === symbol.toLowerCase());
    if (!a) {
      return NextResponse.json({ error: "asset not found" }, { status: 404 });
    }
    const history = await listAssetHistory(a.symbol, 168);
    return NextResponse.json({ asset: a, history });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
