// src/hooks/useMarkets.js

//read all markets from contract + mock fallback
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { MARKET_CONTRACT_ADDRESS, MARKET_ABI, SHARDEUM_RPC } from "../utils/contracts";

// Mock markets shown when contract not yet deployed (address is zero)
const MOCK_MARKETS = [
    {
        id: 1n,
        question: "Will Bitcoin exceed $150,000 before Dec 31, 2025?",
        category: "Crypto",
        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 14),
        creator: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
        status: 0,
        outcome: false,
        aiEvidence: "",
        yesPool: ethers.parseEther("12.4"),
        noPool: ethers.parseEther("7.6"),
        createdAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 2),
        minStake: ethers.parseEther("0.1"),
    },
    {
        id: 2n,
        question: "Will India win the 2025 ICC Champions Trophy?",
        category: "Sports",
        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 5),
        creator: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e",
        status: 0,
        outcome: false,
        aiEvidence: "",
        yesPool: ethers.parseEther("18.9"),
        noPool: ethers.parseEther("5.1"),
        createdAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 3),
        minStake: ethers.parseEther("0.1"),
    },
    {
        id: 3n,
        question: "Will Shardeum mainnet launch before Q3 2025?",
        category: "Tech",
        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 60),
        creator: "0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f",
        status: 1,
        outcome: true,
        aiEvidence: "Claude searched current Shardeum announcements and confirmed mainnet launch in Q2 2025. Sources: shardeum.org/blog, CoinDesk report dated June 2025.",
        yesPool: ethers.parseEther("9.8"),
        noPool: ethers.parseEther("4.4"),
        createdAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 10),
        minStake: ethers.parseEther("0.1"),
    },
    {
        id: 4n,
        question: "Will global inflation drop below 3% in 2025?",
        category: "Economics",
        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 90),
        creator: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
        status: 2,
        outcome: false,
        aiEvidence: "",
        yesPool: ethers.parseEther("31.2"),
        noPool: ethers.parseEther("21.0"),
        createdAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 5),
        minStake: ethers.parseEther("0.1"),
    },
    {
        id: 5n,
        question: "Will Ethereum ETF see $1B inflows in a single week in 2025?",
        category: "Crypto",
        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
        creator: "0x7g8h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z",
        status: 0,
        outcome: false,
        aiEvidence: "",
        yesPool: ethers.parseEther("51.0"),
        noPool: ethers.parseEther("17.1"),
        createdAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 1),
        minStake: ethers.parseEther("0.2"),
    },
    {
        id: 6n,
        question: "Will OpenAI release GPT-5 before June 2025?",
        category: "Tech",
        deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 20),
        creator: "0x3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d",
        status: 0,
        outcome: false,
        aiEvidence: "",
        yesPool: ethers.parseEther("22.3"),
        noPool: ethers.parseEther("33.7"),
        createdAt: BigInt(Math.floor(Date.now() / 1000) - 86400 * 4),
        minStake: ethers.parseEther("0.1"),
    },
];

export function useMarkets() {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);

    const isDeployed = MARKET_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

    const fetchMarkets = useCallback(async () => {
        setLoading(true);
        if (!isDeployed) {
            // Use mock data when contract not deployed yet
            setMarkets(MOCK_MARKETS);
            setLoading(false);
            return;
        }
        try {
            const provider = new ethers.JsonRpcProvider(SHARDEUM_RPC);
            const contract = new ethers.Contract(MARKET_CONTRACT_ADDRESS, MARKET_ABI, provider);
            const raw = await contract.getAllMarkets();
            const parsed = raw.map((m) => ({
                id: m.id,
                question: m.question,
                category: m.category,
                deadline: m.deadline,
                creator: m.creator,
                status: Number(m.status),
                outcome: m.outcome,
                aiEvidence: m.aiEvidence,
                yesPool: m.yesPool,
                noPool: m.noPool,
                createdAt: m.createdAt,
                minStake: m.minStake,
            }));
            setMarkets(parsed.reverse());
        } catch (e) {
            console.error("Failed to fetch markets:", e);
            setMarkets(MOCK_MARKETS);
        } finally {
            setLoading(false);
        }
    }, [isDeployed]);

    useEffect(() => {
        fetchMarkets();
    }, [fetchMarkets]);

    const addOptimistic = (market) => setMarkets((prev) => [market, ...prev]);

    return { markets, loading, refetch: fetchMarkets, addOptimistic };
}