import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useWallet } from "../hooks/useWallet";
import { getReadContract, IS_SAFE_MODE } from "../utils/contracts";
import { shortenAddress, formatSHM } from "../utils/format";

export default function Profile() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(true);
  const [mockWallet, setMockWallet] = useState("0");

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    if (!IS_SAFE_MODE || !address) return;
    let mounted = true;
    const loadWallet = async () => {
      try {
        const c = getReadContract();
        if (!c) return;
        const bal = await c.getWalletBalance(address);
        if (mounted) setMockWallet(bal.toString());
      } catch {
        if (mounted) setMockWallet("0");
      }
    };
    loadWallet();
    const interval = setInterval(loadWallet, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [address]);

  if (!address) {
    return (
      <div className="min-h-screen bg-[var(--ox-bg)]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
          <h2 className="text-2xl font-extrabold text-[var(--ox-text)] mb-2">Connect your wallet</h2>
          <p className="text-[var(--ox-muted)] font-medium max-w-sm">
            Connect MetaMask to view your profile on OracleX.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ox-bg)]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="rounded-3xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black border-4 border-[var(--ox-border)]">
            {address.substring(2, 4).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1 space-y-2">
            <h1 className="text-3xl font-extrabold text-[var(--ox-text)] font-mono tracking-tight">
              {shortenAddress(address)}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="bg-indigo-500/15 text-indigo-300 font-bold px-3 py-1 rounded-full text-sm border border-indigo-500/30">
                Live Shardeum Account
              </span>
            </div>
          </div>
        </div>

        {IS_SAFE_MODE && (
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
            <h3 className="text-xs font-bold text-amber-200 uppercase tracking-widest mb-2">
              Mock wallet (Safe Mode)
            </h3>
            <div className="text-2xl font-black text-amber-100">{formatSHM(mockWallet)} SHM</div>
            <p className="text-xs text-amber-200/80 mt-2">
              Balance used for demo testing on local state.
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-6">
          <h3 className="text-xs font-bold text-[var(--ox-muted)] uppercase tracking-widest mb-4">
            Account activity
          </h3>
          <p className="text-sm text-[var(--ox-muted)]">
            Your on-chain activity (bets, claims) is recorded on the Shardeum Explorer. OracleX 
            v1.0 uses a direct contract interaction model.
          </p>
        </div>
      </div>
    </div>
  );
}
