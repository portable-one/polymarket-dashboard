"use client";

import { useState, useRef, useEffect } from "react";
import { Market } from "@/lib/polymarket";
import MarketCard from "./MarketCard";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleInput(v: string) {
    setQuery(v);
    if (timer.current) clearTimeout(timer.current);
    if (!v.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(v)}&limit=8`);
        const data = await r.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  return (
    <div ref={ref} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search any Polymarket bet…"
          className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full z-50 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
          <div className="p-2 space-y-2">
            {results.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
