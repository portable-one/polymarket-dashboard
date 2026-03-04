"use client";

import SearchBar from "@/components/SearchBar";
import TrendingSection from "@/components/TrendingSection";
import IranSection from "@/components/IranSection";
import { useState } from "react";

type Tab = "trending" | "iran";

export default function Home() {
  const [tab, setTab] = useState<Tab>("trending");

  return (
    <div className="min-h-screen" style={{ background: "#060e1e" }}>
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-40" style={{ background: "rgba(6,14,30,0.95)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tight">Polymarket</span>
            <span className="text-xl font-bold text-blue-400">Dashboard</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Search */}
        <SearchBar />

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 pb-px">
          {(["trending", "iran"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                tab === t
                  ? "text-white border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t === "trending" ? "🔥 Trending" : "🇮🇷 Iran / Mid-East"}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "trending" && <TrendingSection />}
        {tab === "iran" && <IranSection />}
      </main>

      <footer className="border-t border-white/5 mt-16 py-6 text-center text-xs text-gray-600">
        Data from Polymarket · Not financial advice
      </footer>
    </div>
  );
}
