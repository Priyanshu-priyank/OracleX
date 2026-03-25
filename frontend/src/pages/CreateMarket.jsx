import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MarketCard from "../components/MarketCard";
import { useCreateMarket } from "../hooks/useCreateMarket";
import { CATEGORIES } from "../utils/format";
import { explorerTx } from "../utils/contracts";
import { ethers } from "ethers";

const DURATIONS = [
  { label: "1h",  hours: 1 },
  { label: "6h",  hours: 6 },
  { label: "24h", hours: 24 },
  { label: "3d",  hours: 72 },
  { label: "7d",  hours: 168 },
];

export default function CreateMarket() {
  const navigate = useNavigate();
  const { createMarket, loading, error, txHash } = useCreateMarket();

  const [question,  setQuestion]  = useState("");
  const [optionA,   setOptionA]   = useState("YES");
  const [optionB,   setOptionB]   = useState("NO");
  const [category,  setCategory]  = useState("Crypto");
  const [duration,  setDuration]  = useState(24);
  const [minBet,    setMinBet]    = useState("1000"); // Minimum bet requirement

  const previewMarket = {
    id: "preview", question: question || "Your prediction question will appear here...",
    category, optionA, optionB, deadline: Math.floor(Date.now() / 1000) + duration * 3600,
    status: 0, outcome: false, aiEvidence: "", yesPool: "0", noPool: "0", createdAt: "0", minStake: ethers.parseEther(minBet || "1000").toString()
  };

  async function handleSubmit() {
    if (!question.trim()) return;
    if (Number(minBet) < 1000) {
      alert("Minimum bet must be at least 1000 SHM");
      return;
    }
    const newId = await createMarket(question, category, optionA, optionB, duration, minBet);
    if (newId) navigate(`/market/${newId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create a Prediction Market</h1>
          <p className="text-base text-gray-500 mt-2 font-medium">Ask a yes/no question. Set a timeframe. Our AI agent will resolve it transparently.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">

              {/* Question */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Prediction Question</label>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. Will ETH cross $4000 before the end of the month?"
                  rows={3}
                  maxLength={280}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-900 font-medium focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none transition-all"
                />
                <div className="text-xs font-semibold text-gray-400 text-right mt-2">{question.length}/280</div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Option A (YES Equivalent)</label>
                  <input
                    type="text"
                    value={optionA}
                    onChange={e => setOptionA(e.target.value)}
                    placeholder="e.g. Yes / Bullish / Won"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Option B (NO Equivalent)</label>
                  <input
                    type="text"
                    value={optionB}
                    onChange={e => setOptionB(e.target.value)}
                    placeholder="e.g. No / Bearish / Lost"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`text-sm px-5 py-2.5 rounded-xl font-bold transition-all border-2 ${category === c ? "bg-purple-50 text-purple-700 border-purple-500 shadow-sm" : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout for Duration and Min Bet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Duration */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Market Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATIONS.map(d => (
                      <button key={d.hours} onClick={() => setDuration(d.hours)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${duration === d.hours ? "bg-purple-50 text-purple-700 border-purple-500 shadow-sm" : "bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Bet */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 block">
                    Minimum Bet (SHM)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={minBet}
                      onChange={e => setMinBet(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-mono"
                      min="1000"
                      step="1"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">SHM</div>
                  </div>
                  <p className="text-xs text-amber-600 font-semibold mt-2">Platform enforced minimum: 1000 SHM</p>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 text-sm font-medium text-amber-800 shadow-inner flex gap-3 items-start">
                <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>After the deadline, Claude AI will autonomously search the web, confirm the outcome, and record its rationale permanently on Shardeum.</span>
              </div>

              {error && <p className="text-sm text-rose-600 bg-rose-50 font-medium rounded-xl p-4 border border-rose-100">{error}</p>}

              {txHash && (
                <a href={explorerTx(txHash)} target="_blank" rel="noreferrer"
                  className="flex justify-center items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 underline bg-purple-50 p-4 rounded-xl border border-purple-100">
                  View transaction on Shardeum Explorer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !question.trim() || Number(minBet) < 1000}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 transform hover:-translate-y-0.5"
              >
                {loading ? "Creating on Shardeum..." : "Create Market"}
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Market Preview</div>
            <div className="pointer-events-none opacity-90 scale-transform origin-top">
              <MarketCard market={previewMarket} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}