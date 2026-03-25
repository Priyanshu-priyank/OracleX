import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProbabilityBar from "../components/ProbabilityBar";
import StakeModal from "../components/StakeModal";
import VerdictPanel from "../components/VerdictPanel";
import { useMarket } from "../hooks/useMarket";
import { timeLeft, formatSHM, shortenAddress, statusLabel } from "../utils/format";
import { explorerTx, explorerAddr } from "../utils/contracts";
import { ethers } from "ethers";

export default function MarketDetail() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [showStake, setShowStake] = useState(false);
  const { market, userStakes, loading, txPending, txHash, error, placeStake, claimReward, raiseDispute } = useMarket(id);

  if (loading) return <div className="min-h-screen bg-gray-50/50"><Navbar /><div className="flex items-center justify-center h-[60vh] text-gray-400 font-medium">Loading market data...</div></div>;
  if (!market) return <div className="min-h-screen bg-gray-50/50"><Navbar /><div className="flex items-center justify-center h-[60vh] text-gray-400 font-medium">Market not found.</div></div>;

  const total = (BigInt(market.yesPool) + BigInt(market.noPool)).toString();
  const isOpen = market.status === 0 && Date.now() < Number(market.deadline) * 1000;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      {/* Stake modal overlay */}
      {showStake && (
        <StakeModal
          market={market}
          onStake={placeStake}
          txPending={txPending}
          txHash={txHash}
          error={error}
          onClose={() => setShowStake(false)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Breadcrumb */}
        <button onClick={() => navigate("/")} className="text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          All Markets
        </button>

        {/* Header Content */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700">{market.category}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${market.status === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : market.status === 1 ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-orange-50 text-orange-700 border-orange-100"}`}>{statusLabel(market.status)}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">{market.question}</h1>
          </div>

          {/* Probability bar */}
          <ProbabilityBar market={market} size="lg" />

          {/* Meta Information */}
          <div className="grid grid-cols-3 gap-6 text-center border-t border-gray-100 pt-6">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-xl md:text-2xl font-black text-gray-900">{formatSHM(total)}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">SHM Pool</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-xl md:text-2xl font-black text-gray-900">{isOpen ? timeLeft(market.deadline) : "—"}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{isOpen ? "Time Left" : "Closed"}</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <a
                href={explorerAddr(market.creator)}
                target="_blank" rel="noreferrer"
                className="text-xl md:text-2xl font-black text-purple-600 hover:text-purple-700 hover:underline inline-block"
              >
                {shortenAddress(market.creator)}
              </a>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Creator</div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          {market.status === 0 && isOpen ? (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-extrabold text-gray-900">Make Your Prediction</h2>
                <div className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">Min Bet: {ethers.formatEther(market.minStake || "1000000000000000000000")} SHM</div>
              </div>
              
              {userStakes && (BigInt(userStakes.yes) > 0n || BigInt(userStakes.no) > 0n) && (
                <div className="text-sm font-bold bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-indigo-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Your current stake: {BigInt(userStakes.yes) > 0n ? `${formatSHM(userStakes.yes)} SHM on ${market.optionA}` : `${formatSHM(userStakes.no)} SHM on ${market.optionB}`}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowStake(true)} className="py-5 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-2xl font-black text-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1 uppercase">{market.optionA}</button>
                <button onClick={() => setShowStake(true)} className="py-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl font-black text-xl hover:shadow-lg hover:shadow-rose-500/30 transition-all transform hover:-translate-y-1 uppercase">{market.optionB}</button>
              </div>
              <p className="text-sm font-medium text-gray-500 text-center flex items-center justify-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Funds are securely locked on-chain. AI agent resolves automatically after deadline.
              </p>
            </div>
          ) : market.status === 1 ? (
            <div className="space-y-6">
              <VerdictPanel
                market={market}
                onClaim={claimReward}
                txPending={txPending}
                txHash={txHash}
                userStakes={userStakes}
              />
              <div className="pt-6 border-t border-gray-100 flex justify-end">
                 <button onClick={raiseDispute} disabled={txPending} className="text-sm font-bold text-orange-600 hover:text-orange-700 px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Dispute Resolution
                 </button>
              </div>
            </div>
          ) : market.status === 0 && !isOpen ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-500 mb-4">
                 <svg className="w-8 h-8 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Market Expired</h3>
              <p className="text-sm font-medium text-gray-500">Waiting for Claude AI agent to verify the outcome and resolve the market...</p>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-orange-500 mb-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Market Disputed</h3>
              <p className="text-sm font-medium text-orange-600">The AI outcome has been challenged by the community. Resolution is pending.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}