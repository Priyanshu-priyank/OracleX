import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";
import { formatSHM } from "../utils/format";

const PRECISION = BigInt(1e18);

const COLORS = [
  { stroke: "#10b981", fill: "rgba(16,185,129,0.15)" },   // emerald
  { stroke: "#f43f5e", fill: "rgba(244,63,94,0.15)" },     // rose
  { stroke: "#f59e0b", fill: "rgba(245,158,11,0.15)" },    // amber
  { stroke: "#6366f1", fill: "rgba(99,102,241,0.15)" },    // indigo
  { stroke: "#14b8a6", fill: "rgba(20,184,166,0.15)" },    // teal
];

function getPercentages(shareReserves) {
  const reserves = shareReserves.map(r => BigInt(r));
  const inverses = reserves.map(r => r > 0n ? PRECISION * PRECISION / r : 0n);
  const sum = inverses.reduce((a, b) => a + b, 0n);
  if (sum === 0n) return reserves.map(() => Math.floor(100 / reserves.length));
  return inverses.map(inv => Math.round(Number((inv * 10000n) / sum) / 100));
}

export default function OddsChart({ market }) {
  const HISTORY_KEY = `oraclex_odds_history_${market.id}`;
  const [history, setHistory] = useState([]);

  // Load existing history
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, [HISTORY_KEY]);

  // Record a new data point whenever shareReserves change
  useEffect(() => {
    if (!market.shareReserves) return;

    const percentages = getPercentages(market.shareReserves);
    const now = Date.now();
    
    const point = { time: now };
    market.options.forEach((opt, i) => {
      point[opt] = percentages[i];
    });

    setHistory(prev => {
      // Only add if at least 5 seconds since last point
      const lastPoint = prev[prev.length - 1];
      if (lastPoint && now - lastPoint.time < 5000) return prev;

      const updated = [...prev, point].slice(-200); // Keep last 200 points
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [market.shareReserves, market.options, HISTORY_KEY]);

  // Generate seed data if history is too short for a nice chart
  const chartData = useMemo(() => {
    if (history.length >= 3) return history;
    
    // Generate simulated historical data for demo purposes
    const now = Date.now();
    const createdAt = Number(market.createdAt) * 1000 || now - 86400000;
    const span = now - createdAt;
    const points = [];
    const numPoints = 30;
    
    for (let i = 0; i < numPoints; i++) {
      const t = createdAt + (span / numPoints) * i;
      const point = { time: t };
      const currentPcts = getPercentages(market.shareReserves);
      
      market.options.forEach((opt, idx) => {
        // Start from equal odds and drift toward current
        const equalOdds = 100 / market.options.length;
        const progress = i / numPoints;
        const noise = (Math.sin(i * 1.7 + idx * 3.1) * 5) + (Math.cos(i * 0.9 + idx * 2.3) * 3);
        point[opt] = Math.max(1, Math.min(95, Math.round(
          equalOdds + (currentPcts[idx] - equalOdds) * progress + noise * (1 - progress * 0.5)
        )));
      });
      points.push(point);
    }

    // Add current real point
    const currentPoint = { time: now };
    const currentPcts = getPercentages(market.shareReserves);
    market.options.forEach((opt, idx) => {
      currentPoint[opt] = currentPcts[idx];
    });
    points.push(currentPoint);
    
    return points;
  }, [history, market]);

  const currentPcts = getPercentages(market.shareReserves);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl text-xs">
        <div className="text-gray-400 font-bold mb-2">{new Date(label).toLocaleString()}</div>
        {payload.map((entry, i) => (
          <div key={i} className="flex justify-between gap-6 font-bold" style={{ color: entry.stroke }}>
            <span>{entry.name}</span>
            <span>{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-5">
      {/* Header — Current Odds */}
      <div className="space-y-4">
        {market.options.map((opt, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length].stroke }} />
              <span className="text-sm font-bold text-gray-200">{opt}</span>
            </div>
            <span className="text-2xl font-black text-white">{currentPcts[idx]}%</span>
          </div>
        ))}
      </div>

      {/* Legend dots inline */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-gray-500 border-t border-gray-800 pt-3">
        {market.options.map((opt, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[idx % COLORS.length].stroke }} />
            {opt} {currentPcts[idx]}%
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              {market.options.map((opt, idx) => (
                <linearGradient key={idx} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[idx % COLORS.length].stroke} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[idx % COLORS.length].stroke} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 700 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {market.options.map((opt, idx) => (
              <Area
                key={idx}
                type="monotone"
                dataKey={opt}
                stroke={COLORS[idx % COLORS.length].stroke}
                fill={`url(#gradient-${idx})`}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "#111827" }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest border-t border-gray-800 pt-3">
        <span>{formatSHM(market.totalSets)} SHM Collateral</span>
        <span>OracleX Live Odds</span>
      </div>
    </div>
  );
}
