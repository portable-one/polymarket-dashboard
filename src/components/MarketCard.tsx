"use client";

import { Market } from "@/lib/polymarket";
import { useState } from "react";
import PriceChart from "./PriceChart";

interface Props {
  market: Market;
  featured?: boolean;
}

function formatVolume(v: number | string): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPct(price: string | number): string {
  const p = typeof price === "string" ? parseFloat(price) : price;
  return `${(p * 100).toFixed(1)}%`;
}

function parsePrices(raw: string[] | string | undefined): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw;
}

function parseOutcomes(raw: string[] | string | undefined): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw;
}

function parseTokenIds(raw: string[] | string | undefined): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw;
}

function getProbability(market: Market): number {
  const prices = parsePrices(market.outcomePrices as string[] | string | undefined);
  if (!prices.length) return 0;
  return parseFloat(prices[0]);
}

export default function MarketCard({ market, featured }: Props) {
  const [expanded, setExpanded] = useState(false);
  const prob = getProbability(market);
  const outcomes = parseOutcomes(market.outcomes as string[] | string | undefined);
  const isMultiOutcome = outcomes.length > 2;
  const prices = parsePrices(market.outcomePrices as string[] | string | undefined).map((p) => parseFloat(p));

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer hover:border-blue-500/60 ${
        featured
          ? "border-blue-500/40 bg-blue-950/20"
          : "border-white/10 bg-white/5"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white leading-snug line-clamp-2">
              {market.question}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>Vol {formatVolume(market.volume)}</span>
              {market.volume24hr !== undefined && (
                <span>24h {formatVolume(market.volume24hr)}</span>
              )}
              {market.liquidity && (
                <span>Liq {formatVolume(market.liquidity)}</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            {isMultiOutcome ? (
              <div className="space-y-0.5">
                {outcomes.slice(0, 3).map((o, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400 max-w-[80px] truncate">{o}</span>
                    <span className="font-bold text-white">{formatPct(prices[i] ?? 0)}</span>
                  </div>
                ))}
                {outcomes.length > 3 && (
                  <p className="text-xs text-gray-500">+{outcomes.length - 3} more</p>
                )}
              </div>
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    prob >= 0.5 ? "text-green-400" : "text-orange-400"
                  }`}
                >
                  {formatPct(prob)}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Yes</div>
              </>
            )}
          </div>
        </div>

        {!isMultiOutcome && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                style={{ width: `${prob * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {expanded && parseTokenIds(market.clobTokenIds as string[] | string | undefined)[0] && (
        <div
          className="border-t border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <PriceChart
            conditionId={parseTokenIds(market.clobTokenIds as string[] | string | undefined)[0]}
            question={market.question}
          />
        </div>
      )}
    </div>
  );
}
