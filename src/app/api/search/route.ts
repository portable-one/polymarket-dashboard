import { NextResponse } from "next/server";
import { searchMarkets } from "@/lib/polymarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  if (!q) return NextResponse.json([]);
  try {
    const markets = await searchMarkets(q, limit);
    return NextResponse.json(markets);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
