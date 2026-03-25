import { useState } from "react";
import { getWriteContract } from "../utils/contracts";
import { ethers } from "ethers";

export function useCreateMarket() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [txHash,  setTxHash]  = useState(null);

  async function createMarket(question, category, options, durationHours, minStake) {
    setLoading(true); setError(null); setTxHash(null);
    try {
      const c = await getWriteContract();
      const minStakeWei = ethers.parseEther(minStake.toString());
      // Contract requires msg.value >= minStake to seed AMM liquidity
      const tx = await c.createMarket(question, category, options, durationHours, minStakeWei, {
        value: minStakeWei,
      });
      setTxHash(tx.hash);
      
      // Mock contract returns id directly
      if (tx.id !== undefined) return tx.id.toString();
      
      const receipt = await tx.wait();

      let newId = null;
      const target = (await c.getAddress()).toLowerCase();
      for (const log of receipt.logs) {
        if (String(log.address).toLowerCase() !== target) continue;
        try {
          const parsed = c.interface.parseLog(log);
          if (parsed?.name === "MarketCreated") {
            newId = parsed.args.id.toString();
            break;
          }
        } catch {
          /* ignore */
        }
      }
      if (!newId) {
        const count = await c.marketCount();
        newId = count.toString();
      }
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
