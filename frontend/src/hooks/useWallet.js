// src/hooks/useWallet.js

//Metamask+ Sharedeum chain switching
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { SHARDEUM_CHAIN_ID, SHARDEUM_RPC } from "../utils/contracts";

export function useWallet() {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [address, setAddress] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);

    const isCorrectChain = chainId === SHARDEUM_CHAIN_ID;

    const connect = useCallback(async () => {
        if (!window.ethereum) {
            setError("MetaMask not found. Install it from metamask.io");
            return;
        }
        setConnecting(true);
        setError(null);
        try {
            const _provider = new ethers.BrowserProvider(window.ethereum);
            await _provider.send("eth_requestAccounts", []);
            const _signer = await _provider.getSigner();
            const _address = await _signer.getAddress();
            const network = await _provider.getNetwork();

            setProvider(_provider);
            setSigner(_signer);
            setAddress(_address);
            setChainId(Number(network.chainId));
        } catch (e) {
            setError(e.message ?? "Connection failed");
        } finally {
            setConnecting(false);
        }
    }, []);

    const switchToShardeum = useCallback(async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x" + SHARDEUM_CHAIN_ID.toString(16) }],
            });
        } catch (switchErr) {
            if (switchErr.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0x" + SHARDEUM_CHAIN_ID.toString(16),
                        chainName: "Shardeum Sphinx 1.X",
                        nativeCurrency: { name: "SHM", symbol: "SHM", decimals: 18 },
                        rpcUrls: [SHARDEUM_RPC],
                        blockExplorerUrls: ["https://explorer-sphinx.shardeum.org/"],
                    }],
                });
            }
        }
    }, []);

    useEffect(() => {
        if (!window.ethereum) return;
        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) { setAddress(null); setSigner(null); }
            else connect();
        };
        const handleChainChanged = (id) => setChainId(parseInt(id, 16));
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
        return () => {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
    }, [connect]);

    return { provider, signer, address, chainId, isCorrectChain, connecting, error, connect, switchToShardeum };
}