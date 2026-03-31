import { ethers } from "ethers";
import { mockContract } from "./MockContract";

// ← Loaded from .env (VITE_MARKET_ADDRESS)
export const MARKET_ADDRESS = import.meta.env.VITE_MARKET_ADDRESS;

// ← Set VITE_SAFE_MODE=true in .env to run without a real wallet
export const IS_SAFE_MODE = import.meta.env.VITE_SAFE_MODE === "true";

export const MARKET_ABI = [
  "function marketCount() view returns (uint256)",
  "function getAllMarkets() view returns (tuple(uint256 id, string question, string category, string[] options, uint256 deadline, address creator, uint8 status, uint256 outcomeIndex, string aiEvidence, uint256 totalSets, uint256[] shareReserves, uint256 createdAt, uint256 minStake)[])",
  "function getMarket(uint256) view returns (tuple(uint256 id, string question, string category, string[] options, uint256 deadline, address creator, uint8 status, uint256 outcomeIndex, string aiEvidence, uint256 totalSets, uint256[] shareReserves, uint256 createdAt, uint256 minStake))",
  "function createMarket(string, string, string[], uint256, uint256) payable returns (uint256)",
  "event MarketCreated(uint256 indexed id, string question, string category, string[] options, uint256 deadline, address creator)",
  "function buyShares(uint256, uint256) payable",
  "function sellShares(uint256, uint256, uint256)",
  "function claimReward(uint256)",
  "function getUserShares(uint256, address) view returns (uint256[])"
];

export const SHARDEUM_CHAIN = {
  chainId:         "0x1FB7",   // 8119 in hex for Shardeum Mezame Testnet
  chainName:       "Shardeum Mezame Testnet",
  nativeCurrency:  { name: "SHM", symbol: "SHM", decimals: 18 },
  rpcUrls:         ["https://api-mezame.shardeum.org"],
  blockExplorerUrls: ["https://explorer-mezame.shardeum.org/"]
};

export function getRPCProvider() {
  return new ethers.JsonRpcProvider(SHARDEUM_CHAIN.rpcUrls[0]);
}

export function getReadContract() {
  if (IS_SAFE_MODE) return mockContract;
  if (!MARKET_ADDRESS || !ethers.isAddress(MARKET_ADDRESS)) {
    console.warn("MARKET_ADDRESS is missing or invalid. Check your .env file.");
    return null;
  }
  return new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, getRPCProvider());
}

export async function getWriteContract() {
  if (IS_SAFE_MODE) return mockContract;
  if (!MARKET_ADDRESS || !ethers.isAddress(MARKET_ADDRESS)) {
    throw new Error("Cannot write: MARKET_ADDRESS is missing or invalid.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  return new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, signer);
}

export function explorerTx(hash) {
  return `https://explorer-mezame.shardeum.org/transaction/${hash}`;
}

export function explorerAddr(addr) {
  return `https://explorer-mezame.shardeum.org/account/${addr}`;
}
