import { NextResponse } from "next/server";
import { fetchEventBySlug, fetchEventsByTag } from "@/lib/polymarket";

export async function GET() {
  try {
    const [conflictEvents, iranTagEvents] = await Promise.allSettled([
      fetchEventBySlug("iran-x-israelus-conflict-ends-by"),
      fetchEventsByTag("iran", 10),
    ]);

    const conflict = conflictEvents.status === "fulfilled" ? conflictEvents.value : [];
    const iranTag = iranTagEvents.status === "fulfilled" ? iranTagEvents.value : [];

    // Deduplicate by id
    const seen = new Set<string>();
    const all = [...conflict, ...iranTag].filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    return NextResponse.json(all);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
