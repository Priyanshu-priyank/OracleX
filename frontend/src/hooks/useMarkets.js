import { useState, useEffect, useCallback } from "react";
import { getReadContract } from "../utils/contracts";

export function useMarkets() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const contract = getReadContract();
      const raw = await contract.getAllMarkets();
      // Convert BigInt fields to strings for safe JSON/state
      const parsed = raw.map(m => ({
        id:          m.id.toString(),
        question:    m.question,
        category:    m.category,
        optionA:     m.optionA,
        optionB:     m.optionB,
        deadline:    m.deadline.toString(),
        creator:     m.creator,
        status:      Number(m.status),
        outcome:     m.outcome,
        aiEvidence:  m.aiEvidence,
        yesPool:     m.yesPool.toString(),
        noPool:      m.noPool.toString(),
        createdAt:   m.createdAt.toString(),
        minStake:    m.minStake.toString(),
      }));
      setMarkets(parsed.reverse()); // newest first
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  return { markets, loading, error, refetch: load };
}