import OpenAI from "openai";
import { ethers } from "ethers";
import cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const MARKET_ABI = [
  "function marketCount() view returns (uint256)",
  "function getMarket(uint256) view returns (tuple(uint256 id, string question, string category, string[] options, uint256 deadline, address creator, uint8 status, uint256 outcomeIndex, string aiEvidence, uint256[] shareReserves, uint256 totalSets, uint256 createdAt, uint256 minStake))",
  "function aiResolve(uint256, uint256, string, uint256) external"
];

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const provider = new ethers.JsonRpcProvider(process.env.SHARDEUM_RPC);
const wallet = new ethers.Wallet(process.env.RESOLVER_PRIVATE_KEY, provider);
const market = new ethers.Contract(process.env.MARKET_ADDRESS, MARKET_ABI, wallet);

// Simple in-memory cache for news articles
const articlesCache = new Map(); // marketId -> { question, articles: [] }

// GNews Scraper function
async function newsScraper(marketId, question, chunkIndex, totalChunks) {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      console.warn(`[GNews] SKIP: GNEWS_API_KEY not set. Market ${marketId}.`);
      return;
    }

    console.log(`\n[SCRAPER] Market ${marketId} (Chunk ${chunkIndex + 1}/${totalChunks}): Searching GNews...`);

    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(question)}&lang=en&max=5&apikey=${apiKey}`;
    const response = await axios.get(url);
    const articles = response.data.articles || [];

    if (articles.length > 0) {
      const existing = articlesCache.get(marketId) || { question, articles: [] };
      existing.articles = [...existing.articles, ...articles].slice(-20); // Keep last 20 articles
      articlesCache.set(marketId, existing);
      console.log(`[GNews] Cached ${articles.length} new articles. Total: ${existing.articles.length}`);
    }
  } catch (err) {
    console.error(`[GNews ERROR] Market ${marketId}:`, err.message);
  }
}

async function getJuryVerdict(model, role, marketInfo, evidence) {
  try {
    const optionsList = marketInfo.options.map((opt, i) => `${i}: ${opt}`).join(", ");
    
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an AI Jury Member (${role}) resolving a prediction market. Determine which of the possible options occurred based on news evidence. Respond ONLY with a JSON object: {"outcomeIndex": number, "confidence": 0-100, "reasoning": "1 sentence explaination"}. Options: ${optionsList}.`
        },
        {
          role: "user",
          content: `Evidence from Web Search:\n${evidence}\n\nQuestion: "${marketInfo.question}"\nOptions: ${optionsList}\nCategory: ${marketInfo.category}`
        }
      ],
      max_tokens: 500
    });

    const text = response.choices[0].message.content.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error(`  - [Jury Member Error] ${role} (${model}):`, err.message);
    return null;
  }
}

// Sentiment-Informed DAMM Logic
function calculateDAMM(m, articles, confidence, outcomeIndex) {
  const totalSets = BigInt(m.totalSets);
  const winReserve = BigInt(m.shareReserves[outcomeIndex]);
  
  // 1. Market Heat: Based on pool volume and news density
  const poolHeat = Number(totalSets / BigInt(1e18)); // Scale to SHM
  const newsDensity = articles.length;
  const marketHeat = Math.min(100, Math.floor((poolHeat * 2) + (newsDensity * 5)));
  
  // 2. Sentiment Score: Derived from Jury confidence and pooling ratio
  // In CPMM, price is inversely proportional to reserve
  const poolRatio = totalSets > 0n ? Number(((totalSets - winReserve) * 100n) / totalSets) : 50;
  const sentimentScore = Math.floor((poolRatio * 0.4) + (confidence * 0.6));
  
  return { marketHeat, sentimentScore };
}

