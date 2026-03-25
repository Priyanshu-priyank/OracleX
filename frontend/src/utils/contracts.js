import { ethers } from "ethers";

// ← Loaded from .env (VITE_MARKET_ADDRESS)
export const MARKET_ADDRESS = import.meta.env.VITE_MARKET_ADDRESS;

export const MARKET_ABI = [
  "function marketCount() view returns (uint256)",
  "function getAllMarkets() view returns (tuple(uint256 id, string question, string category, string optionA, string optionB, uint256 deadline, address creator, uint8 status, bool outcome, string aiEvidence, uint256 yesPool, uint256 noPool, uint256 createdAt, uint256 minStake)[])",
  "function getMarket(uint256) view returns (tuple(uint256 id, string question, string category, string optionA, string optionB, uint256 deadline, address creator, uint8 status, bool outcome, string aiEvidence, uint256 yesPool, uint256 noPool, uint256 createdAt, uint256 minStake))",
  "function createMarket(string, string, string, string, uint256, uint256) returns (uint256)",
  "function stake(uint256, bool) payable",
  "function claimReward(uint256)",
  "function raiseDispute(uint256)",
  "function getUserStakes(uint256, address) view returns (uint256, uint256)"
];

export const SHARDEUM_CHAIN = {
  chainId:         "0x1FB7",   // 8119 in hex for Mezame Testnet
  chainName:       "Shardeum Mezame Testnet",
  nativeCurrency:  { name: "SHM", symbol: "SHM", decimals: 18 },
  rpcUrls:         ["https://api-mezame.shardeum.org"],
  blockExplorerUrls: ["https://explorer.shardeum.org/"]
};

export function getReadContract() {
  const provider = new ethers.JsonRpcProvider("https://api-mezame.shardeum.org");
  return new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, provider);
}

export async function getWriteContract() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  return new ethers.Contract(MARKET_ADDRESS, MARKET_ABI, signer);
}

export function explorerTx(hash) {
  return `https://explorer.shardeum.org/transaction/${hash}`;
}

export function explorerAddr(addr) {
  return `https://explorer.shardeum.org/account/${addr}`;
}