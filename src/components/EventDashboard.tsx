"use client";

import { useEffect, useState, useCallback } from "react";
import { Event, Market, PricePoint } from "@/lib/polymarket";
import PriceChart from "./PriceChart";

interface Props {
  slug: string;
}

interface MarketRow {
  market: Market;
  currentPrice: number;
  change1h: number | null;
  change24h: number | null;
}

function parsePrices(raw: string[] | string | undefined): number[] {
  if (!raw) return [];
  const arr = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : raw;
  return (arr as string[]).map(Number);
}

function parseOutcomes(raw: string[] | string | undefined): string[] {
  if (!raw) return [];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  return raw;
}

function formatPct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function formatDelta(v: number | null) {
  if (v === null) return <span className="text-gray-500">—</span>;
  const pp = (v * 100).toFixed(2);
  const cls = v > 0.001 ? "text-green-400" : v < -0.001 ? "text-red-400" : "text-gray-400";
  return <span className={cls}>{v >= 0 ? "+" : ""}{pp}pp</span>;
}

async function fetchChangeForCondition(
  conditionId: string,
  secondsBack: number,
  fidelity: number
): Promise<number | null> {
  const now = Math.floor(Date.now() / 1000);
  const startTs = now - secondsBack;
  try {
    const r = await fetch(
      `/api/history?conditionId=${conditionId}&startTs=${startTs}&endTs=${now}&fidelity=${fidelity}`
    );
    const pts: PricePoint[] = await r.json();
    if (!Array.isArray(pts) || pts.length < 2) return null;
    const sorted = [...pts].sort((a, b) => a.t - b.t);
    return sorted[sorted.length - 1].p - sorted[0].p;
  } catch {
    return null;
  }
}

export default function EventDashboard({ slug }: Props) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [loadingChanges, setLoadingChanges] = useState(false);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRows([]);
    setSelectedMarket(null);
    try {
      const r = await fetch(`/api/event?slug=${encodeURIComponent(slug)}`);
      const events: Event[] = await r.json();
      if (!Array.isArray(events) || events.length === 0) {
        setError("Event not found. Check the URL and try again.");
        setLoading(false);
        return;
      }
      const ev = events[0];
      setEvent(ev);

      const markets = ev.markets || [];
      // Build initial rows with current prices
      const initialRows: MarketRow[] = markets.map((m) => {
        const prices = parsePrices(m.outcomePrices as string[] | string | undefined);
        return { market: m, currentPrice: prices[0] ?? 0, change1h: null, change24h: null };
      });
      setRows(initialRows);
      if (initialRows.length > 0) setSelectedMarket(initialRows[0].market);
      setLoading(false);

      // Now fetch changes async
      setLoadingChanges(true);
      const updatedRows = await Promise.all(
        initialRows.map(async (row) => {
          if (!row.market.conditionId) return row;
          const [c1h, c24h] = await Promise.all([
            fetchChangeForCondition(row.market.conditionId, 3600, 1),
            fetchChangeForCondition(row.market.conditionId, 86400, 10),
          ]);
          return { ...row, change1h: c1h, change24h: c24h };
        })
      );
      setRows(updatedRows);
      setLoadingChanges(false);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading event…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <p className="text-gray-500 text-xs">Try pasting a Polymarket event URL above</p>
      </div>
    );
  }

  if (!event) return null;

  const outcomes = rows.length > 0 ? parseOutcomes(rows[0].market.outcomes as string[] | string | undefined) : [];
  const isMultiOutcome = outcomes.length > 2;

  return (
    <div className="space-y-6">
      {/* Event header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white leading-snug">{event.title}</h2>
          {event.endDate && (
            <p className="text-xs text-gray-500 mt-1">
              Closes {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        <a
          href={`https://polymarket.com/event/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg"
        >
          View on Polymarket →
        </a>
      </div>

      {/* Odds table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Outcome</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Yes %</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">1h</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">24h</th>
              <th className="px-4 py-3 w-32 hidden sm:table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selectedMarket?.id === row.market.id;
              // For multi-outcome per market, show each outcome
              const marketOutcomes = parseOutcomes(row.market.outcomes as string[] | string | undefined);
              const prices = parsePrices(row.market.outcomePrices as string[] | string | undefined);
              const label = marketOutcomes.length > 0 ? marketOutcomes[0] : row.market.question;
              // Use the short question label for grouped events (e.g. "By March 7?")
              const shortLabel = row.market.question.replace(/^Iran x Israel\/US conflict ends by\s*/i, "By ");

              return (
                <tr
                  key={row.market.id}
                  onClick={() => setSelectedMarket(row.market)}
                  className={`border-b border-white/5 cursor-pointer transition-colors last:border-0 ${
                    isSelected
                      ? "bg-blue-900/30"
                      : "hover:bg-white/5"
                  }`}
                >
                  <td className="px-4 py-3 text-white font-medium">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      )}
                      <span className="line-clamp-1">{shortLabel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-base font-bold ${
                        row.currentPrice >= 0.5 ? "text-green-400" : "text-orange-400"
                      }`}
                    >
                      {formatPct(row.currentPrice)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {loadingChanges && row.change1h === null ? (
                      <span className="text-gray-600">…</span>
                    ) : (
                      formatDelta(row.change1h)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    {loadingChanges && row.change24h === null ? (
                      <span className="text-gray-600">…</span>
                    ) : (
                      formatDelta(row.change24h)
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                        style={{ width: `${Math.min(100, row.currentPrice * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      {selectedMarket && selectedMarket.conditionId && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/10">
          <PriceChart
            conditionId={selectedMarket.conditionId}
            question={selectedMarket.question}
          />
        </div>
      )}
    </div>
  );
}
