import { explorerTx } from "../utils/contracts";
import { formatSHM } from "../utils/format";

export default function VerdictPanel({ market, onClaim, txPending, txHash, userShares }) {
  const won = BigInt(userShares?.[market.outcomeIndex] ?? "0") > 0n;
  const label = market.options?.[market.outcomeIndex] ?? "—";
  const ev = market.aiEvidence || "";

  const consensusMatch = ev.match(/\[(Consensus|Jury) (\d+-\d+)\]/);
  const consensusInfo = consensusMatch ? consensusMatch[2] : null;
  const reasonPart = ev.match(/Reason: (.*?)(\. News:| News:|$)/);
  const newsPart = ev.match(/News: (.*)$/);
  const evidenceText = reasonPart ? reasonPart[1] : ev.replace(/^\[.*?\] /, "");
  const newsHeadlines = newsPart ? newsPart[1].split(" | ") : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-emerald-300">{label}</div>
        <div className="text-sm font-semibold text-[var(--ox-muted)] mt-2 uppercase tracking-widest">
          Final outcome {consensusInfo && <span className="text-[var(--ox-muted)]">({consensusInfo})</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
        <div className="text-xs font-bold text-amber-200 uppercase tracking-wide">Resolution evidence</div>
        <p className="text-base text-amber-50 leading-relaxed font-medium">&quot;{evidenceText}&quot;</p>
        {newsHeadlines.length > 0 && (
          <div className="pt-3 border-t border-amber-500/20 space-y-2">
            {newsHeadlines.map((news, idx) => (
              <div key={idx} className="text-xs font-medium text-amber-100/90 flex gap-2">
                <span className="text-amber-500/50">{idx + 1}.</span> {news}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-[var(--ox-muted)] border-t border-amber-500/20 pt-3">On-chain on Shardeum</p>
      </div>

      {won && (
        <button
          type="button"
          onClick={onClaim}
          disabled={txPending}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-lg hover:opacity-95 disabled:opacity-50"
        >
          {txPending ? "Claiming…" : `Claim ${formatSHM(userShares?.[market.outcomeIndex] ?? 0)} SHM`}
        </button>
      )}

      {txHash && (
        <a
          href={explorerTx(txHash)}
          target="_blank"
          rel="noreferrer"
          className="block text-sm font-semibold text-indigo-300 hover:underline text-center"
        >
          View claim tx →
        </a>
      )}

      {!won && userShares?.some((s) => BigInt(s) > 0n) && (
        <div className="text-center text-sm text-[var(--ox-muted)] border border-[var(--ox-border)] rounded-xl py-4">
          You did not hold the winning outcome shares.
        </div>
      )}
    </div>
  );
}
