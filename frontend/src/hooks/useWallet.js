import { useState, useCallback, useEffect, createContext, useContext, createElement } from "react";
import { SHARDEUM_CHAIN, IS_SAFE_MODE, getReadContract } from "../utils/contracts";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [mockBalance, setMockBalance] = useState("0");

  useEffect(() => {
    if (IS_SAFE_MODE) {
      const mockAddress = "0x742d...444";
      setAddress(mockAddress);
      const load = async () => {
        try {
          const contract = getReadContract();
          const bal = await contract.getWalletBalance(mockAddress);
          setMockBalance(bal.toString());
        } catch {
          setMockBalance("0");
        }
      };
      load();
      const interval = setInterval(load, 3000);
      return () => clearInterval(interval);
    }
    if (!window.ethereum) return;

    window.ethereum.request({ method: "eth_accounts" })
      .then(accounts => {
        if (accounts.length > 0) setAddress(accounts[0]);
      })
      .catch(console.error);

    window.ethereum.on("accountsChanged", accounts => {
      if (accounts.length > 0) setAddress(accounts[0]);
      else setAddress(null);
    });
    window.ethereum.on("chainChanged", () => window.location.reload());
  }, []);

  const connect = useCallback(async () => {
    if (IS_SAFE_MODE) {
      setAddress("0x742d...444");
      return;
    }
    if (!window.ethereum) {
      setError("MetaMask not found. Please install it.");
      return;
    }
    setLoading(true); setError(null);
    try {
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
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  return createElement(
    WalletContext.Provider,
    { value: { address, connect, disconnect, loading, error, mockBalance } },
    children
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
}
