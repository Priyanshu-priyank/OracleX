import { explorerTx } from "../utils/contracts";

export default function VerdictPanel({ market, onClaim, txPending, txHash, userStakes }) {
  const won = BigInt(userStakes?.[market.outcomeIndex] ?? "0") > 0n;

  // Enhanced parsing for Jury/Consensus format
  const consensusMatch = market.aiEvidence.match(/\[(Consensus|Jury) (\d+-\d+)\]/);
  const consensusInfo  = consensusMatch ? consensusMatch[2] : null;
  
  // Extract Reason and News parts
  const reasonPart = market.aiEvidence.match(/Reason: (.*?)(\. News:| News:|$)/);
  const newsPart   = market.aiEvidence.match(/News: (.*)$/);
  
  const evidenceText = reasonPart ? reasonPart[1] : market.aiEvidence.replace(/^\[.*?\] /, "");
  const newsHeadlines = newsPart ? newsPart[1].split(" | ") : [];

  return (
    <div className="space-y-6">
      {/* Outcome banner */}
      <div className={`rounded-2xl p-6 text-center border-2 shadow-sm ${market.outcomeIndex === 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
        <div className={`text-5xl font-extrabold tracking-tight ${market.outcomeIndex === 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {market.options[market.outcomeIndex]}
        </div>
        <div className="text-sm font-semibold text-gray-500 mt-2 uppercase tracking-widest">
           Final Outcome {consensusInfo && <span className="text-gray-400">({consensusInfo} Jury Vote)</span>}
        </div>
      </div>

      {/* AI evidence */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-6 space-y-4 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="text-sm font-bold text-amber-900 uppercase tracking-wide">Decentralized Jury Verdict</span>
          </div>
        </div>
        
        <p className="text-base text-amber-950 leading-relaxed font-medium">"{evidenceText}"</p>
        
        {newsHeadlines.length > 0 && (
          <div className="pt-3 border-t border-amber-200/50 space-y-2">
            <span className="text-[10px] font-black text-amber-900/60 uppercase tracking-widest block">Exhibit A: News Evidence</span>
            {newsHeadlines.map((news, idx) => (
              <div key={idx} className="text-xs font-bold text-amber-800/80 leading-snug flex gap-2">
                <span className="text-amber-500/50">{idx + 1}.</span> {news}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs font-semibold text-amber-700/70 border-t border-amber-200/50 pt-3 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Stored permanently and auditable on Shardeum
        </p>
      </div>

      {/* Explorer link */}
      {txHash && (
        <a href={explorerTx(txHash)} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 underline transition-colors bg-purple-50 p-3 rounded-xl border border-purple-100">
          View resolution tx on Shardeum Explorer
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      )}

      {/* Claim button */}
      {won && (
        <button
          onClick={onClaim}
          disabled={txPending}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 transform hover:-translate-y-0.5"
        >
          {txPending ? "Claiming..." : "🎉 Claim your winnings"}
        </button>
      )}

      {!won && userStakes?.some(s => BigInt(s) > 0n) && (
        <div className="text-center text-sm font-medium text-gray-500 bg-gray-50 py-4 rounded-xl border border-gray-100">
          You were on the losing side this time. Better luck next prediction!
        </div>
      )}
    </div>
  );
}