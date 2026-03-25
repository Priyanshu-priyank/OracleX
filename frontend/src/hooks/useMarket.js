import { useState, useEffect } from "react";
import { getReadContract, getWriteContract, IS_SAFE_MODE } from "../utils/contracts";
import { ethers } from "ethers";

export function useMarket(id) {
  const CACHE_KEY = `oraclex_market_${id}`;

  const [market, setMarket] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [userShares, setUserShares] = useState([]);
  const [loading, setLoading] = useState(!market);
  const [txPending, setTxPending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [walletBalance, setWalletBalance] = useState("0");

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

        if (IS_SAFE_MODE) {
          const mockUser = "0x742d...444";
          const balances = await c.getUserShares(id, mockUser);
          setUserShares(balances.map((s) => s.toString()));
          const wallet = await c.getWalletBalance(mockUser);
          setWalletBalance(wallet.toString());
        } else if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const user = accounts[0].address;
            const balances = await c.getUserShares(id, user);
            setUserShares(balances.map((s) => s.toString()));
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
      const c = await getWriteContract();
      const tx = await c.buyShares(id, optionIndex, { value: ethers.parseEther(amountEth) });
      setTxHash(tx.hash);
      await tx.wait();
      const m = await c.getMarket(id);
      setMarket((prev) => prev ? {
        ...prev,
        shareReserves: m.shareReserves.map((p) => p.toString()),
        totalSets: m.totalSets.toString(),
      } : prev);
      if (IS_SAFE_MODE) {
        const balances = await c.getUserShares(id, "0x742d...444");
        setUserShares(balances.map((s) => s.toString()));
        const wallet = await c.getWalletBalance("0x742d...444");
        setWalletBalance(wallet.toString());
      }
    } catch (err) { setError(err.message); }
    finally { setTxPending(false); }
  }

  async function sellShares(optionIndex, amountShares) {
    setTxPending(true); setError(null); setTxHash(null);
    try {
      const c = await getWriteContract();
      const tx = await c.sellShares(id, optionIndex, amountShares);
      setTxHash(tx.hash);
      await tx.wait();
      const m = await c.getMarket(id);
      setMarket((prev) => prev ? {
        ...prev,
        shareReserves: m.shareReserves.map((p) => p.toString()),
        totalSets: m.totalSets.toString(),
      } : prev);
      if (IS_SAFE_MODE) {
        const balances = await c.getUserShares(id, "0x742d...444");
        setUserShares(balances.map((s) => s.toString()));
        const wallet = await c.getWalletBalance("0x742d...444");
        setWalletBalance(wallet.toString());
      }
    } catch (err) { setError(err.message); }
    finally { setTxPending(false); }
  }

  async function claimReward() {
    setTxPending(true); setError(null); setTxHash(null);
    try {
      const c = await getWriteContract();
      const tx = await c.claimReward(id);
      setTxHash(tx.hash);
      await tx.wait();
      if (IS_SAFE_MODE) {
        const balances = await c.getUserShares(id, "0x742d...444");
        setUserShares(balances.map((s) => s.toString()));
        const wallet = await c.getWalletBalance("0x742d...444");
        setWalletBalance(wallet.toString());
      }
    } catch (err) { setError(err.message); }
    finally { setTxPending(false); }
  }

  return { market, userShares, walletBalance, loading, txPending, txHash, error, buyShares, sellShares, claimReward };
}
