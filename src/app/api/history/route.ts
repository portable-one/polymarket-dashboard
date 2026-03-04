import { NextResponse } from "next/server";
import { fetchPriceHistory } from "@/lib/polymarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conditionId = searchParams.get("conditionId") || "";
  const startTs = parseInt(searchParams.get("startTs") || "0");
  const endTs = parseInt(searchParams.get("endTs") || String(Math.floor(Date.now() / 1000)));
  const fidelity = parseInt(searchParams.get("fidelity") || "60");

  if (!conditionId) return NextResponse.json({ error: "conditionId required" }, { status: 400 });
  try {
    const history = await fetchPriceHistory(conditionId, startTs, endTs, fidelity);
    return NextResponse.json(history);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
