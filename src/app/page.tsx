"use client";

import { useState } from "react";
import EventDashboard from "@/components/EventDashboard";

const DEFAULT_SLUG = "iran-x-israelus-conflict-ends-by";

function parseSlug(input: string): string {
  const trimmed = input.trim();
  // Handle full polymarket URL: https://polymarket.com/event/some-slug
  const urlMatch = trimmed.match(/polymarket\.com\/event\/([^/?#]+)/);
  if (urlMatch) return urlMatch[1];
  // Handle path like /event/some-slug
  const pathMatch = trimmed.match(/\/event\/([^/?#]+)/);
  if (pathMatch) return pathMatch[1];
  // Handle bare slug
  if (trimmed && !trimmed.includes(" ")) return trimmed;
  return trimmed;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [slug, setSlug] = useState(DEFAULT_SLUG);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseSlug(input);
    if (parsed) setSlug(parsed);
  }

  return (
    <div className="min-h-screen" style={{ background: "#060e1e" }}>
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-40" style={{ background: "rgba(6,14,30,0.95)" }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* URL Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a Polymarket event URL or slug…"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Load
          </button>
        </form>

        {/* Dashboard */}
        <EventDashboard slug={slug} />
      </main>

      <footer className="border-t border-white/5 mt-16 py-6 text-center text-xs text-gray-600">
        Data from Polymarket · Not financial advice
      </footer>
    </div>
  );
}
