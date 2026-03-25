import { ethers } from "ethers";

export function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatSHM(wei) {
  return parseFloat(ethers.formatEther(BigInt(wei.toString()))).toFixed(3);
}

export function timeLeft(deadline) {
  const diff = Number(deadline) * 1000 - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}



export function statusLabel(s) {
  return ["Open", "Resolved", "Disputed"][Number(s)] ?? "Unknown";
}

export const CATEGORIES = ["Crypto", "Sports", "Politics", "Finance", "Daily Life", "Other"];