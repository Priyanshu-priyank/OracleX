import { useState } from "react";
import { getWriteContract } from "../utils/contracts";
import { ethers } from "ethers";

export function useCreateMarket() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [txHash,  setTxHash]  = useState(null);

  async function createMarket(question, category, optionA, optionB, durationHours, minStake) {
    setLoading(true); setError(null); setTxHash(null);
    try {
      const c      = await getWriteContract();
      const minStakeWei = ethers.parseEther(minStake.toString());
      const tx     = await c.createMarket(question, category, optionA, optionB, durationHours, minStakeWei);
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      
      const iface   = c.interface;
      const log     = receipt.logs.find(l => {
        try { iface.parseLog(l); return true; } catch { return false; }
      });
      const parsed  = log ? iface.parseLog(log) : null;
      const newId   = parsed?.args[0]?.toString();
      return newId;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { createMarket, loading, error, txHash };
}
