import { useState, useCallback } from "react";
import { SHARDEUM_CHAIN, IS_SAFE_MODE } from "../utils/contracts";

export function useWallet() {
  const [address, setAddress]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const connect = useCallback(async () => {
    if (IS_SAFE_MODE) {
      setAddress("0x742d...444");
      return;
    }
    if (!window.ethereum) {
      setError("MetaMask not found. Please install it.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Switch to Shardeum
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SHARDEUM_CHAIN.chainId }]
        });
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SHARDEUM_CHAIN]
          });
        }
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  return { address, connect, disconnect, loading, error };
}