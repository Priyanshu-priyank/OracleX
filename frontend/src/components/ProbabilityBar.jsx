import { formatSHM } from "../utils/format";

export default function ProbabilityBar({ market, size = "sm" }) {
  const pools     = market.pools.map(p => BigInt(p));
  const totalPool = BigInt(market.totalPool || "0");
  
  const getPercent = (pool) => {
    if (totalPool === 0n) return Math.floor(100 / market.options.length);
    return Math.floor(Number((pool * 100n) / totalPool));
  };

  const colors = [
    "from-emerald-400 to-emerald-500",
    "from-rose-400 to-rose-500",
    "from-amber-400 to-amber-500",
    "from-indigo-400 to-indigo-500",
    "from-teal-400 to-teal-500",
  ];

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-[10px] font-black tracking-wider uppercase overflow-hidden gap-2">
        {market.options.map((opt, idx) => {
          const p = getPercent(pools[idx]);
          return (
            <span key={idx} className={idx === 0 ? "text-emerald-500" : idx === 1 ? "text-rose-500" : "text-gray-500"}>
              {opt} {p}%
            </span>
          );
        })}
      </div>
      <div className={`w-full rounded-full bg-gray-100 overflow-hidden shadow-inner flex ${size === "lg" ? "h-3" : "h-2"}`}>
        {market.options.map((_, idx) => {
          const p = getPercent(pools[idx]);
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
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400 pt-1 font-bold uppercase">
          {market.options.map((opt, idx) => (
            <span key={idx}>{formatSHM(pools[idx])} {opt}</span>
          ))}
          <span className="ml-auto">Total: {formatSHM(totalPool)} SHM</span>
        </div>
      )}
    </div>
  );
}
