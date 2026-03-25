import { yesPercent, formatSHM } from "../utils/format";

export default function ProbabilityBar({ market, size = "sm" }) {
  const pct   = yesPercent(market);
  const total = (BigInt(market.yesPool) + BigInt(market.noPool)).toString();

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-xs font-bold tracking-wide">
        <span className="text-emerald-500 uppercase">{market.optionA || "YES"} {pct}%</span>
        <span className="text-rose-500 uppercase">{market.optionB || "NO"} {100 - pct}%</span>
      </div>
      <div className={`w-full rounded-full bg-gray-100 overflow-hidden shadow-inner ${size === "lg" ? "h-3" : "h-2"}`}>
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {size === "lg" && (
        <div className="flex justify-between text-xs text-gray-400 pt-1 font-medium">
          <span>{formatSHM(market.yesPool)} {market.optionA || "YES"}</span>
          <span>Pool: {formatSHM(total)} SHM</span>
          <span>{formatSHM(market.noPool)} {market.optionB || "NO"}</span>
        </div>
      )}
    </div>
  );
}
