"use client";

import { useEffect, useState } from "react";
import { Market } from "@/lib/polymarket";
import MarketCard from "./MarketCard";

function formatVolume(v: number | string): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function TrendingSection() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trending?limit=20")
      .then((r) => r.json())
      .then((data) => {
        setMarkets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  // Top 3 featured hottest markets
  const hot = markets.slice(0, 3);
  const rest = markets.slice(3);

  return (
    <div className="space-y-6">
      {/* Hot picks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🔥</span>
          <h3 className="text-sm font-semibold text-gray-300">Hottest Right Now</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {hot.map((m) => (
            <MarketCard key={m.id} market={m} featured />
          ))}
        </div>
      </div>

      {/* Trending grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Trending by 24h Volume</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rest.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
