import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../utils/format";

export default function Navbar() {
  const { address, connect, loading } = useWallet();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--ox-border)] bg-[#0b0e11]/90 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      <Link
        to="/"
        className="font-extrabold text-xl sm:text-2xl text-[var(--ox-text)] tracking-tight hover:opacity-90 transition-opacity shrink-0"
      >
        OracleX
      </Link>

      <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-[var(--ox-muted)]">
        <Link to="/" className="hover:text-[var(--ox-text)] transition-colors">
          Markets
        </Link>
        <Link to="/create" className="hover:text-[var(--ox-text)] transition-colors">
          Create
        </Link>
        {address && (
          <Link to="/profile" className="hover:text-[var(--ox-text)] transition-colors">
            Profile
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {address ? (
          <Link
            to="/profile"
            className="text-xs sm:text-sm px-3 sm:px-5 py-2 rounded-full bg-white/5 text-[var(--ox-text)] font-bold border border-[var(--ox-border)] hover:bg-white/10 transition-colors max-w-[140px] truncate"
          >
            {shortenAddress(address)}
          </Link>
        ) : (
          <button
            onClick={connect}
            disabled={loading}
            className="text-xs sm:text-sm px-4 sm:px-6 py-2 rounded-full bg-[var(--ox-accent)] text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>
    </nav>
  );
}
