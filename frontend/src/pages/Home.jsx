import { useState } from "react";
import Navbar from "../components/Navbar";
import MarketCard from "../components/MarketCard";
import { useMarkets } from "../hooks/useMarkets";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../utils/format";

export default function Home() {
  const { markets, loading, error } = useMarkets();
  const [category, setCategory]    = useState("All");
  const [statusFilter, setStatus]  = useState("All");
  const navigate = useNavigate();

  const filtered = markets.filter(m => {
    const catMatch    = category === "All" || m.category === category;
    const statusMatch = statusFilter === "All"
      || (statusFilter === "Open"     && m.status === 0)
      || (statusFilter === "Resolved" && m.status === 1)
      || (statusFilter === "Disputed" && m.status === 2);
    return catMatch && statusMatch;
  });

  const totalLocked = markets.reduce((sum, m) => sum + BigInt(m.yesPool) + BigInt(m.noPool), 0n);
  const openCount   = markets.filter(m => m.status === 0).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />

      {/* Stats strip */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 sticky top-[73px] z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-1.5"><strong className="text-gray-900 text-base">{markets.length}</strong> total markets</span>
          <span className="flex items-center gap-1.5"><strong className="text-gray-900 text-base">{openCount}</strong> active</span>
          <span className="flex items-center gap-1.5"><strong className="text-gray-900 text-base">{(Number(totalLocked) / 1e18).toFixed(2)} SHM</strong> locked</span>
          <span className="text-emerald-600 font-bold ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Powered by Shardeum Sphinx
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main feed */}
          <div className="flex-1 space-y-6">
            {/* Hero CTA */}
            <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl shadow-purple-500/10">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Predict. Earn. Be Proven Right.</h1>
                <p className="text-purple-100 text-base font-medium max-w-lg">AI-verified outcomes. On-chain transparency. Micro-bets starting from just 1000 SHM.</p>
              </div>
              <button
                onClick={() => navigate("/create")}
                className="shrink-0 bg-white text-purple-700 font-bold text-base px-6 py-3.5 rounded-2xl hover:bg-purple-50 transition-all hover:scale-105 shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Market
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex gap-2 flex-wrap">
                {["All", ...CATEGORIES].map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`text-sm px-4 py-2 rounded-xl font-bold transition-all ${category === c ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {["All", "Open", "Resolved", "Disputed"].map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`text-sm px-5 py-1.5 rounded-lg font-bold transition-all ${statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Market grid */}
            {loading && (
              <div className="text-center py-20 text-gray-400 font-medium flex flex-col items-center gap-4">
                <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading markets from Shardeum...
              </div>
            )}
            {error && (
              <div className="text-center py-12 text-rose-500 font-medium bg-rose-50 rounded-2xl border border-rose-100">Error: {error}</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-20 text-gray-500 font-medium bg-white rounded-3xl border border-gray-100 border-dashed">
                <div className="text-4xl mb-4">🔮</div>
                No markets found matching your filters.<br/>
                <button onClick={() => navigate("/create")} className="text-purple-600 hover:text-purple-700 font-bold underline mt-2">Create the first one.</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map(m => <MarketCard key={m.id} market={m} />)}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">How OracleX Works</div>
              <div className="space-y-6">
                {[
                  ["1", "Create a market", "Ask any yes/no question with a deadline and minimum bet."],
                  ["2", "Stake SHM", "Bet YES or NO — funds are locked securely on-chain."],
                  ["3", "AI resolves", "OracleX searches the web, stores its verifiable verdict on Shardeum."],
                  ["4", "Claim rewards", "Winners receive proportional payouts automatically."],
                ].map(([n, title, desc]) => (
                  <div key={n} className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 font-black flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">{n}</div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 mb-0.5">{title}</div>
                      <div className="text-xs text-gray-500 leading-relaxed font-medium">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6">
               <h3 className="text-sm font-bold text-indigo-900 mb-2">Hackathon Note</h3>
               <p className="text-xs text-indigo-700 leading-relaxed font-medium mb-3">
                 OracleX uses AI as a decentralized oracle to prevent voting manipulation. Minimum bets are fully customizable but default to 1000 SHM per requirement.
               </p>
               <a href="https://explorer-sphinx.shardeum.org/" target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline">Explore Shardeum Testnet →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}