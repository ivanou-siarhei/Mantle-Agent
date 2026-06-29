import { NextResponse } from "next/server";
import { refreshEcosystem } from "@/lib/intel/refresh";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const r = await refreshEcosystem();
    return NextResponse.json(r);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
