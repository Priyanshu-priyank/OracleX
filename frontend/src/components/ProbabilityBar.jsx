import { formatSHM } from "../utils/format";

const PRECISION = BigInt(1e18);

export default function ProbabilityBar({ market, size = "sm" }) {
  const reserves = (market.shareReserves || []).map((r) => {
    try { return BigInt(r || "0"); } catch { return 0n; }
  });
  const totalSets = BigInt(market.totalSets || "0");
  const n = market.options?.length || 0;

  const inverseReserves = reserves.map((r) => (r > 0n ? (PRECISION * PRECISION) / r : 0n));
  const sumInverses = inverseReserves.reduce((acc, v) => acc + v, 0n);

  const getPercent = (idx) => {
    if (n === 0) return 50; // Default fallback
    if (sumInverses === 0n) return Math.floor(100 / n);
    // Ensure we have a valid index before BigInt math
    const inv = inverseReserves[idx] || 0n;
    return Math.floor(Number((inv * 100n) / sumInverses));
  };

  const colors = [
    "from-emerald-400 to-emerald-500",
    "from-rose-400 to-rose-500",
    "from-amber-400 to-amber-500",
    "from-indigo-400 to-indigo-500",
    "from-teal-400 to-teal-500",
  ];

  if (!market.options?.length) return null;

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-[10px] font-black tracking-wider uppercase overflow-hidden gap-2">
        {market.options.map((opt, idx) => {
          const p = getPercent(idx);
          return (
            <span
              key={idx}
              className={
                idx === 0 ? "text-emerald-400" : idx === 1 ? "text-rose-400" : "text-[var(--ox-muted)]"
              }
            >
              {opt} {p}%
            </span>
          );
        })}
      </div>
      <div
        className={`w-full rounded-full bg-[#252b33] overflow-hidden shadow-inner flex ${size === "lg" ? "h-3" : "h-2"}`}
      >
        {market.options.map((_, idx) => {
          const p = getPercent(idx);
          if (p === 0) return null;
          return (
            <div
              key={idx}
              className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-700 ease-out`}
              style={{ width: `${p}%` }}
            />
          );
        })}
      </div>
      {size === "lg" && (
        <div className="flex justify-between text-[10px] text-[var(--ox-muted)] pt-1 font-black uppercase">
          <span>{market.options.length} outcomes</span>
          <span>Collateral: {formatSHM(totalSets)} SHM</span>
        </div>
      )}
    </div>
  );
}
