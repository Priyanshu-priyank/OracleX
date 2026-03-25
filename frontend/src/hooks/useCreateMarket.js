import { useState } from "react";
import { getWriteContract } from "../utils/contracts";
import { ethers } from "ethers";

export function useCreateMarket() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [txHash,  setTxHash]  = useState(null);

  async function createMarket(question, category, options, durationHours, minStake) {
    setLoading(true); setError(null); setTxHash(null);
    try {
      const c = await getWriteContract();
      const minStakeWei = ethers.parseEther(minStake.toString());
      // Contract requires msg.value >= minStake to seed AMM liquidity
      const tx = await c.createMarket(question, category, options, durationHours, minStakeWei, {
        value: minStakeWei,
      });
      setTxHash(tx.hash);
      
      // Mock contract returns id directly
      let newIdStr;
      if (tx.id !== undefined) {
        newIdStr = tx.id.toString();
      } else {
        const receipt = await tx.wait();
        let newId = null;
        const target = (await c.getAddress()).toLowerCase();
        for (const log of receipt.logs) {
          if (String(log.address).toLowerCase() !== target) continue;
          try {
            const parsed = c.interface.parseLog(log);
            if (parsed?.name === "MarketCreated") {
              newId = parsed.args.id.toString();
              break;
            }
          } catch {
            /* ignore */
          }
        }
        if (!newId) {
          const count = await c.marketCount();
          newId = count.toString();
        }
        newIdStr = newId;
      }

      // Safe Mode validation hook
      const isSafeMode = import.meta.env.VITE_SAFE_MODE === "true";
      if (isSafeMode && newIdStr) {
        const gnewsKey = import.meta.env.VITE_GNEWS_API_KEY;
        const openAiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        
        if (gnewsKey && openAiKey) {
          try {
            console.log(`[AI Validation] Checking news for "${question}"...`);
            const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(question)}&lang=en&max=5&apikey=${gnewsKey}`;
            const newsRes = await fetch(url);
            const newsData = await newsRes.json();
            const articles = newsData.articles || [];
            
            if (articles.length > 0) {
              const headlines = articles.map(a => `- ${a.title}: ${a.description}`).join("\n");
              
              const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${openAiKey}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": window.location.origin
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash",
                  messages: [
                    {
                      role: "system",
                      content: "You are an adjudicator for a prediction market. Your job is to determine if the event in the user's question has ALREADY OCCURRED based purely on the provided news headlines. Return EXACTLY 'YES' if the headlines prove the event already happened or the question is already fully resolved. Return 'NO' if it is a future event or unresolved."
                    },
                    {
                      role: "user", 
                      content: `Question: ${question}\n\nHeadlines:\n${headlines}`
                    }
                  ]
                })
              });
              
              if (!aiRes.ok) throw new Error(`OpenRouter API Error: ${aiRes.status} - Replace the dummy API key in .env!`);

              const aiData = await aiRes.json();
              const reply = aiData.choices?.[0]?.message?.content?.trim().toUpperCase() || "";
              
              if (reply.includes("YES")) {
                console.warn(`[AI Validation] Event resolved matches found. Deleting market ${newIdStr}...`);
                await c.deleteMarket(newIdStr);
                throw new Error("Market immediately deleted: Headlines prove this event has already occurred!");
              }
            }
          } catch (err) {
            if (err.message.includes("Market immediately deleted")) throw err;
            if (err.message.includes("OpenRouter API Error")) throw err;
            console.error("[AI Validation ERROR]", err);
          }
        } else {
          console.warn("[AI Validation] Skipped: API keys not loaded (restart Vite server if you just added them).");
        }
      }

      return newIdStr;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { createMarket, loading, error, txHash };
}
