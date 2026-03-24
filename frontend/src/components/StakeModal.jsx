// src/components/StakeModal.jsx

//place YES/NO bets with min validation
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { MARKET_CONTRACT_ADDRESS, MARKET_ABI } from "../utils/contracts";
import { formatINR } from "../utils/format";

const INR_PER_SHM = 10; // illustrative

export default function StakeModal({ market, onClose, onSuccess }) {
    const { signer, address, isCorrectChain, connect, switchToShardeum } = useWallet();
    const [side, setSide] = useState("YES");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [err, setErr] = useState(null);

    // min stake in INR then convert to SHM wei
    const minINR = 1000;
    const minSHM = minINR / INR_PER_SHM;  // 100 SHM
    const marketMin = market.minStake;       // from contract (wei)
    // actual min = max(platformMin, marketMin)
    const actualMinWei = marketMin > ethers.parseEther(minSHM.toString())
        ? marketMin
        : ethers.parseEther(minSHM.toString());
    const actualMinINR = Number(ethers.formatEther(actualMinWei)) * INR_PER_SHM;

    const amountWei = amount ? ethers.parseEther((parseFloat(amount) / INR_PER_SHM).toString()) : 0n;
    const belowMin = amountWei > 0n && amountWei < actualMinWei;

    const handleStake = async () => {
        if (!address) { connect(); return; }
        if (!isCorrectChain) { switchToShardeum(); return; }
        if (belowMin) { setErr(`Minimum bet is ₹${actualMinINR.toLocaleString()}`); return; }
        if (!amount || parseFloat(amount) <= 0) { setErr("Enter a valid amount"); return; }

        setLoading(true);
        setErr(null);
        try {
            const contract = new ethers.Contract(MARKET_CONTRACT_ADDRESS, MARKET_ABI, signer);
            const tx = await contract.stake(market.id, side === "YES", { value: amountWei });
            setTxHash(tx.hash);
            await tx.wait();
            onSuccess?.();
        } catch (e) {
            setErr(e.reason ?? e.message ?? "Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    // close on ESC
    useEffect(() => {
        const h = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    const totalPool = market.yesPool + market.noPool;
    const yesPercent = totalPool > 0n ? Math.round(Number((market.yesPool * 100n) / totalPool)) : 50;
    const estimatedWin = amountWei > 0n && totalPool > 0n
        ? side === "YES"
            ? (Number(ethers.formatEther(amountWei)) * Number(ethers.formatEther(totalPool + amountWei))) /
            Number(ethers.formatEther(market.yesPool + amountWei))
            : (Number(ethers.formatEther(amountWei)) * Number(ethers.formatEther(totalPool + amountWei))) /
            Number(ethers.formatEther(market.noPool + amountWei))
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md rounded-2xl bg-ox-card border border-ox-border shadow-2xl animate-fade-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-ox-border">
                    <div>
                        <h2 className="font-display font-bold text-white text-lg">Place Bet</h2>
                        <p className="text-ox-muted text-xs mt-0.5 line-clamp-1 font-body">{market.question}</p>
                    </div>
                    <button onClick={onClose} className="text-ox-muted hover:text-white transition-colors p-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Probability display */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 text-center p-3 rounded-xl bg-ox-green/8 border border-ox-green/20">
                            <div className="text-2xl font-display font-bold text-ox-green">{yesPercent}%</div>
                            <div className="text-xs text-ox-muted font-body mt-0.5">chance YES</div>
                        </div>
                        <div className="text-ox-muted font-mono text-sm">vs</div>
                        <div className="flex-1 text-center p-3 rounded-xl bg-ox-red/8 border border-ox-red/20">
                            <div className="text-2xl font-display font-bold text-ox-red">{100 - yesPercent}%</div>
                            <div className="text-xs text-ox-muted font-body mt-0.5">chance NO</div>
                        </div>
                    </div>

                    {/* Side selector */}
                    <div className="grid grid-cols-2 gap-2">
                        {["YES", "NO"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSide(s)}
                                className={`py-3 rounded-xl font-display font-bold text-sm transition-all duration-150 border
                  ${side === s
                                        ? s === "YES"
                                            ? "bg-ox-green text-black border-ox-green shadow-[0_0_20px_rgba(0,229,160,0.3)]"
                                            : "bg-ox-red   text-white border-ox-red   shadow-[0_0_20px_rgba(255,77,109,0.3)]"
                                        : "bg-ox-surface text-ox-muted border-ox-border hover:border-white/20"
                                    }`}
                            >
                                {s === "YES" ? "↑ YES" : "↓ NO"}
                            </button>
                        ))}
                    </div>

                    {/* Amount input */}
                    <div>
                        <label className="block text-xs text-ox-muted mb-2 font-body">
                            Bet Amount (₹) — Min ₹{actualMinINR.toLocaleString()}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ox-muted font-display font-bold">₹</span>
                            <input
                                type="number"
                                min={actualMinINR}
                                step="100"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setErr(null); }}
                                placeholder={`${actualMinINR}`}
                                className={`w-full pl-8 pr-4 py-3 rounded-xl bg-ox-surface border font-mono text-white placeholder-ox-muted text-sm
                  focus:outline-none focus:ring-1 transition-all
                  ${belowMin
                                        ? "border-ox-red/50 focus:ring-ox-red/30"
                                        : "border-ox-border focus:border-ox-green/50 focus:ring-ox-green/20"}`}
                            />
                        </div>
                        {belowMin && (
                            <p className="text-ox-red text-xs mt-1.5 font-body">
                                Minimum is ₹{actualMinINR.toLocaleString()}
                            </p>
                        )}
                        {/* Quick amounts */}
                        <div className="flex gap-2 mt-2">
                            {[1000, 2500, 5000, 10000].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => { setAmount(String(v)); setErr(null); }}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-display font-semibold bg-ox-surface border border-ox-border text-ox-muted hover:text-ox-green hover:border-ox-green/40 transition-all"
                                >
                                    ₹{(v / 1000).toFixed(0)}K
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estimated payout */}
                    {estimatedWin > 0 && (
                        <div className="flex items-center justify-between bg-ox-surface rounded-xl px-4 py-3 border border-ox-border">
                            <span className="text-xs text-ox-muted font-body">Est. payout (if {side})</span>
                            <span className="text-sm font-mono font-bold text-white">
                                ₹{(estimatedWin * INR_PER_SHM * 0.98).toFixed(0)} <span className="text-ox-muted font-normal text-xs">(−2% fee)</span>
                            </span>
                        </div>
                    )}

                    {/* Error */}
                    {err && (
                        <div className="flex items-center gap-2 bg-ox-red/10 border border-ox-red/20 rounded-xl px-3 py-2.5">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-ox-red shrink-0">
                                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                            </svg>
                            <span className="text-ox-red text-xs font-body">{err}</span>
                        </div>
                    )}

                    {/* Tx hash */}
                    {txHash && (
                        <div className="flex items-center gap-2 bg-ox-green/10 border border-ox-green/20 rounded-xl px-3 py-2.5">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-ox-green shrink-0">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-ox-green text-xs font-mono truncate">{txHash}</span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleStake}
                        disabled={loading || belowMin || !amount}
                        className={`w-full py-3.5 rounded-xl font-display font-bold text-sm transition-all duration-150
              ${!loading && !belowMin && amount
                                ? side === "YES"
                                    ? "bg-ox-green text-black hover:brightness-110 shadow-[0_0_24px_rgba(0,229,160,0.25)]"
                                    : "bg-ox-red   text-white hover:brightness-110 shadow-[0_0_24px_rgba(255,77,109,0.25)]"
                                : "bg-ox-surface text-ox-muted border border-ox-border cursor-not-allowed"}`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                                </svg>
                                Confirming on Shardeum…
                            </span>
                        ) : !address ? "Connect Wallet to Bet" :
                            !isCorrectChain ? "Switch to Shardeum" :
                                `Stake ${side} — ₹${amount || "0"}`}
                    </button>

                    <p className="text-center text-ox-muted text-[11px] font-body">
                        Funds locked on-chain until market resolves · 2% protocol fee on winnings
                    </p>
                </div>
            </div>
        </div>
    );
}