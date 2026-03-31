import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MarketCard from "../components/MarketCard";
import { useCreateMarket } from "../hooks/useCreateMarket";
import { CATEGORIES } from "../utils/format";
import { explorerTx } from "../utils/contracts";
import { ethers } from "ethers";

const MACRO_D_LIST = [
  { label: "6h", hours: 6 },
  { label: "12h", hours: 12 },
  { label: "24h", hours: 24 },
  { label: "3d", hours: 72 },
  { label: "7d", hours: 168 },
];

const MICRO_D_LIST = [
  { label: "15m", hours: 0.25 },
  { label: "30m", hours: 0.5 },
  { label: "1h", hours: 1 },
  { label: "2h", hours: 2 },
  { label: "6h", hours: 6 },
];

export default function CreateMarket() {
  const navigate = useNavigate();
  const { createMarket, loading, error, txHash } = useCreateMarket();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["YES", "NO"]);
  const [category, setCategory] = useState("Crypto");
  const [marketType, setMarketType] = useState("Macro"); // Macro or Micro
  const [duration, setDuration] = useState(24);
  const [minBet, setMinBet] = useState("1000");

  const switchType = (type) => {
    setMarketType(type);
    if (type === "Micro") {
      setDuration(1);
      setMinBet("10");
    } else {
      setDuration(24);
      setMinBet("1000");
    }
  };

  const safeParse = (val, fallback) => {
    try { return ethers.parseEther(val || fallback).toString(); } catch { return ethers.parseEther(fallback).toString(); }
  };

  const previewMarket = {
    id: "preview",
    question: question || "Your question will appear here…",
    category,
    options: options.filter(o => o.trim().length > 0).length >= 2 ? options : ["YES", "NO"],
    deadline: Math.floor(Date.now() / 1000) + duration * 3600,
    status: 0,
    outcomeIndex: 0,
    aiEvidence: "",
    shareReserves: (options.length >= 2 ? options : ["YES", "NO"]).map(() => safeParse(minBet, "1000")),
    totalSets: safeParse(minBet, "1000"),
    createdAt: "0",
    minStake: safeParse(minBet, "1000"),
  };

  const addOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index, value) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  async function handleSubmit() {
    if (!question.trim()) return;
    if (options.some((opt) => !opt.trim())) {
      alert("All options must have a label");
      return;
    }
    if (marketType === "Macro" && Number(minBet) < 1000) {
      alert("Minimum bet for Macro markets must be at least 1000 SHM");
      return;
    }
    if (marketType === "Micro" && Number(minBet) < 10) {
      alert("Minimum bet for Micro markets must be at least 10 SHM");
      return;
    }
    const newId = await createMarket(question, category, options, duration, minBet);
    if (newId) navigate(`/market/${newId}`);
  }

  return (
    <div className="min-h-screen bg-[var(--ox-bg)] text-[var(--ox-text)]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Create a market</h1>
          <p className="text-[var(--ox-muted)] mt-2 text-sm sm:text-base">
            Same flow as before: question, outcomes, category from your list, duration, minimum. The contract also
            takes that minimum as <strong className="text-[var(--ox-text)]">initial liquidity</strong> (one transaction).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6 rounded-3xl border border-[var(--ox-border)] bg-[var(--ox-surface)] p-6 sm:p-8">
            {/* Type toggle */}
            <div className="flex p-1 rounded-xl bg-[#0b0e11] border border-[var(--ox-border)] w-full max-w-[300px] mb-2">
              <button
                type="button"
                onClick={() => switchType("Macro")}
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                  marketType === "Macro" ? "bg-[var(--ox-accent)] text-white shadow" : "text-[var(--ox-muted)] hover:text-white"
                }`}
              >
                Macro (≥ 6h)
              </button>
              <button
                type="button"
                onClick={() => switchType("Micro")}
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                  marketType === "Micro" ? "bg-[var(--ox-accent)] text-white shadow" : "text-[var(--ox-muted)] hover:text-white"
                }`}
              >
                Micro (≤ 6h)
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--ox-text)] mb-2">Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                maxLength={280}
                className="w-full rounded-2xl border border-[var(--ox-border)] bg-[#0b0e11] px-4 py-3 text-[var(--ox-text)] placeholder:text-[var(--ox-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ox-accent)]/40"
                placeholder="e.g. Will ETH cross $4000 this month?"
              />
              <div className="text-right text-xs text-[var(--ox-muted)] mt-1">{question.length}/280</div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold">Outcomes</label>
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-xs font-bold text-indigo-300 hover:text-indigo-200"
                  >
                    + Add option
                  </button>
                )}
              </div>
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    className="flex-1 rounded-xl border border-[var(--ox-border)] bg-[#0b0e11] px-4 py-2.5 font-bold text-[var(--ox-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ox-accent)]/40"
                    placeholder={`Option ${idx + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="px-2 text-[var(--ox-muted)] hover:text-red-400"
                      aria-label="Remove option"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-bold mb-3">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
                      category === c
                        ? "border-[var(--ox-accent)] bg-[var(--ox-accent)]/20 text-white"
                        : "border-[var(--ox-border)] bg-white/5 text-[var(--ox-muted)] hover:bg-white/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-3">Duration</label>
                <div className="grid grid-cols-5 gap-2">
                  {(marketType === "Micro" ? MICRO_D_LIST : MACRO_D_LIST).map((d) => (
                    <button
                      key={d.hours}
                      type="button"
                      onClick={() => setDuration(d.hours)}
                      className={`rounded-xl py-2.5 text-xs sm:text-sm font-bold border ${
                        duration === d.hours
                          ? "border-[var(--ox-accent)] bg-[var(--ox-accent)]/15 text-white"
                          : "border-[var(--ox-border)] bg-[#0b0e11] text-[var(--ox-muted)]"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-3">Minimum (SHM)</label>
                <input
                  type="number"
                  min="1000"
                  step="1"
                  value={minBet}
                  onChange={(e) => setMinBet(e.target.value)}
                  className="w-full rounded-xl border border-[var(--ox-border)] bg-[#0b0e11] px-4 py-2.5 font-mono font-bold text-[var(--ox-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ox-accent)]/40"
                />
                <p className="text-xs text-amber-200/80 mt-2">
                  Min limit: {marketType === "Macro" ? "1000 SHM" : "10 SHM"}. Sent once as initial liquidity.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {txHash && (
              <a
                href={explorerTx(txHash)}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-sm font-semibold text-indigo-300 hover:underline"
              >
                View transaction →
              </a>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading || 
                !question.trim() || 
                (marketType === "Macro" && Number(minBet) < 1000) ||
                (marketType === "Micro" && Number(minBet) < 10)
              }
              className="w-full rounded-2xl bg-[var(--ox-accent)] py-4 text-lg font-bold text-white hover:opacity-95 disabled:opacity-40"
            >
              {loading ? "Submitting…" : "Create market"}
            </button>
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--ox-muted)] mb-3">Preview</div>
            <div className="pointer-events-none opacity-95">
              <MarketCard market={previewMarket} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
