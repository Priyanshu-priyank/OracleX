import { useNavigate } from "react-router-dom";
import ProbabilityBar from "./ProbabilityBar";
import { timeLeft, formatSHM, statusLabel } from "../utils/format";

const STATUS_COLORS = {
  0: "bg-emerald-50 text-emerald-700 border-emerald-100",
  1: "bg-blue-50 text-blue-700 border-blue-100",
  2: "bg-orange-50 text-orange-700 border-orange-100",
};

const CATEGORY_COLORS = {
  Crypto: "bg-amber-50 text-amber-700",
  Sports: "bg-teal-50 text-teal-700",
  Politics: "bg-rose-50 text-rose-600",
  Finance: "bg-blue-50 text-blue-700",
  "Daily Life": "bg-purple-50 text-purple-700",
  Other: "bg-gray-100 text-gray-600",
};

export default function MarketCard({ market }) {
  const navigate = useNavigate();
  const total    = (BigInt(market.yesPool) + BigInt(market.noPool)).toString();

  return (
    <div
      onClick={() => navigate(`/market/${market.id}`)}
      className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-white hover:shadow-premium hover:border-purple-200 transition-all cursor-pointer group"
    >
      {/* Top row */}
      <div className="flex justify-between items-start gap-2">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${CATEGORY_COLORS[market.category] ?? CATEGORY_COLORS.Other}`}>
          {market.category}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[market.status]}`}>
          {statusLabel(market.status)}
        </span>
      </div>

      {/* Question */}
      <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors">
        {market.question}
      </h3>

      {/* Probability bar */}
      <ProbabilityBar market={market} size="sm" />

      {/* Bottom meta */}
      <div className="flex justify-between items-center text-xs font-medium text-gray-400 pt-2 border-t border-gray-50">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {formatSHM(total)} SHM
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {market.status === 0 ? timeLeft(market.deadline) : "Closed"}
        </span>
      </div>

      {/* AI verdict if resolved */}
      {market.status === 1 && market.aiEvidence && (
        <div className="text-xs bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3 text-amber-800 line-clamp-2 shadow-inner">
          <span className="font-bold">AI Verdict: </span>
          {market.outcome ? `${market.optionA} ✓` : `${market.optionB} ✗`} — {market.aiEvidence}
        </div>
      )}
    </div>
  );
}