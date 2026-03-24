// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { shortenAddr } from "../utils/format";
import { SHARDEUM_CHAIN_ID } from "../utils/contracts";

export default function Navbar() {
    const { address, chainId, connecting, connect, switchToShardeum, isCorrectChain } = useWallet();
    const { pathname } = useLocation();

    return (
        <header className="sticky top-0 z-50 border-b border-ox-border bg-ox-bg/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 shrink-0">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ox-green to-ox-teal flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ox-green animate-pulse-slow border border-ox-bg" />
                    </div>
                    <span className="font-display font-800 text-xl tracking-tight text-white">
                        Oracle<span className="text-ox-green">X</span>
                    </span>
                </Link>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-1">
                    {[
                        { to: "/", label: "Markets" },
                        { to: "/create", label: "Create" },
                    ].map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 font-body ${pathname === to
                                    ? "bg-white/8 text-white"
                                    : "text-ox-muted hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Chain indicator */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-ox-border bg-ox-surface text-xs font-mono">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCorrectChain || !address ? "bg-ox-green" : "bg-ox-yellow"} animate-pulse-slow`} />
                        <span className="text-ox-muted">{isCorrectChain || !address ? "Shardeum" : "Wrong network"}</span>
                    </div>

                    {/* Wallet button */}
                    {!address ? (
                        <button
                            onClick={connect}
                            disabled={connecting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ox-green text-black text-sm font-display font-bold hover:bg-emerald-300 transition-all duration-150 disabled:opacity-60"
                        >
                            {connecting ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                                    </svg>
                                    Connecting…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-4 0v2" />
                                        <circle cx="16" cy="14" r="1" fill="currentColor" />
                                    </svg>
                                    Connect Wallet
                                </>
                            )}
                        </button>
                    ) : !isCorrectChain ? (
                        <button
                            onClick={switchToShardeum}
                            className="px-4 py-2 rounded-lg bg-ox-yellow text-black text-sm font-display font-bold hover:brightness-110 transition-all"
                        >
                            Switch to Shardeum
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ox-surface border border-ox-border">
                            <span className="w-2 h-2 rounded-full bg-ox-green" />
                            <span className="font-mono text-sm text-white">{shortenAddr(address)}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}