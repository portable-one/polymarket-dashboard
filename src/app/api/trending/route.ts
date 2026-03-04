import { NextResponse } from "next/server";
import { fetchTrendingMarkets } from "@/lib/polymarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  try {
    const markets = await fetchTrendingMarkets(limit);
    return NextResponse.json(markets);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
