// src/components/MarketCard.jsx

//MarketCard component
import { useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { daysLeft, formatINR, shortenAddr, categoryIcon, statusLabel, statusColor } from "../utils/format";

const CAT_STYLE = {
    Crypto: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Sports: "bg-blue-500/10  text-blue-400  border-blue-500/20",
    Politics: "bg-rose-500/10  text-rose-400  border-rose-500/20",
    Science: "bg-cyan-500/10  text-cyan-400  border-cyan-500/20",
    Tech: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    Economics: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Other: "bg-slate-500/10 text-slate-400  border-slate-500/20",
};

export default function MarketCard({ market, idx = 0 }) {
    const [hovered, setHovered] = useState(false);
    const totalPool = market.yesPool + market.noPool;
    const yesPercent = totalPool > 0n
        ? Math.round(Number((market.yesPool * 100n) / totalPool))
        : 50;
    const noPercent = 100 - yesPercent;
    const catStyle = CAT_STYLE[market.category] ?? CAT_STYLE.Other;
    const dl = daysLeft(market.deadline);
    const isEnded = dl === "Ended";
    const isResolved = market.status === 1;
    const isDisputed = market.status === 2;

    return (
        <Link
            to={`/market/${market.id}`}
            className={`stagger-${Math.min(idx + 1, 6)} block`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={`relative rounded-2xl border bg-ox-card overflow-hidden transition-all duration-300 h-full flex flex-col
        ${isResolved ? "border-ox-teal/30 shadow-[0_0_20px_rgba(0,180,216,0.08)]" :
                    isDisputed ? "border-ox-yellow/30 shadow-[0_0_20px_rgba(255,214,10,0.08)]" :
                        hovered ? "border-ox-green/40 shadow-[0_0_28px_rgba(0,229,160,0.10)] -translate-y-0.5" :
                            "border-ox-border"}`}
            >
                {/* Status ribbon */}
                {isResolved && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ox-teal via-ox-green to-transparent" />
                )}
                {isDisputed && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ox-yellow to-transparent" />
                )}

                <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${catStyle}`}>
                            <span>{categoryIcon(market.category)}</span>
                            {market.category}
                        </span>
                        <div className="flex items-center gap-2">
                            {(isResolved || isDisputed) && (
                                <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-md
                  ${isResolved ? "bg-ox-teal/15 text-ox-teal" : "bg-ox-yellow/15 text-ox-yellow"}`}>
                                    {statusLabel(market.status)}
                                </span>
                            )}
                            <span className={`text-xs font-mono ${isEnded ? "text-ox-muted" : "text-white/50"}`}>
                                {dl}
                            </span>
                        </div>
                    </div>

                    {/* Question */}
                    <h3 className="font-display font-semibold text-sm leading-snug text-white line-clamp-2 flex-1">
                        {market.question}
                    </h3>

                    {/* AI Evidence badge */}
                    {isResolved && market.aiEvidence && (
                        <div className="flex items-start gap-2 bg-ox-teal/8 border border-ox-teal/15 rounded-xl p-3">
                            <div className="mt-0.5 shrink-0 w-4 h-4 rounded bg-ox-teal/20 flex items-center justify-center">
                                <svg viewBox="0 0 16 16" fill="none" className="w-2.5 h-2.5">
                                    <path d="M8 1l1.8 5.5H15l-4.7 3.4 1.8 5.5L8 12.1 3.9 15.4l1.8-5.5L1 6.5h5.2z" fill="#00b4d8" />
                                </svg>
                            </div>
                            <p className="text-xs text-ox-teal/80 leading-relaxed line-clamp-2 font-body">{market.aiEvidence}</p>
                        </div>
                    )}

                    {/* Probability bar */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-semibold text-ox-green font-mono">{yesPercent}% YES</span>
                            <span className="text-xs font-semibold text-ox-red font-mono">{noPercent}% NO</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-ox-sub overflow-hidden">
                            <div
                                className="h-full prob-bar-fill rounded-full bg-gradient-to-r from-ox-green to-ox-teal"
                                style={{ width: `${yesPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: "Pool", value: formatINR(totalPool) },
                            { label: "Min Bet", value: formatINR(market.minStake) },
                            { label: "Creator", value: shortenAddr(market.creator) },
                        ].map((s) => (
                            <div key={s.label} className="bg-ox-surface rounded-lg px-2.5 py-2 text-center">
                                <div className="text-[11px] text-white/35 mb-0.5 font-body">{s.label}</div>
                                <div className="text-xs font-mono text-white font-medium truncate">{s.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer CTA */}
                <div className={`px-5 py-3 border-t border-ox-border flex items-center justify-between
          ${hovered ? "bg-ox-surface/60" : "bg-transparent"} transition-colors`}>
                    <div className="flex items-center gap-3">
                        <button className="px-3 py-1.5 rounded-lg bg-ox-green/15 text-ox-green text-xs font-display font-bold hover:bg-ox-green hover:text-black transition-all duration-150">
                            YES ↑
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-ox-red/15 text-ox-red text-xs font-display font-bold hover:bg-ox-red hover:text-white transition-all duration-150">
                            NO ↓
                        </button>
                    </div>
                    <span className="text-ox-muted text-xs flex items-center gap-1">
                        View →
                    </span>
                </div>
            </div>
        </Link>
    );
}