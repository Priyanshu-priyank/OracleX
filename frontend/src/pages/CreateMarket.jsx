// src/pages/CreateMarket.jsx

//full form with all validations
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import { useWallet } from "../hooks/useWallet";
import { MARKET_CONTRACT_ADDRESS, MARKET_ABI } from "../utils/contracts";

const CATEGORIES = ["Crypto", "Sports", "Politics", "Tech", "Economics", "Science", "Other"];
const INR_PER_SHM = 10;
const PLATFORM_MIN_INR = 1000;

const DURATION_PRESETS = [
    { label: "1 Day", hours: 24 },
    { label: "3 Days", hours: 72 },
    { label: "1 Week", hours: 168 },
    { label: "1 Month", hours: 720 },
    { label: "Custom", hours: null },
];

function Field({ label, hint, error, children }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-sm font-display font-semibold text-white/80">{label}</label>
                {hint && <span className="text-xs text-ox-muted font-body">{hint}</span>}
            </div>
            {children}
            {error && (
                <p className="text-ox-red text-xs font-body flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 shrink-0">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}

export default function CreateMarket() {
    const navigate = useNavigate();
    const { signer, address, isCorrectChain, connect, switchToShardeum } = useWallet();

    const [form, setForm] = useState({
        question: "",
        category: "Crypto",
        durationPreset: "1 Week",
        customHours: "",
        minBetINR: "1000",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const set = (key, val) => {
        setForm((p) => ({ ...p, [key]: val }));
        setErrors((p) => ({ ...p, [key]: undefined }));
    };

    const selectedPreset = DURATION_PRESETS.find((p) => p.label === form.durationPreset);
    const durationHours = selectedPreset?.hours ?? parseInt(form.customHours, 10);

    const validate = () => {
        const e = {};
        if (!form.question.trim() || form.question.trim().length < 10)
            e.question = "Question must be at least 10 characters";
        if (form.question.trim().length > 200)
            e.question = "Max 200 characters";
        if (!form.category)
            e.category = "Pick a category";
        if (!durationHours || isNaN(durationHours) || durationHours < 1)
            e.duration = "Duration must be at least 1 hour";
        if (durationHours > 8760)
            e.duration = "Max duration is 1 year (8760 hours)";
        const minBet = parseFloat(form.minBetINR);
        if (isNaN(minBet) || minBet < PLATFORM_MIN_INR)
            e.minBet = `Minimum is ₹${PLATFORM_MIN_INR.toLocaleString()}`;
        return e;
    };

    const handleSubmit = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        if (!address) { connect(); return; }
        if (!isCorrectChain) { switchToShardeum(); return; }

        setLoading(true);
        try {
            const minStakeWei = ethers.parseEther((parseFloat(form.minBetINR) / INR_PER_SHM).toString());

            if (MARKET_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
                // Demo mode — no contract deployed yet
                await new Promise((res) => setTimeout(res, 1800));
                setTxHash("0xdemo_" + Date.now().toString(16));
                setSubmitted(true);
                return;
            }

            const contract = new ethers.Contract(MARKET_CONTRACT_ADDRESS, MARKET_ABI, signer);
            const tx = await contract.createMarket(
                form.question.trim(),
                form.category,
                durationHours,
                minStakeWei,
            );
            setTxHash(tx.hash);
            await tx.wait();
            setSubmitted(true);
        } catch (err) {
            setErrors({ submit: err.reason ?? err.message ?? "Transaction failed" });
        } finally {
            setLoading(false);
        }
    };

    const endDate = durationHours
        ? new Date(Date.now() + durationHours * 3600000).toLocaleString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        })
        : null;

    if (submitted) {
        return (
            <div className="min-h-screen bg-ox-bg dot-grid">
                <Navbar />
                <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6 animate-fade-up">
                    <div className="w-20 h-20 rounded-full bg-ox-green/15 border border-ox-green/30 flex items-center justify-center mx-auto">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2.5" className="w-9 h-9">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-display font-bold text-2xl text-white">Market Created!</h2>
                        <p className="text-ox-muted text-sm font-body mt-2">Your prediction market is live on Shardeum.</p>
                    </div>
                    {txHash && (
                        <div className="bg-ox-surface border border-ox-border rounded-xl p-4 text-left space-y-1">
                            <p className="text-xs text-ox-muted font-body">Transaction Hash</p>
                            <p className="font-mono text-xs text-ox-green break-all">{txHash}</p>
                        </div>
                    )}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-2.5 rounded-xl bg-ox-green text-black font-display font-bold text-sm hover:brightness-110 transition-all"
                        >
                            View Markets
                        </button>
                        <button
                            onClick={() => { setSubmitted(false); setForm({ question: "", category: "Crypto", durationPreset: "1 Week", customHours: "", minBetINR: "1000" }); setTxHash(null); }}
                            className="px-6 py-2.5 rounded-xl bg-ox-surface border border-ox-border text-white font-display font-semibold text-sm hover:bg-ox-card transition-all"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ox-bg dot-grid">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-up">
                {/* Page header */}
                <div>
                    <div className="flex items-center gap-2 text-ox-muted text-sm font-body mb-3">
                        <button onClick={() => navigate("/")} className="hover:text-white transition-colors">Markets</button>
                        <span>/</span>
                        <span className="text-white">Create</span>
                    </div>
                    <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">Create a Market</h1>
                    <p className="text-ox-muted text-sm font-body mt-2">
                        Your market will be resolved by an AI oracle (Claude) that searches the web for evidence and stores its verdict permanently on Shardeum.
                    </p>
                </div>

                {/* Form card */}
                <div className="bg-ox-card border border-ox-border rounded-2xl divide-y divide-ox-border overflow-hidden">

                    {/* Section 1: Question */}
                    <div className="p-6 space-y-4">
                        <p className="text-xs text-ox-muted font-display font-semibold uppercase tracking-widest">01 · Market Question</p>
                        <Field
                            label="Your prediction question"
                            hint={`${form.question.length}/200`}
                            error={errors.question}
                        >
                            <textarea
                                value={form.question}
                                onChange={(e) => set("question", e.target.value)}
                                placeholder="Will Bitcoin exceed $150,000 before Dec 31, 2025?"
                                rows={3}
                                maxLength={200}
                                className={`w-full px-4 py-3 rounded-xl bg-ox-surface border font-body text-white placeholder-ox-muted text-sm resize-none
                  focus:outline-none focus:ring-1 transition-all leading-relaxed
                  ${errors.question
                                        ? "border-ox-red/50 focus:ring-ox-red/20"
                                        : "border-ox-border focus:border-ox-green/50 focus:ring-ox-green/20"}`}
                            />
                        </Field>

                        {/* Tips */}
                        <div className="bg-ox-surface rounded-xl p-4 space-y-1.5">
                            <p className="text-xs text-ox-muted font-display font-semibold">Tips for good markets</p>
                            {[
                                "Must be answerable with YES or NO",
                                "Include a clear deadline",
                                "Be specific — AI needs to find verifiable evidence",
                            ].map((t) => (
                                <p key={t} className="text-xs text-white/45 font-body flex items-start gap-2">
                                    <span className="text-ox-green mt-0.5">·</span> {t}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Category */}
                    <div className="p-6 space-y-4">
                        <p className="text-xs text-ox-muted font-display font-semibold uppercase tracking-widest">02 · Category</p>
                        <Field label="Category" error={errors.category}>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => set("category", c)}
                                        className={`px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-150 border
                      ${form.category === c
                                                ? "bg-ox-green/20 text-ox-green border-ox-green/40 shadow-[0_0_14px_rgba(0,229,160,0.15)]"
                                                : "bg-ox-surface text-ox-muted border-ox-border hover:border-white/20 hover:text-white"}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </div>

                    {/* Section 3: Duration */}
                    <div className="p-6 space-y-4">
                        <p className="text-xs text-ox-muted font-display font-semibold uppercase tracking-widest">03 · Duration</p>
                        <Field label="Market duration" error={errors.duration} hint={endDate ? `Ends: ${endDate}` : null}>
                            <div className="flex flex-wrap gap-2">
                                {DURATION_PRESETS.map((p) => (
                                    <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => set("durationPreset", p.label)}
                                        className={`px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-150 border
                      ${form.durationPreset === p.label
                                                ? "bg-ox-green/20 text-ox-green border-ox-green/40"
                                                : "bg-ox-surface text-ox-muted border-ox-border hover:border-white/20 hover:text-white"}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            {form.durationPreset === "Custom" && (
                                <div className="mt-3 flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={1}
                                        max={8760}
                                        value={form.customHours}
                                        onChange={(e) => set("customHours", e.target.value)}
                                        placeholder="e.g. 48"
                                        className="w-32 px-4 py-2.5 rounded-xl bg-ox-surface border border-ox-border text-white font-mono text-sm focus:outline-none focus:border-ox-green/50"
                                    />
                                    <span className="text-ox-muted text-sm font-body">hours</span>
                                </div>
                            )}
                        </Field>
                    </div>

                    {/* Section 4: Minimum bet */}
                    <div className="p-6 space-y-4">
                        <p className="text-xs text-ox-muted font-display font-semibold uppercase tracking-widest">04 · Minimum Bet</p>
                        <Field
                            label="Minimum bet amount (₹)"
                            hint="Platform floor: ₹1,000"
                            error={errors.minBet}
                        >
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ox-muted font-display font-bold text-lg">₹</span>
                                <input
                                    type="number"
                                    min={PLATFORM_MIN_INR}
                                    step={500}
                                    value={form.minBetINR}
                                    onChange={(e) => set("minBetINR", e.target.value)}
                                    placeholder="1000"
                                    className={`w-full pl-9 pr-4 py-3 rounded-xl bg-ox-surface border font-mono text-white placeholder-ox-muted text-sm
                    focus:outline-none focus:ring-1 transition-all
                    ${errors.minBet
                                            ? "border-ox-red/50 focus:ring-ox-red/20"
                                            : "border-ox-border focus:border-ox-green/50 focus:ring-ox-green/20"}`}
                                />
                            </div>
                            {/* Preset amounts */}
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {[1000, 2500, 5000, 10000].map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => set("minBetINR", String(v))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all border
                      ${form.minBetINR === String(v)
                                                ? "bg-ox-green/15 text-ox-green border-ox-green/30"
                                                : "bg-ox-surface border-ox-border text-ox-muted hover:text-white hover:border-white/20"}`}
                                    >
                                        ₹{(v / 1000).toFixed(0)}K
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-ox-muted font-body">
                                In SHM: {(parseFloat(form.minBetINR || 0) / INR_PER_SHM).toFixed(2)} SHM
                                <span className="ml-2 text-white/20">(1 SHM = ₹{INR_PER_SHM})</span>
                            </p>
                        </Field>
                    </div>

                    {/* Section 5: Preview + Submit */}
                    <div className="p-6 space-y-4">
                        {/* Preview card */}
                        {form.question.trim().length >= 10 && (
                            <div className="bg-ox-surface border border-ox-border rounded-xl p-4 space-y-3">
                                <p className="text-xs text-ox-muted font-display font-semibold uppercase tracking-widest">Preview</p>
                                <p className="text-white font-display font-semibold text-sm">{form.question}</p>
                                <div className="flex flex-wrap gap-2 text-xs font-body text-ox-muted">
                                    <span className="bg-ox-card px-2 py-1 rounded-md border border-ox-border">{form.category}</span>
                                    {endDate && <span className="bg-ox-card px-2 py-1 rounded-md border border-ox-border">Ends {endDate}</span>}
                                    <span className="bg-ox-card px-2 py-1 rounded-md border border-ox-border">Min ₹{parseFloat(form.minBetINR || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Submit error */}
                        {errors.submit && (
                            <div className="flex items-center gap-2 bg-ox-red/10 border border-ox-red/20 rounded-xl px-4 py-3">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-ox-red shrink-0">
                                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                                </svg>
                                <span className="text-ox-red text-xs font-body">{errors.submit}</span>
                            </div>
                        )}

                        {/* Wallet warning */}
                        {!address && (
                            <div className="flex items-center gap-3 bg-ox-yellow/8 border border-ox-yellow/20 rounded-xl px-4 py-3">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#ffd60a" strokeWidth="2" className="w-4 h-4 shrink-0">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span className="text-ox-yellow text-xs font-body">Connect your wallet to deploy this market on Shardeum</span>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-display font-bold text-base transition-all duration-150
                bg-ox-green text-black hover:brightness-110 shadow-[0_0_28px_rgba(0,229,160,0.2)]
                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                                    </svg>
                                    Deploying to Shardeum…
                                </span>
                            ) : !address ? "Connect Wallet & Create" :
                                !isCorrectChain ? "Switch to Shardeum" :
                                    "Create Market →"}
                        </button>

                        <p className="text-center text-ox-muted text-[11px] font-body">
                            Market creation is free · Fund locking is handled by the smart contract · AI oracle resolves at deadline
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}