import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useWallet } from "../hooks/useWallet";
import { getRPCProvider, VITE_NFT_ADDRESS } from "../utils/contracts";
import { shortenAddress, CATEGORIES } from "../utils/format";
import { ethers } from "ethers";

export default function Profile() {
  const { address } = useWallet();
  const [reputation, setReputation] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    async function loadRep() {
      setLoading(true);
      setErr(null);
      try {
        if (!VITE_NFT_ADDRESS) {
          setReputation({});
          setErr("Set VITE_NFT_ADDRESS in frontend/.env to load reputation (optional).");
          return;
        }
        const rContract = new ethers.Contract(
          VITE_NFT_ADDRESS,
          ["function getCategoryReputation(address user, string calldata category) external view returns (uint256)"],
          getRPCProvider()
        );
        const reps = {};
        for (const cat of CATEGORIES) {
          const score = await rContract.getCategoryReputation(address, cat);
          reps[cat] = score.toString();
        }
        setReputation(reps);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Could not load reputation.");
      } finally {
        setLoading(false);
      }
    }
    loadRep();
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

  const totalRep = Object.values(reputation).reduce((a, b) => a + Number(b), 0);
  const rank =
    totalRep >= 50 ? "Oracle Master" : totalRep >= 20 ? "Expert" : totalRep > 0 ? "Scholar" : "Novice";

  return (
    <div className="min-h-screen bg-[var(--ox-bg)]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {err && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {err}
          </div>
        )}

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
                Rank: {rank}
              </span>
              <span className="bg-white/5 text-[var(--ox-text)] font-bold px-3 py-1 rounded-full text-sm border border-[var(--ox-border)]">
                Total XP: {totalRep}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-6">
          <h3 className="text-xs font-bold text-[var(--ox-muted)] uppercase tracking-widest mb-4">
            Category reputation
          </h3>
          {loading ? (
            <div className="text-[var(--ox-muted)] animate-pulse">Loading…</div>
          ) : (
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="flex justify-between text-sm font-bold text-[var(--ox-text)]">
                  <span className="text-[var(--ox-muted)]">{cat}</span>
                  <span>{reputation[cat] ?? "0"} XP</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-[var(--ox-muted)] mt-4">
            CPMM markets: activity history is on-chain via your wallet transactions; detailed bet receipts are not
            shown in this build.
          </p>
        </div>
      </div>
    </div>
  );
}
