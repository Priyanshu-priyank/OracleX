import { useState, useEffect } from "react";
import { getReadContract, getWriteContract } from "../utils/contracts";
import { ethers } from "ethers";

export function useMarket(id) {
  const [market,     setMarket]     = useState(null);
  const [userStakes, setUserStakes] = useState({ yes: "0", no: "0" });
  const [loading,    setLoading]    = useState(true);
  const [txPending,  setTxPending]  = useState(false);
  const [txHash,     setTxHash]     = useState(null);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const c = getReadContract();
        const m = await c.getMarket(id);
        setMarket({
          id: m.id.toString(), 
          question: m.question, 
          category: m.category,
          optionA: m.optionA,
          optionB: m.optionB,
          deadline: m.deadline.toString(), 
          creator: m.creator,
          status: Number(m.status), 
          outcome: m.outcome, 
          aiEvidence: m.aiEvidence,
          yesPool: m.yesPool.toString(), 
          noPool: m.noPool.toString(),
          createdAt: m.createdAt.toString(),
          minStake: m.minStake.toString(),
        });
        if (window.ethereum) {
          const provider  = new ethers.BrowserProvider(window.ethereum);
          const accounts  = await provider.listAccounts();
          if (accounts.length > 0) {
            const [y, n] = await c.getUserStakes(id, accounts[0].address);
            setUserStakes({ yes: y.toString(), no: n.toString() });
          }
        }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [id]);

  async function placeStake(side, amountEth) {
    setTxPending(true); setError(null); setTxHash(null);
    try {
      const c  = await getWriteContract();
      const tx = await c.stake(id, side, { value: ethers.parseEther(amountEth) });
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

  async function raiseDispute() {
    setTxPending(true); setError(null); setTxHash(null);
    try {
      const c  = await getWriteContract();
      const tx = await c.raiseDispute(id);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) { setError(err.message); }
    finally { setTxPending(false); }
  }

  return { market, userStakes, loading, txPending, txHash, error, placeStake, claimReward, raiseDispute };
}
