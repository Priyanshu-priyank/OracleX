import { useState } from "react";
import Navbar from "../components/Navbar";
import MarketCard from "../components/MarketCard";
import { useMarkets } from "../hooks/useMarkets";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../utils/format";

export default function Home() {
  const { markets, loading, error } = useMarkets();
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatus] = useState("All");
  const navigate = useNavigate();

  const filtered = markets.filter((m) => {
    const catMatch = category === "All" || m.category === category;
    const statusMatch =
      statusFilter === "All" ||
      (statusFilter === "Open" && m.status === 0) ||
      (statusFilter === "Resolved" && m.status === 1) ||
      (statusFilter === "Disputed" && m.status === 2);
    return catMatch && statusMatch;
  });

  const totalLocked = markets.reduce((sum, m) => sum + BigInt(m.totalSets || "0"), 0n);
  const openCount = markets.filter((m) => m.status === 0).length;

  return (
    <div className="min-h-screen bg-[var(--ox-bg)] text-[var(--ox-text)]">
      <Navbar />

      <div className="border-b border-[var(--ox-border)] bg-[#0b0e11]/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--ox-muted)]">
          <span>
            <strong className="text-[var(--ox-text)]">{markets.length}</strong> markets
          </span>
          <span>
            <strong className="text-[var(--ox-text)]">{openCount}</strong> open
          </span>
          <span>
            <strong className="text-[var(--ox-text)]">{(Number(totalLocked) / 1e18).toFixed(2)}</strong> SHM locked
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Markets</h1>
            <p className="text-sm text-[var(--ox-muted)] mt-1">
              OracleX on Shardeum — same categories and filters as before.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/create")}
            className="shrink-0 rounded-xl bg-[var(--ox-accent)] px-5 py-3 text-sm font-bold text-white hover:opacity-95 transition-opacity"
          >
            Create market
          </button>
        </div>

        {/* Category chips — only CATEGORIES + All (no extra reference categories) */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                category === c
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-transparent bg-white/5 text-[var(--ox-muted)] hover:bg-white/10 hover:text-[var(--ox-text)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-2">
          {["All", "Open", "Resolved", "Disputed"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-lg px-4 py-2 text-sm font-bold border transition-colors ${
                statusFilter === s
                  ? "border-[var(--ox-border)] bg-[var(--ox-surface)] text-[var(--ox-text)]"
                  : "border-transparent text-[var(--ox-muted)] hover:text-[var(--ox-text)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-20 text-center text-[var(--ox-muted)]">Loading markets…</div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--ox-border)] bg-[var(--ox-surface)] py-16 text-center text-[var(--ox-muted)]">
            <p className="mb-4">No markets match your filters.</p>
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="font-bold text-[var(--ox-accent)] hover:underline"
            >
              Create one
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
