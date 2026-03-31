import { useState, useEffect, useCallback } from "react";
import { getReadContract } from "../utils/contracts";

export function useMarkets() {
  const CACHE_KEY = "oraclex_markets_cache";
  
  const [markets, setMarkets] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(markets.length === 0);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    const contract = getReadContract();
    if (!contract) {
      setError("Contract not found. Please check MARKET_ADDRESS in .env");
      setLoading(false);
      return;
    }
    try {
      const raw = await contract.getAllMarkets();
      // Convert BigInt fields to strings for safe JSON/state
      const parsed = raw.map(m => ({
        id:          m.id.toString(),
        question:    m.question,
        category:    m.category,
        options:     m.options,
        deadline:    m.deadline.toString(),
        creator:     m.creator,
        status:      Number(m.status),
        outcomeIndex: Number(m.outcomeIndex),
        aiEvidence:  m.aiEvidence,
        shareReserves: m.shareReserves.map(p => p.toString()),
        totalSets:   m.totalSets.toString(),
        createdAt:   m.createdAt.toString(),
        minStake:    m.minStake.toString(),
      }));
      const sorted = parsed.reverse();
      setMarkets(sorted);
      localStorage.setItem(CACHE_KEY, JSON.stringify(sorted));
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