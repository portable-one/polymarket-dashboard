"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { PricePoint } from "@/lib/polymarket";

interface Props {
  conditionId: string;
  question?: string;
}

type Range = "1h" | "6h" | "24h" | "7d" | "30d" | "all";

const RANGES: { label: string; value: Range; seconds: number; fidelity: number }[] = [
  { label: "1H", value: "1h", seconds: 3600, fidelity: 1 },
  { label: "6H", value: "6h", seconds: 6 * 3600, fidelity: 5 },
  { label: "24H", value: "24h", seconds: 24 * 3600, fidelity: 10 },
  { label: "7D", value: "7d", seconds: 7 * 24 * 3600, fidelity: 60 },
  { label: "30D", value: "30d", seconds: 30 * 24 * 3600, fidelity: 360 },
  { label: "All", value: "all", seconds: 365 * 24 * 3600, fidelity: 1440 },
];

function formatTs(ts: number, range: Range): string {
  const d = new Date(ts * 1000);
  if (range === "1h" || range === "6h") return format(d, "HH:mm");
  if (range === "24h") return format(d, "HH:mm");
  if (range === "7d") return format(d, "EEE HH:mm");
  return format(d, "MMM d");
}

interface ChartData {
  t: number;
  p: number;
  label: string;
}

export default function PriceChart({ conditionId, question }: Props) {
  const [range, setRange] = useState<Range>("24h");
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [change1h, setChange1h] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);

  useEffect(() => {
    if (!conditionId) return;
    setLoading(true);
    setError(null);

    const now = Math.floor(Date.now() / 1000);
    const rangeCfg = RANGES.find((r) => r.value === range)!;
    const startTs = now - rangeCfg.seconds;

    fetch(
      `/api/history?conditionId=${conditionId}&startTs=${startTs}&endTs=${now}&fidelity=${rangeCfg.fidelity}`
    )
      .then((r) => r.json())
      .then((pts: PricePoint[]) => {
        if (!Array.isArray(pts)) {
          setError("No data");
          setLoading(false);
          return;
        }
        const sorted = [...pts].sort((a, b) => a.t - b.t);
        setData(sorted.map((p) => ({ ...p, label: formatTs(p.t, range) })));
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [conditionId, range]);

  // Compute 1h and 24h changes when we have data
  useEffect(() => {
    if (!conditionId) return;
    const now = Math.floor(Date.now() / 1000);

    Promise.all([
      fetch(`/api/history?conditionId=${conditionId}&startTs=${now - 3600}&endTs=${now}&fidelity=1`).then((r) => r.json()),
      fetch(`/api/history?conditionId=${conditionId}&startTs=${now - 86400}&endTs=${now}&fidelity=10`).then((r) => r.json()),
    ]).then(([pts1h, pts24h]: [PricePoint[], PricePoint[]]) => {
      const cur = data.length > 0 ? data[data.length - 1].p : null;
      if (Array.isArray(pts1h) && pts1h.length > 0 && cur !== null) {
        const old = pts1h[0].p;
        setChange1h(cur - old);
      }
      if (Array.isArray(pts24h) && pts24h.length > 0 && cur !== null) {
        const old = pts24h[0].p;
        setChange24h(cur - old);
      }
    }).catch(() => {});
  }, [conditionId, data]);

  const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const formatDelta = (v: number) =>
    `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2)}pp`;
  const deltaColor = (v: number) =>
    v > 0 ? "text-green-400" : v < 0 ? "text-red-400" : "text-gray-400";

  const currentPrice = data.length > 0 ? data[data.length - 1].p : null;

  return (
    <div className="p-4">
      {question && (
        <h3 className="text-sm font-medium text-gray-300 mb-3 line-clamp-1">
          {question}
        </h3>
      )}

      {/* Price + deltas */}
      {currentPrice !== null && (
        <div className="flex items-center gap-4 mb-4">
          <span className="text-3xl font-bold text-white">
            {formatPct(currentPrice)}
          </span>
          {change1h !== null && (
            <div className="text-xs">
              <span className="text-gray-500">1H </span>
              <span className={deltaColor(change1h)}>{formatDelta(change1h)}</span>
            </div>
          )}
          {change24h !== null && (
            <div className="text-xs">
              <span className="text-gray-500">24H </span>
              <span className={deltaColor(change24h)}>{formatDelta(change24h)}</span>
            </div>
          )}
        </div>
      )}

      {/* Range selector */}
      <div className="flex gap-1 mb-4">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              range === r.value
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Loading…
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-400 text-sm">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${conditionId.slice(2, 10)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                domain={([dataMin, dataMax]: readonly [number, number]) => {
                  const pad = Math.max((dataMax - dataMin) * 0.15, 0.02);
                  return [Math.max(0, dataMin - pad), Math.min(1, dataMax + pad)] as [number, number];
                }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(v: number | undefined) => [`${((v ?? 0) * 100).toFixed(2)}%`, "Yes"]}
              />
              <Area
                type="monotone"
                dataKey="p"
                stroke="#3b82f6"
                strokeWidth={2}
                fill={`url(#grad-${conditionId.slice(2, 10)})`}
                dot={false}
                activeDot={{ r: 3, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
