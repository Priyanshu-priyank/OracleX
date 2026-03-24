// src/pages/MarketDetail.jsx

//stake+verdict+dispute
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import StakeModal from "../components/StakeModal";
import VerdictPanel from "../components/VerdictPanel";
import { useMarkets } from "../hooks/useMarkets";
import { useWallet } from "../hooks/useWallet";
import { MARKET_CONTRACT_ADDRESS, MARKET_ABI, SHARDEUM_EXPLORER } from "../utils/contracts";
import { daysLeft, formatINR, shortenAddr, categoryIcon } from "../utils/format";

export default function MarketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { markets, loading } = useMarkets();
    const { signer, address, isCorrectChain } = useWallet();

    const [showStake, setShowStake] = useState(false);
    const [disputing, setDisputing] = useState(false);
    const [disputeTx, setDisputeTx] = useState(null);
    const [disputeErr, setDisputeErr] = useState(null);

    const market = markets.find((m) => Number(m.id) === parseInt(id, 10));

    if (loading) {
        return (
            <div className="min-h-screen bg-ox-bg dot-grid">
                <Navbar />
                <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
                    <div className="h-8 w-2/3 shimmer-bg rounded-xl" />
                    <div className="h-64 shimmer-bg rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!market) {
        return (
            <div className="min-h-screen bg-ox-bg dot-grid">
                <Navbar />
                <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                    <p className="text-ox-muted font-body">Market not found.</p>
                    <button onClick={() => navigate("/")} className="mt-4 text-ox-green text-sm underline font-body">← Back</button>
                </div>
            </div>
        );
    }

    const totalPool = market.yesPool + market.noPool;
    const yesPercent = totalPool > 0n ? Math.round(Number((market.yesPool * 100n) / totalPool)) : 50;
    const noPercent = 100 - yesPercent;
    const dl = daysLeft(market.deadline);
    const isOpen = market.status === 0;
    const isResolved = market.status === 1;
    const isDisputed = market.status === 2;

    const handleDispute = async () => {
        if (!address || !isCorrectChain) return;
        setDisputing(true);
        setDisputeErr(null);
        try {
            if (MARKET_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
                await new Promise((r) => setTimeout(r, 1200));
                setDisputeTx("0xdispute_demo_" + Date.now().toString(16));
                return;
            }
            const contract = new ethers.Contract(MARKET_CONTRACT_ADDRESS, MARKET_ABI, signer);
            const tx = await contract.raiseDispute(market.id);
            setDisputeTx(tx.hash);
            await tx.wait();
        } catch (e) {
            setDisputeErr(e.reason ?? e.message ?? "Failed");
        } finally {
            setDisputing(false);
        }
    };

    return (
        <div className="min-h-screen bg-ox-bg dot-grid">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-fade-up">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-ox-muted text-sm font-body">
                    <button onClick={() => navigate("/")} className="hover:text-white transition-colors">Markets</button>
                    <span>/</span>
                    <span className="text-white/60 truncate max-w-xs">{market.question.slice(0, 40)}…</span>
                </div>

                {/* Header card */}
                <div className="bg-ox-card border border-ox-border rounded-2xl p-6 space-y-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-full text-xs font-display font-semibold bg-ox-surface border border-ox-border text-white/60">
                                {categoryIcon(market.category)} {market.category}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-display font-bold
                ${isOpen ? "bg-ox-green/10 text-ox-green border border-ox-green/20" :
                                    isResolved ? "bg-ox-teal/10 text-ox-teal border border-ox-teal/20" :
                                        "bg-ox-yellow/10 text-ox-yellow border border-ox-yellow/20"}`}>
                                {isOpen ? "● Open" : isResolved ? "✓ Resolved" : "⚠ Disputed"}
                            </span>
                        </div>
                        <span className="font-mono text-sm text-ox-muted">{dl}</span>
                    </div>

                    <h1 className="font-display font-extrabold text-xl md:text-2xl text-white leading-snug">
                        {market.question}
                    </h1>

                    {/* Probability */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-display font-bold text-ox-green">{yesPercent}%</span>
                                <span className="text-ox-muted text-sm font-body">chance of YES</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-ox-muted text-sm font-body">NO</span>
                                <span className="text-xl font-display font-bold text-ox-red">{noPercent}%</span>
                            </div>
                        </div>
                        <div className="h-3 rounded-full bg-ox-sub overflow-hidden">
                            <div
                                className="h-full prob-bar-fill rounded-full bg-gradient-to-r from-ox-green to-ox-teal"
                                style={{ width: `${yesPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Yes Pool", value: formatINR(market.yesPool) },
                            { label: "No Pool", value: formatINR(market.noPool) },
                            { label: "Total Pool", value: formatINR(totalPool) },
                            { label: "Min Bet", value: formatINR(market.minStake) },
                        ].map((s) => (
                            <div key={s.label} className="bg-ox-surface rounded-xl px-3 py-3 space-y-1">
                                <p className="text-xs text-ox-muted font-body">{s.label}</p>
                                <p className="font-mono font-semibold text-sm text-white">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-ox-muted font-body">
                        <span>Created by</span>
                        <span className="font-mono text-white/60">{shortenAddr(market.creator)}</span>
                        <span>·</span>
                        <a
                            href={`${SHARDEUM_EXPLORER}/address/${market.creator}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ox-green hover:underline"
                        >
                            View on Explorer
                        </a>
                    </div>
                </div>

                {/* AI Verdict Panel */}
                <VerdictPanel market={market} />

                {/* Action area */}
                {isOpen && (
                    <div className="bg-ox-card border border-ox-border rounded-2xl p-6 space-y-4">
                        <h2 className="font-display font-bold text-white">Place Your Bet</h2>
                        <p className="text-ox-muted text-sm font-body">
                            Minimum bet: <span className="text-white font-mono">{formatINR(market.minStake)}</span> · Funds locked on-chain until resolution.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowStake(true)}
                                className="flex-1 py-3.5 rounded-xl bg-ox-green text-black font-display font-bold text-sm hover:brightness-110 transition-all glow-green"
                            >
                                ↑ Bet YES — {yesPercent}%
                            </button>
                            <button
                                onClick={() => setShowStake(true)}
                                className="flex-1 py-3.5 rounded-xl bg-ox-red text-white font-display font-bold text-sm hover:brightness-110 transition-all glow-red"
                            >
                                ↓ Bet NO — {noPercent}%
                            </button>
                        </div>
                    </div>
                )}

                {/* Dispute button — only show on resolved markets */}
                {isResolved && !isDisputed && (
                    <div className="bg-ox-card border border-ox-border rounded-2xl p-6 space-y-4">
                        <div>
                            <h2 className="font-display font-bold text-white">Dispute this Outcome</h2>
                            <p className="text-ox-muted text-sm font-body mt-1">
                                Believe the AI oracle made a mistake? Raise a dispute. The community will review the on-chain evidence.
                            </p>
                        </div>
                        {disputeTx ? (
                            <div className="flex items-center gap-2 bg-ox-yellow/10 border border-ox-yellow/20 rounded-xl px-4 py-3">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#ffd60a" strokeWidth="2" className="w-4 h-4 shrink-0">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="text-ox-yellow text-xs font-mono truncate">Dispute raised · {disputeTx}</span>
                            </div>
                        ) : (
                            <>
                                {disputeErr && (
                                    <p className="text-ox-red text-xs font-body">{disputeErr}</p>
                                )}
                                <button
                                    onClick={handleDispute}
                                    disabled={disputing || !address}
                                    className="px-6 py-2.5 rounded-xl border border-ox-yellow/30 bg-ox-yellow/10 text-ox-yellow font-display font-bold text-sm hover:bg-ox-yellow/20 transition-all disabled:opacity-50"
                                >
                                    {disputing ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                                            </svg>
                                            Submitting…
                                        </span>
                                    ) : "⚠ Raise Dispute"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </main>

            {showStake && (
                <StakeModal
                    market={market}
                    onClose={() => setShowStake(false)}
                    onSuccess={() => setShowStake(false)}
                />
            )}
        </div>
    );
}