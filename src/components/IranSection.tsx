"use client";

import { useEffect, useMemo, useState } from "react";
import { Event, Market } from "@/lib/polymarket";

function parseTokenIds(raw: string[] | string | undefined): string[] {
  if (!raw) return [];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  return raw;
}
import PriceChart from "./PriceChart";
import MarketCard from "./MarketCard";

const CONFLICT_MARKETS = [
  { label: "By Mar 7", conditionId: "0x4fad2d024d0a82efa02dcef616a30739eb6cb5c5f088ec92a4ffbc7bda6f69b1", yesPrice: 0.0315, endDate: "Mar 7" },
  { label: "By Mar 15", conditionId: "0xc5dee81018bb9a94aeeae933e3824b534fad8aaadbd342c2a518e1eddbf88593", yesPrice: 0.155, endDate: "Mar 15" },
  { label: "By Mar 31", conditionId: "0x5a200d7d560169d60dc82cd16bb14c16f36f029fdf609dcb92d06a554f9f0fe1", yesPrice: 0.365, endDate: "Mar 31" },
  { label: "By May 15", conditionId: "0xd73f60114a0e7169a55082daef1228cb27fa50c939eea22cb0589f6bac6ce5d3", yesPrice: 0.655, endDate: "May 15" },
  { label: "By Jun 30", conditionId: "0x136f5a0c27a62cf9a2e40a4f48425e43d61b9571a53a2529372c0065f3218a73", yesPrice: 0.735, endDate: "Jun 30" },
];

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function BarChart({ markets }: { markets: typeof CONFLICT_MARKETS }) {
  return (
    <div className="space-y-2">
      {markets.map((m) => (
        <div key={m.conditionId} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-16 shrink-0">{m.label}</span>
          <div className="flex-1 h-5 rounded bg-white/5 overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
              style={{ width: pct(m.yesPrice) }}
            />
            <span className="absolute right-2 inset-y-0 flex items-center text-xs font-semibold text-white">
              {pct(m.yesPrice)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IranSection() {
  const [selectedIdx, setSelectedIdx] = useState(2); // default to Mar 31
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetch("/api/iran")
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  const selected = CONFLICT_MARKETS[selectedIdx];

  // Build conditionId -> clobTokenId lookup from fetched events
  const tokenLookup = useMemo(() => {
    const map: Record<string, string> = {};
    events.flatMap((e) => e.markets || []).forEach((m) => {
      const tokenIds = parseTokenIds(m.clobTokenIds as string[] | string | undefined);
      if (m.conditionId && tokenIds[0]) {
        map[m.conditionId] = tokenIds[0];
      }
    });
    return map;
  }, [events]);

  const selectedTokenId = tokenLookup[selected.conditionId];

  // Extra related markets from events
  const relatedMarkets: Market[] = events
    .filter((e) => e.id !== "conflict-main")
    .flatMap((e) => e.markets || [])
    .slice(0, 6);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl">🇮🇷</div>
        <div>
          <h2 className="text-xl font-bold text-white">Iran / Middle East</h2>
          <p className="text-xs text-gray-400">Iran × Israel/US conflict resolution odds</p>
        </div>
      </div>

      {/* Conflict Resolution Overview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">
            Iran × Israel/US Conflict Ends By…
          </h3>
          <a
            href="https://polymarket.com/event/iran-x-israelus-conflict-ends-by"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            View on Polymarket →
          </a>
        </div>

        <BarChart markets={CONFLICT_MARKETS} />

        {/* Tab selector for chart */}
        <div className="flex gap-2 mt-5 mb-1">
          {CONFLICT_MARKETS.map((m, i) => (
            <button
              key={m.conditionId}
              onClick={() => setSelectedIdx(i)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedIdx === i
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Chart for selected sub-market */}
      {selectedTokenId && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/10 mb-6">
          <PriceChart
            conditionId={selectedTokenId}
            question={`Conflict ends ${selected.label} — Yes probability`}
          />
        </div>
      )}

      {/* Related Iran events */}
      {!loadingEvents && relatedMarkets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Related Markets</h3>
          <div className="grid gap-3">
            {relatedMarkets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
