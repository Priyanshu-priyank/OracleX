import { useState } from "react";
import { explorerTx } from "../utils/contracts";
import { ethers } from "ethers";

export default function StakeModal({ market, onStake, txPending, txHash, error, onClose }) {
  const [amount, setAmount] = useState(ethers.formatEther(market.minStake || "1000000000000000000000"));
  const [side,   setSide]   = useState(null);
  
  const minBet = market.minStake ? ethers.formatEther(market.minStake) : "1000";

  async function handleStake() {
    if (!side || !amount) return;
    await onStake(side === "yes", amount);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-2xl text-gray-900 tracking-tight">Place Stake</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center leading-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <p className="text-sm font-medium text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">{market.question}</p>

        {/* Side selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSide("yes")}
            className={`py-4 rounded-2xl font-bold text-lg transition-all border-2 uppercase ${side === "yes" ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 transform -translate-y-1" : "bg-white text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50"}`}
          >
            {market.optionA}
          </button>
          <button
            onClick={() => setSide("no")}
            className={`py-4 rounded-2xl font-bold text-lg transition-all border-2 uppercase ${side === "no" ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30 transform -translate-y-1" : "bg-white text-rose-600 border-rose-100 hover:border-rose-300 hover:bg-rose-50"}`}
          >
            {market.optionB}
          </button>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 mb-2 block flex justify-between">
            Amount (SHM)
            <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-md">Min: {minBet} SHM</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-mono"
              min={minBet}
              step="1"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">SHM</div>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600 bg-rose-50 font-medium rounded-xl p-3 mb-6 border border-rose-100">{error}</p>}

        {txHash && (
          <a href={explorerTx(txHash)} target="_blank" rel="noreferrer"
            className="block text-sm font-semibold text-purple-600 hover:text-purple-700 underline text-center mb-6">
            View tx on Shardeum Explorer →
          </a>
        )}

        <button
          onClick={handleStake}
          disabled={!side || !amount || txPending || Number(amount) < Number(minBet)}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 transform hover:-translate-y-0.5"
        >
          {txPending ? "Confirming Transaction..." : side ? `Stake ${amount} SHM on ${side === "yes" ? market.optionA : market.optionB}` : "Select Option"}
        </button>
      </div>
    </div>
  );
}