import { useState, useEffect } from "react";
import { shortenAddress } from "../utils/format";
import { ethers } from "ethers";

export default function CommunityThread({ marketId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [address, setAddress] = useState(null);

  // Mock global storage using localStorage to simulate a database for the demo
  const STORAGE_KEY = `oraclex_comments_global_${marketId}`;

  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setComments(JSON.parse(stored));
      else {
        // Initial mock comments for life
        setComments([
          { user: "0x742d...444", text: "Big movement in the news today. I think the AI will lean towards the first option.", time: Date.now() - 3600000 },
          { user: "0x123a...bc9", text: "Just bought 50 shares! This market is heating up.", time: Date.now() - 1800000 },
        ]);
      }
    };
    load();
    
    // Connect to wallet to get address
    if (window.ethereum) {
      new ethers.BrowserProvider(window.ethereum).listAccounts().then(acc => {
        if (acc.length > 0) setAddress(acc[0].address);
      });
    }
  }, [marketId, STORAGE_KEY]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !address) return;

    const comment = {
      user: address,
      text: newComment,
      time: Date.now()
    };

    const updated = [comment, ...comments];
    setComments(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewComment("");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between border-b border-gray-50 pb-6">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
          Community Discussion
        </h3>
        <span className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{comments.length} Messages</span>
      </div>

      {address ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share evidence or debate the outcome..."
            rows={3}
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none"
          />
          <div className="flex justify-end">
            <button
              disabled={!newComment.trim()}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-4 text-center text-sm font-bold text-gray-400">
          Connect your wallet to join the discussion
        </div>
      )}

      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
        {comments.map((c, i) => (
          <div key={i} className="space-y-2 border-b border-gray-50 pb-6 last:border-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded shadow-sm">{shortenAddress(c.user)}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                {new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-50/50">
              {c.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
