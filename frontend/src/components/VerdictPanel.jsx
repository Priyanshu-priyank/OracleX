// src/components/VerdictPanel.jsx

//AI Oracle resolution display
import { SHARDEUM_EXPLORER } from "../utils/contracts";

export default function VerdictPanel({ market }) {
    const isResolved = market.status === 1;
    const isDisputed = market.status === 2;

    if (!isResolved && !isDisputed) return null;

    return (
        <div className={`rounded-2xl border p-5 space-y-4
      ${isDisputed
                ? "border-ox-yellow/25 bg-ox-yellow/5"
                : "border-ox-teal/25 bg-ox-teal/5"}`}
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
          ${isDisputed ? "bg-ox-yellow/15" : "bg-ox-teal/15"}`}>
                    {isDisputed ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffd60a" strokeWidth="2" className="w-5 h-5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>
                <div>
                    <h3 className={`font-display font-bold text-sm ${isDisputed ? "text-ox-yellow" : "text-ox-teal"}`}>
                        {isDisputed ? "⚠ Outcome Disputed" : "✦ AI Oracle Verdict"}
                    </h3>
                    <p className="text-ox-muted text-xs font-body">
                        {isDisputed
                            ? "This market is under community review"
                            : "Resolved by Claude · stored permanently on Shardeum"}
                    </p>
                </div>
            </div>

            {/* Outcome pill */}
            {isResolved && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-display font-bold text-sm
          ${market.outcome
                        ? "bg-ox-green/15 text-ox-green border border-ox-green/25"
                        : "bg-ox-red/15   text-ox-red   border border-ox-red/25"}`}>
                    <span>{market.outcome ? "✓" : "✗"}</span>
                    Outcome: <span>{market.outcome ? "YES" : "NO"}</span>
                </div>
            )}

            {/* AI Evidence */}
            {isResolved && market.aiEvidence && (
                <div className="space-y-2">
                    <p className="text-xs text-ox-muted font-body font-semibold uppercase tracking-wider">AI Reasoning (on-chain)</p>
                    <div className="bg-ox-bg/60 border border-ox-teal/15 rounded-xl p-4">
                        <div className="flex gap-3">
                            <div className="shrink-0 mt-0.5">
                                <div className="w-5 h-5 rounded bg-ox-teal/20 flex items-center justify-center">
                                    <span className="text-ox-teal text-[10px] font-bold">AI</span>
                                </div>
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed font-body">{market.aiEvidence}</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-ox-muted font-body">
                        This verdict is immutably stored in transaction calldata on Shardeum.{" "}
                        <a
                            href={`${SHARDEUM_EXPLORER}/tx/0x0`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ox-teal underline hover:text-white transition-colors"
                        >
                            View on Explorer →
                        </a>
                    </p>
                </div>
            )}
        </div>
    );
}