async function resolveMarket(id, question, category) {
  const m = await market.getMarket(id);
  console.log(`\n[${new Date().toISOString()}] ⚖️ JURY TRIAL: Market ${id}: "${question}"`);

  const cache = articlesCache.get(id);
  const articles = cache?.articles || [];
  const evidenceText = articles.length 
    ? articles.map((a, i) => `- ${a.title} (${a.source.name})`).join("\n")
    : "No specific web evidence found.";

  // Define the Jury
  const juryMembers = [
    { model: "nvidia/nemotron-3-super-120b-a12b:free", role: "Chief Justice" },
    { model: "nvidia/nemotron-3-super-120b-a12b:free", role: "DAMM Evaluator" },
    { model: "nvidia/nemotron-3-super-120b-a12b:free", role: "Fact-Checker" }
  ];

  console.log(`  > Deliberating between options: ${m.options.join(", ")}...`);
  const votes = await Promise.all(juryMembers.map(mem => getJuryVerdict(mem.model, mem.role, m, evidenceText)));

  const validVotes = votes.filter(v => v !== null && v.outcomeIndex !== undefined);
  if (validVotes.length === 0) {
      console.error("  ❌ No valid votes received from Jury.");
      return;
  }

  // Tally Votes by Index
  const counts = {};
  validVotes.forEach(v => {
      counts[v.outcomeIndex] = (counts[v.outcomeIndex] || 0) + 1;
  });

  let winnerIndex = 0;
  let maxVotes = -1;
  for (const idx in counts) {
      if (counts[idx] > maxVotes) {
          maxVotes = counts[idx];
          winnerIndex = parseInt(idx);
      }
  }

  const avgConfidence = Math.floor(validVotes.reduce((acc, v) => acc + v.confidence, 0) / validVotes.length);
  
  // Calculate DAMM Metrics
  const { marketHeat, sentimentScore } = calculateDAMM(m, articles, avgConfidence, winnerIndex);
  
  // Combine reasoning and news for on-chain storage
  const consensusReasoning = validVotes.map(v => v.reasoning).join(" ");
  const topNews = articles.slice(0, 2).map((a, i) => `(${i+1}) ${a.title}`).join(" | ");
  
  // Enhanced On-Chain Evidence
  const winnerLabel = m.options[winnerIndex];
  const evidenceOnChain = `[Consensus ${maxVotes}/${validVotes.length}] Outcome: ${winnerLabel}. Heat: ${marketHeat}% | Sentiment: ${sentimentScore}% | News: ${topNews}`;

  console.log(`  > Verdict: ${winnerLabel} | Confidence: ${avgConfidence}% | Heat: ${marketHeat}%`);
  console.log(`  > Storing on-chain: ${evidenceOnChain}`);

  try {
    const tx = await market.aiResolve(id, winnerIndex, evidenceOnChain, avgConfidence);
    await tx.wait();
    console.log(`  ✅ Resolved on-chain: ${tx.hash}`);
    articlesCache.delete(id); 
  } catch (err) {
    console.error("  ❌ AI Resolve Tx Failed:", err.message);
  }
}

async function checkAndResolve() {
  try {
    const count = await market.marketCount();
    const now = Math.floor(Date.now() / 1000);

    for (let i = 1; i <= Number(count); i++) {
      const m = await market.getMarket(i);
      if (Number(m.status) === 0 && Number(m.deadline) <= now) {
        await resolveMarket(i, m.question, m.category);
      }
    }
  } catch (err) {
    console.error("Resolver error:", err.message);
  }
}

async function handleNewBet(id) {
  try {
    const m = await market.getMarket(id);
    const now = Math.floor(Date.now() / 1000);
    const remainingSec = Number(m.deadline) - now;
    if (remainingSec <= 0) return;

    const remainingMin = Math.floor(remainingSec / 60);
    console.log(`New activity on market ${id}. Ensuring scrapes are scheduled.`);

    const CHUNK_SIZE_MIN = 5;
    const totalChunks = Math.max(1, Math.floor(remainingMin / CHUNK_SIZE_MIN));

    for (let i = 0; i < totalChunks; i++) {
      setTimeout(() => newsScraper(id, m.question, i, totalChunks), i * CHUNK_SIZE_MIN * 60 * 1000);
    }
  } catch (err) {
    console.error("Error handling new activity:", err.message);
  }
}

// Listen for events
console.log("OracleX Decentralized Jury starting...");
console.log("Listening for MarketCreated events...");
market.on("MarketCreated", (id, question, category, options, deadline, creator, minStake) => {
  console.log(`\n[EVENT] MarketCreated: Market ${id} | Question: "${question}" | Options: ${options.join(", ")}`);
  handleNewBet(id);
});

console.log("Listening for StakePlaced events...");
market.on("StakePlaced", (id, user, optionIndex, amount) => {
  console.log(`\n[EVENT] StakePlaced: Market ${id} | User: ${user} | Option: ${optionIndex} | SHM: ${ethers.formatEther(amount)}`);
  handleNewBet(id);
});

// Initial check
checkAndResolve();
// Schedule
cron.schedule("*/2 * * * *", checkAndResolve);
console.log("OracleX Jury trial system running — checking every 2m.");
