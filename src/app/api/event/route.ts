import { NextResponse } from "next/server";
import { fetchEventBySlug } from "@/lib/polymarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "";
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  try {
    const events = await fetchEventBySlug(slug);
    return NextResponse.json(events);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
