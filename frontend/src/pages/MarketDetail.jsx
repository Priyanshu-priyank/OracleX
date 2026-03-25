import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProbabilityBar from "../components/ProbabilityBar";
import StakeModal from "../components/StakeModal";
import VerdictPanel from "../components/VerdictPanel";
import CommunityThread from "../components/CommunityThread";
import OddsChart from "../components/OddsChart";
import { useMarket } from "../hooks/useMarket";
import { timeLeft, formatSHM, shortenAddress, statusLabel } from "../utils/format";
import { explorerTx, explorerAddr } from "../utils/contracts";
import { ethers } from "ethers";

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showStake, setShowStake] = useState(false);
  const [initialSide, setInitialSide] = useState(null);
  const { market, userShares, loading, txPending, txHash, error, buyShares, sellShares, claimReward } = useMarket(id);

  if (loading) return <div className="min-h-screen bg-[var(--ox-bg)]"><Navbar /><div className="flex items-center justify-center h-[60vh] text-[var(--ox-muted)]">Loading…</div></div>;
  if (!market) return <div className="min-h-screen bg-[var(--ox-bg)]"><Navbar /><div className="flex items-center justify-center h-[60vh] text-[var(--ox-muted)]">Market not found.</div></div>;

  const total = market.totalSets || "0";
  const isOpen = market.status === 0 && Date.now() < Number(market.deadline) * 1000;

  return (
    <div className="min-h-screen bg-[var(--ox-bg)] text-[var(--ox-text)]">
      <Navbar />

      {/* Stake modal overlay */}
      {showStake && (
        <StakeModal
          market={market}
          onBuy={buyShares}
          onSell={sellShares}
          userShares={userShares}
          initialSide={initialSide}
          txPending={txPending}
          txHash={txHash}
          error={error}
          onClose={() => { setShowStake(false); setInitialSide(null); }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Breadcrumb */}
        <button type="button" onClick={() => navigate("/")} className="text-sm font-bold text-[var(--ox-muted)] hover:text-white transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          All Markets
        </button>

        {/* Header Content */}
        <div className="rounded-3xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-[var(--ox-text)] border border-[var(--ox-border)]">{market.category}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${market.status === 0 ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" : market.status === 1 ? "text-sky-300 border-sky-500/40 bg-sky-500/10" : "text-amber-300 border-amber-500/40 bg-amber-500/10"}`}>{statusLabel(market.status)}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{market.question}</h1>
          </div>

          {/* Probability bar */}
          <ProbabilityBar market={market} size="lg" />

          {/* Meta Information */}
          <div className="grid grid-cols-3 gap-6 text-center border-t border-[var(--ox-border)] pt-6">
            <div className="rounded-2xl border border-[var(--ox-border)] bg-[#0b0e11] p-4">
              <div className="text-xl md:text-2xl font-black">{formatSHM(total)}</div>
              <div className="text-xs font-bold text-[var(--ox-muted)] uppercase tracking-wider mt-1">SHM pool</div>
            </div>
            <div className="rounded-2xl border border-[var(--ox-border)] bg-[#0b0e11] p-4">
              <div className="text-xl md:text-2xl font-black">{isOpen ? timeLeft(market.deadline) : "—"}</div>
              <div className="text-xs font-bold text-[var(--ox-muted)] uppercase tracking-wider mt-1">{isOpen ? "Time left" : "Closed"}</div>
            </div>
            <div className="rounded-2xl border border-[var(--ox-border)] bg-[#0b0e11] p-4">
              <a
                href={explorerAddr(market.creator)}
                target="_blank" rel="noreferrer"
                className="text-xl md:text-2xl font-black text-indigo-300 hover:underline inline-block"
              >
                {shortenAddress(market.creator)}
              </a>
              <div className="text-xs font-bold text-[var(--ox-muted)] uppercase tracking-wider mt-1">Creator</div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="rounded-3xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-8">
          {market.status === 0 && isOpen ? (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-extrabold">Trade shares</h2>
                <div className="text-sm font-bold text-indigo-200 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-lg">Min: {ethers.formatEther(market.minStake || "0")} SHM</div>
              </div>

              {userShares && userShares.some(s => BigInt(s) > 0n) && (
                <div className="text-sm font-bold border border-indigo-500/30 rounded-xl p-4 text-indigo-100 bg-indigo-500/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Your current shares:
                  </div>
                  <div className="pl-7 space-y-1">
                    {userShares.map((s, i) => BigInt(s) > 0n ? (
                      <div key={i} className="flex justify-between">
                        <span>{market.options[i]}</span>
                        <div className="flex gap-2">
                          <span>{formatSHM(s)} Shares</span>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {market.options.map((opt, idx) => (
                  <button key={idx} onClick={() => { setInitialSide(idx); setShowStake(true); }} className={`py-5 bg-gradient-to-br ${idx === 0 ? "from-emerald-400 to-emerald-500 shadow-emerald-500/20" : idx === 1 ? "from-rose-400 to-rose-500 shadow-rose-500/20" : "from-purple-500 to-indigo-600 shadow-purple-500/20"} text-white rounded-2xl font-black text-xl hover:shadow-lg transition-all transform hover:-translate-y-1 uppercase`}>{opt}</button>
                ))}
              </div>
              <p className="text-sm font-medium text-[var(--ox-muted)] text-center flex items-center justify-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Collateral stays in the AMM until resolution.
              </p>
            </div>
          ) : market.status === 1 ? (
            <div className="space-y-6">
              <VerdictPanel
                market={market}
                onClaim={claimReward}
                txPending={txPending}
                txHash={txHash}
                userShares={userShares}
              />
            </div>
          ) : market.status === 0 && !isOpen ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/15 text-amber-300 mb-4">
                <svg className="w-8 h-8 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold mb-1">Market closed</h3>
              <p className="text-sm font-medium text-[var(--ox-muted)]">Waiting for resolver to call <code className="text-indigo-300">aiResolve</code>…</p>
            </div>
          ) : (
            <div className="text-center py-10 text-[var(--ox-muted)] text-sm">
              Dispute flow is not enabled in this CPMM build.
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--ox-border)] space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 rounded-2xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-4 sm:p-5 overflow-hidden">
              <OddsChart market={market} />
            </div>
            <div className="lg:col-span-2">
              <CommunityThread marketId={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}