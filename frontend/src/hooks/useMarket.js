import { useState, useEffect } from "react";
import { getReadContract, getWriteContract } from "../utils/contracts";
import { ethers } from "ethers";

export function useMarket(id) {
  const CACHE_KEY = `oraclex_market_${id}`;

  const [market,     setMarket]     = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [userShares, setUserShares] = useState([]);
  const [loading,    setLoading]    = useState(!market);
  const [txPending,  setTxPending]  = useState(false);
  const [txHash,     setTxHash]     = useState(null);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const c = getReadContract();
        const m = await c.getMarket(id);
        const data = {
          id: m.id.toString(), 
          question: m.question, 
          category: m.category,
          options: m.options,
          deadline: m.deadline.toString(), 
          creator: m.creator,
          status: Number(m.status), 
          outcomeIndex: Number(m.outcomeIndex), 
          aiEvidence: m.aiEvidence,
          shareReserves: m.shareReserves.map(p => p.toString()),
          totalSets: m.totalSets.toString(),
          createdAt: m.createdAt.toString(),
          minStake: m.minStake.toString(),
        };
        setMarket(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));

        if (window.ethereum) {
          const provider  = new ethers.BrowserProvider(window.ethereum);
          const accounts  = await provider.listAccounts();
          if (accounts.length > 0) {
            const balances = await c.getUserShares(id, accounts[0].address);
            setUserShares(balances.map(s => s.toString()));
          }
        }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [id, CACHE_KEY]);

  async function buyShares(optionIndex, amountEth) {
    setTxPending(true); setError(null); setTxHash(null);
    try {
      const c  = await getWriteContract();
      const tx = await c.buyShares(id, optionIndex, { value: ethers.parseEther(amountEth) });
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) { setError(err.message); }
    finally { setTxPending(false); }
  }

  async function sellShares(optionIndex, amountShares) {
    setTxPending(true); setError(null); setTxHash(null);
    try {
      const c  = await getWriteContract();
      const tx = await c.sellShares(id, optionIndex, amountShares);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) { setError(err.message); }
    finally { setTxPending(false); }
  }

  async function claimReward() {
    setTxPending(true); setError(null); setTxHash(null);
    try {
      const c  = await getWriteContract();
      const tx = await c.claimReward(id);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) { setError(err.message); }
    finally { setTxPending(false); }
  }

  return { market, userShares, loading, txPending, txHash, error, buyShares, sellShares, claimReward };
}
