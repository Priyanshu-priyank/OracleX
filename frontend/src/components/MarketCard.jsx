import { useNavigate } from "react-router-dom";
import ProbabilityBar from "./ProbabilityBar";
import { timeLeft, formatSHM, statusLabel } from "../utils/format";

const STATUS_STYLES = {
  0: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  1: "text-sky-300 border-sky-500/40 bg-sky-500/10",
  2: "text-amber-300 border-amber-500/40 bg-amber-500/10",
};

const CATEGORY_STYLES = {
  Crypto: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  Sports: "bg-teal-500/15 text-teal-200 border-teal-500/30",
  Politics: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  Finance: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  "Daily Life": "bg-violet-500/15 text-violet-200 border-violet-500/30",
  Other: "bg-white/5 text-[var(--ox-muted)] border-[var(--ox-border)]",
};

export default function MarketCard({ market }) {
  const navigate = useNavigate();
  const total = market.totalSets || "0";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/market/${market.id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/market/${market.id}`)}
      className="rounded-2xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-5 space-y-4 cursor-pointer hover:border-[var(--ox-accent)]/50 transition-all group"
    >
      <div className="flex justify-between items-start gap-2">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
            CATEGORY_STYLES[market.category] ?? CATEGORY_STYLES.Other
          }`}
        >
          {market.category}
        </span>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-md border ${STATUS_STYLES[market.status] ?? STATUS_STYLES[0]}`}
        >
          {statusLabel(market.status)}
        </span>
      </div>

      <h3 className="text-base font-bold text-[var(--ox-text)] leading-snug line-clamp-2 group-hover:text-white transition-colors">
        {market.question}
      </h3>

      <ProbabilityBar market={market} size="sm" />

      <div className="flex justify-between items-center text-xs font-medium text-[var(--ox-muted)] pt-2 border-t border-[var(--ox-border)]">
        <span className="flex items-center gap-1">
          <span className="opacity-70">Vol.</span> {formatSHM(total)} SHM
        </span>
        <span>
          {market.status === 0 ? timeLeft(market.deadline) : "Closed"}
        </span>
      </div>

      {market.status === 1 && market.aiEvidence && market.options?.length > 0 && (
        <div className="text-xs rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100 line-clamp-2">
          <span className="font-bold">Resolved: </span>
          {market.options[market.outcomeIndex]} — {market.aiEvidence}
        </div>
      )}
    </div>
  );
}
