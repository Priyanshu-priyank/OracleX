import { useState, useEffect } from "react";
import { explorerTx } from "../utils/contracts";
import { ethers } from "ethers";
import { formatSHM } from "../utils/format";

const PRECISION = BigInt(1e18);

export default function StakeModal({ market, onBuy, onSell, userShares, initialSide, txPending, txHash, error, onClose }) {
  const [tab, setTab] = useState("buy"); // buy or sell
  const [amount, setAmount] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(initialSide !== null ? initialSide : null);

  useEffect(() => {
    if (initialSide !== null && initialSide !== undefined) setSelectedIndex(initialSide);
  }, [initialSide]);

  const minBet = market.minStake ? ethers.formatEther(market.minStake) : "1000";

  // Calculate current price based on reserves
  const reserves = market.shareReserves.map(r => BigInt(r));
  const inverseReserves = reserves.map(r => r > 0 ? PRECISION * PRECISION / r : 0n);
  const sumInverses = inverseReserves.reduce((acc, v) => acc + v, 0n);

  const getPrice = (idx) => {
    if (sumInverses === 0n) return 1n * PRECISION / BigInt(market.options.length);
    return (inverseReserves[idx] * PRECISION) / sumInverses;
  };

  const getEstimate = () => {
    if (!amount || isNaN(amount) || selectedIndex === null) return "0";
    const price = getPrice(selectedIndex);
    if (tab === "buy") {
      // shares = amount / price
      const amtWei = ethers.parseEther(amount);
      return formatSHM((amtWei * PRECISION) / price);
    } else {
      // shm = shares * price
      const sharesWei = ethers.parseEther(amount);
      return formatSHM((sharesWei * price) / PRECISION);
    }
  };

  async function handleSubmit() {
    if (selectedIndex === null || !amount) return;
    if (tab === "buy") {
      await onBuy(selectedIndex, amount);
    } else {
      await onSell(selectedIndex, ethers.parseEther(amount));
    }
  }

  const colors = [
    "bg-emerald-500 border-emerald-500 shadow-emerald-500/30",
    "bg-rose-500 border-rose-500 shadow-rose-500/30",
    "bg-amber-500 border-amber-500 shadow-amber-500/30",
    "bg-indigo-500 border-indigo-500 shadow-indigo-500/30",
    "bg-teal-500 border-teal-500 shadow-teal-500/30",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="rounded-3xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-8 w-full max-w-md shadow-2xl relative transform transition-all text-[var(--ox-text)]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <button type="button" onClick={() => setTab("buy")} className={`text-2xl font-black transition-all ${tab === "buy" ? "text-white" : "text-[var(--ox-muted)] hover:text-white/80"}`}>Buy</button>
            <button type="button" onClick={() => setTab("sell")} className={`text-2xl font-black transition-all ${tab === "sell" ? "text-white" : "text-[var(--ox-muted)] hover:text-white/80"}`}>Sell</button>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--ox-muted)] hover:text-white transition-colors bg-white/10 hover:bg-white/15 rounded-full w-8 h-8 flex items-center justify-center leading-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Option selection */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <label className="text-xs font-black uppercase text-[var(--ox-muted)] tracking-widest pl-1">Select outcome</label>
          <div className="grid grid-cols-1 gap-2">
            {market.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 uppercase flex justify-between items-center ${selectedIndex === idx ? `${colors[idx % colors.length]} text-white shadow-lg transform -translate-y-0.5` : `bg-[#0b0e11] border-[var(--ox-border)] text-[var(--ox-text)] hover:border-white/20`}`}
              >
                <span>{opt}</span>
                <span className="text-[10px] opacity-70">Price: {formatSHM(getPrice(idx))} SHM</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="text-sm font-black text-[var(--ox-text)] mb-2 block flex justify-between uppercase tracking-tight">
            {tab === "buy" ? "Investment Amount" : "Shares to Sell"}
            {tab === "sell" && selectedIndex !== null && (
              <button type="button" onClick={() => setAmount(ethers.formatEther(userShares[selectedIndex]))} className="text-indigo-300 text-[10px] font-black hover:underline px-2 py-0.5 rounded-md bg-indigo-500/15">MAX: {formatSHM(userShares[selectedIndex])}</button>
            )}
            {tab === "buy" && <span className="text-[10px] text-[var(--ox-muted)]">Min: {minBet} SHM</span>}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border-2 border-[var(--ox-border)] rounded-2xl px-4 py-4 text-2xl font-black text-[var(--ox-text)] bg-[#0b0e11] focus:outline-none focus:border-[var(--ox-accent)] focus:ring-2 focus:ring-[var(--ox-accent)]/30 transition-all font-mono"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ox-muted)] font-black text-xs uppercase tracking-widest">{tab === "buy" ? "SHM" : "Shares"}</div>
          </div>

          <div className="mt-4 p-4 bg-[#0b0e11] border border-[var(--ox-border)] rounded-2xl flex justify-between items-center text-sm">
            <span className="font-bold text-[var(--ox-muted)] italic uppercase text-[10px] tracking-widest">{tab === "buy" ? "Estimated shares" : "Estimated return"}</span>
            <span className={`font-black text-lg ${tab === "buy" ? "text-emerald-400" : "text-indigo-300"}`}>{getEstimate()} {tab === "buy" ? "SHARES" : "SHM"}</span>
          </div>
        </div>

        {error && <p className="text-sm text-rose-300 bg-rose-500/10 font-medium rounded-xl p-3 mb-6 border border-rose-500/30">{error}</p>}

        {txHash && (
          <a href={explorerTx(txHash)} target="_blank" rel="noreferrer"
            className="block text-sm font-semibold text-indigo-300 hover:underline text-center mb-6">
            View tx on Shardeum Explorer →
          </a>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedIndex === null || !amount || txPending || (tab === "buy" && Number(amount) < Number(minBet)) || (tab === "sell" && selectedIndex !== null && ethers.parseEther(amount || "0") > BigInt(userShares[selectedIndex]))}
          className={`w-full py-5 ${tab === "buy" ? "bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-500/30" : "bg-gradient-to-r from-purple-600 to-indigo-500 shadow-purple-500/30"} text-white rounded-2xl font-black text-xl hover:shadow-lg transition-all disabled:opacity-50 transform hover:-translate-y-0.5 uppercase tracking-wide`}
        >
          {txPending ? "Processing..." : tab === "buy" ? "Buy Outcome" : "Sell Outcome"}
        </button>
      </div>
    </div>
  );
}