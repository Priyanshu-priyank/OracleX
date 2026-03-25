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
  const [options,   setOptions]   = useState(["YES", "NO"]);
  const [category,  setCategory]  = useState("Crypto");
  const [duration,  setDuration]  = useState(24);
  const [minBet,    setMinBet]    = useState("1000"); // Minimum bet requirement

  const previewMarket = {
    id: "preview", question: question || "Your prediction question will appear here...",
    category, options, deadline: Math.floor(Date.now() / 1000) + duration * 3600,
    status: 0, outcomeIndex: 0, aiEvidence: "", shareReserves: options.map(() => "0"), totalSets: "0", createdAt: "0", minStake: ethers.parseEther(minBet || "1000").toString()
  };

  const addOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  async function handleSubmit() {
    if (!question.trim()) return;
    if (options.some(opt => !opt.trim())) {
      alert("All options must have a label");
      return;
    }
    if (Number(minBet) < 1000) {
      alert("Minimum bet must be at least 1000 SHM");
      return;
    }
    const newId = await createMarket(question, category, options, duration, minBet);
    if (newId) navigate(`/market/${newId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create a Prediction Market</h1>
          <p className="text-base text-gray-500 mt-2 font-medium">Ask a question. Set multiple outcomes. Our AI agent will resolve it transparently.</p>
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
                  placeholder="e.g. Which team will win the 2026 World Cup?"
                  rows={3}
                  maxLength={280}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-900 font-medium focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none transition-all"
                />
                <div className="text-xs font-semibold text-gray-400 text-right mt-2">{question.length}/280</div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-gray-900">Possible Outcomes</label>
                  {options.length < 5 && (
                    <button onClick={addOption} className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                      + Add Option
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={opt}
                          onChange={e => updateOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">{String.fromCharCode(65 + idx)}</span>
                      </div>
                      {options.length > 2 && (
                        <button onClick={() => removeOption(idx)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
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
                <span>After the deadline, OracleX AI will autonomously search the web, confirm the outcome, and record its rationale permanently on Shardeum.</span>
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