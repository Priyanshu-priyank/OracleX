// src/utils/format.js
//format utils
import { ethers } from "ethers";

export const shortenAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

export const formatSHM = (wei) => {
    if (!wei) return "0";
    const val = parseFloat(ethers.formatEther(wei));
    return val < 0.001 ? val.toFixed(6) : val.toFixed(4);
};

export const formatINR = (wei) => {
    // Rough illustrative conversion for UI — 1 SHM = ₹10 (adjust as needed)
    if (!wei) return "₹0";
    const shm = parseFloat(ethers.formatEther(wei));
    const inr = shm * 10;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(inr);
};

export const daysLeft = (deadline) => {
    const diff = Number(deadline) * 1000 - Date.now();
    if (diff <= 0) return "Ended";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h` : `${h}h left`;
};

export const statusLabel = (status) => ["Open", "Resolved", "Disputed"][status] ?? "Unknown";
export const statusColor = (status) =>
    ["text-ox-green", "text-ox-teal", "text-ox-yellow"][status] ?? "text-ox-muted";

export const categoryIcon = (cat) => ({
    Crypto: "₿",
    Sports: "⚽",
    Politics: "🏛",
    Science: "🔬",
    Tech: "💻",
    Economics: "📈",
    Weather: "🌦",
    Other: "◈",
})[cat] ?? "◈";