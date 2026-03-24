// src/pages/Home.jsx

//Dashboard page
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import MarketCard from "../components/MarketCard";
import { useMarkets } from "../hooks/useMarkets";
import { ethers } from "ethers";

const CATEGORIES = ["All", "Crypto", "Sports", "Politics", "Tech", "Economics", "Science", "Other"];
const SORTS = ["Newest", "Most Volume", "Ending Soon", "Disputed"];
const STATUS_FILTERS = ["All", "Open", "Resolved", "Disputed"];

function StatCard({ label, value, sub, accent }) {
    return (
        <div className="bg-ox-card border border-ox-border rounded-2xl px-5 py-4 flex flex-col gap-1">
            <span className="text-ox-muted text-xs font-body">{label}</span>
            <span className={`font-display font-bold text-2xl ${accent ?? "text-white"}`}>{value}</span>
            {sub && <span className="text-ox-muted text-xs font-body">{sub}</span>}
        </div>
    );
}

export default function Home() {
    const { markets, loading } = useMarkets();
    const [category, setCategory] = useState("All");
    const [statusFilter, setStatus] = useState("All");
    const [sort, setSort] = useState("Newest");
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        let list = [...markets];
        if (category !== "All") list = list.filter((m) => m.category === category);
        if (statusFilter !== "All") list = list.filter((m) => {
            if (statusFilter === "Open") return m.status === 0;
            if (statusFilter === "Resolved") return m.status === 1;
            if (statusFilter === "Disputed") return m.status === 2;
            return true;
        });
        if (query) list = list.filter((m) => m.question.toLowerCase().includes(query.toLowerCase()));
        if (sort === "Most Volume") list.sort((a, b) => Number((b.yesPool + b.noPool) - (a.yesPool + a.noPool)));
        if (sort === "Ending Soon") list.sort((a, b) => Number(a.deadline - b.deadline));
        if (sort === "Disputed") list = list.filter((m) => m.status === 2).concat(list.filter((m) => m.status !== 2));
        return list;
    }, [markets, category, statusFilter, sort, query]);

    // Stats
    const totalVolume = markets.reduce((s, m) => s + m.yesPool + m.noPool, 0n);
    const openCount = markets.filter((m) => m.status === 0).length;
    const resolvedCount = markets.filter((m) => m.status === 1).length;

    return (
        <div className="min-h-screen bg-ox-bg dot-grid">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

                {/* Hero */}
                <section className="relative overflow-hidden rounded-3xl bg-ox-card border border-ox-border p-8 md:p-12">
                    {/* Decorative glow blobs */}
                    <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 bg-ox-green/6 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 left-1/3 w-60 h-60 bg-ox-teal/5 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ox-green/10 border border-ox-green/20 mb-5">
                                <span className="w-1.5 h-1.5 rounded-full bg-ox-green animate-pulse-slow" />
                                <span className="text-ox-green text-xs font-mono font-semibold">Live on Shardeum Sphinx Testnet</span>
                            </div>
                            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-[1.05] tracking-tight">
                                Forecast the future.<br />
                                <span className="text-glow text-ox-green">Earn the truth.</span>
                            </h1>
                            <p className="text-white/45 text-sm leading-relaxed mt-4 font-body max-w-md">
                                Decentralized prediction markets on Shardeum. Create events, stake your conviction,
                                and let an AI oracle resolve outcomes — permanently on-chain. No manipulation. No centralized arbiters.
                            </p>
                            <div className="flex flex-wrap gap-3 mt-6">
                                <Link
                                    to="/create"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ox-green text-black font-display font-bold text-sm hover:brightness-110 transition-all glow-green"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    Create Market
                                </Link>
                                <a
                                    href="#markets"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/6 text-white font-display font-semibold text-sm hover:bg-white/10 transition-all border border-white/8"
                                >
                                    Browse Markets ↓
                                </a>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[340px]">
                            <StatCard label="Total Volume" value={`₹${(Number(ethers.formatEther(totalVolume)) * 10 / 1000).toFixed(1)}K`} sub="across all markets" accent="text-ox-green" />
                            <StatCard label="Open Markets" value={openCount} sub="live right now" />
                            <StatCard label="Resolved" value={resolvedCount} sub="AI-verified" accent="text-ox-teal" />
                        </div>
                    </div>
                </section>

                {/* Filters */}
                <section id="markets" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            {STATUS_FILTERS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-display font-semibold transition-all duration-150
                    ${statusFilter === s
                                            ? "bg-white text-black"
                                            : "bg-ox-surface border border-ox-border text-ox-muted hover:text-white hover:border-white/20"}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Search */}
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ox-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search markets…"
                                    className="pl-8 pr-3 py-2 bg-ox-surface border border-ox-border rounded-lg text-sm text-white placeholder-ox-muted focus:outline-none focus:border-ox-green/40 w-44 font-body"
                                />
                            </div>
                            {/* Sort */}
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="px-3 py-2 bg-ox-surface border border-ox-border rounded-lg text-sm text-white/70 focus:outline-none focus:border-ox-green/40 font-body"
                            >
                                {SORTS.map((s) => <option key={s} className="bg-ox-card">{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Category pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {CATEGORIES.map((c) => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`px-3 py-1 rounded-full text-xs font-display font-semibold transition-all duration-150
                  ${category === c
                                        ? "bg-ox-green/20 text-ox-green border border-ox-green/30"
                                        : "bg-ox-surface border border-ox-border text-ox-muted hover:text-white hover:border-white/15"}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Market Grid */}
                <section>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-64 rounded-2xl shimmer-bg border border-ox-border" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-4xl mb-4">◈</div>
                            <p className="text-ox-muted font-body text-sm">No markets found.</p>
                            <Link to="/create" className="mt-4 inline-block text-ox-green text-sm underline font-body">Create one →</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filtered.map((m, i) => (
                                <MarketCard key={Number(m.id)} market={m} idx={i} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}