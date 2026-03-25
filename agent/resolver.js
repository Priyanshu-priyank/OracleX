import OpenAI from "openai";
import { ethers } from "ethers";
import cron from "node-cron";
import dotenv from "dotenv";
dotenv.config();

const MARKET_ABI = [
  "function marketCount() view returns (uint256)",
  "function getMarket(uint256) view returns (tuple(uint256 id, string question, string category, uint256 deadline, address creator, uint8 status, bool outcome, string aiEvidence, uint256 yesPool, uint256 noPool, uint256 createdAt, uint256 minStake))",
  "function aiResolve(uint256, bool, string, uint256) external"
];

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const provider = new ethers.JsonRpcProvider(process.env.SHARDEUM_RPC);
const wallet = new ethers.Wallet(process.env.RESOLVER_PRIVATE_KEY, provider);
const market = new ethers.Contract(process.env.MARKET_ADDRESS, MARKET_ABI, wallet);

async function resolveMarket(id, question, category) {
  console.log(`\n[${new Date().toISOString()}] Resolving market ${id}: "${question}"`);

  const response = await client.chat.completions.create({
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    messages: [
      {
        role: "system",
        content: `You are an impartial prediction market resolver. Your job is to determine the factual outcome of a prediction market question. You must respond with ONLY a valid JSON object — no markdown, no preamble, no explanation outside the JSON. Format: {"outcome": true, "confidence": 85, "evidence": "One sentence stating what happened. One sentence citing your source."}. true = YES outcome occurred. false = NO / did not occur. confidence = 0-100 integer.`
      },
      {
        role: "user",
        content: `Resolve this prediction market question. Category: ${category}. Question: "${question}". Determine the outcome based on current facts and determina YES (true) or NO (false).`
      }
    ],
    max_tokens: 1024,
  });

  const text = response.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();
  const result = JSON.parse(clean);

  console.log(`  Outcome: ${result.outcome ? "YES" : "NO"} | Confidence: ${result.confidence}%`);
  console.log(`  Evidence: ${result.evidence}`);

  const evidenceOnChain = `[AI ${result.confidence}% confident] ${result.evidence}`;
  const tx = await market.aiResolve(id, result.outcome, evidenceOnChain, result.confidence);
  await tx.wait();
  console.log(`  Resolved on-chain: ${tx.hash}`);
  console.log(`  Explorer: https://explorer-sphinx.shardeum.org/tx/${tx.hash}`);
}

async function checkAndResolve() {
  try {
    const count = await market.marketCount();
    const now = Math.floor(Date.now() / 1000);

    for (let i = 1; i <= Number(count); i++) {
      const m = await market.getMarket(i);
      // status 0 = Open
      if (Number(m.status) === 0 && Number(m.deadline) <= now) {
        await resolveMarket(i, m.question, m.category);
      }
    }
  } catch (err) {
    console.error("Resolver error:", err.message);
  }
}

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
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an AI Jury Member (${role}) resolving a prediction market. Determine which of the two options occurred based on news evidence. Respond ONLY with a JSON object: {"outcome": true/false, "confidence": 0-100, "reasoning": "1 sentence explaination"}. true = ${marketInfo.optionA}, false = ${marketInfo.optionB}.`
        },
        {
          role: "user",
          content: `Evidence from Web Search:\n${evidence}\n\nQuestion: "${marketInfo.question}"\nOption A: "${marketInfo.optionA}"\nOption B: "${marketInfo.optionB}"\nCategory: ${marketInfo.category}`
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
function calculateDAMM(market, articles, confidence) {
  const yesPool = BigInt(market.yesPool);
  const noPool  = BigInt(market.noPool);
  const totalPool = yesPool + noPool;
  
  // 1. Market Heat: Based on pool volume and news density
  // Higher volume and more news = Hotter market
  const poolHeat = Number(totalPool / BigInt(1e18)); // Scale to SHM
  const newsDensity = articles.length;
  const marketHeat = Math.min(100, Math.floor((poolHeat * 2) + (newsDensity * 5)));
  
  // 2. Sentiment Score: Derived from Jury confidence and pooling ratio
  const poolRatio = totalPool > 0n ? Number((yesPool * 100n) / totalPool) : 50;
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

  console.log(`  > Deliberating between "${m.optionA}" and "${m.optionB}"...`);
  const votes = await Promise.all(juryMembers.map(mem => getJuryVerdict(mem.model, mem.role, m, evidenceText)));

  const validVotes = votes.filter(v => v !== null);
  if (validVotes.length === 0) return;

  // Tally Votes
  const yesVotes = validVotes.filter(v => v.outcome === true).length;
  const noVotes = validVotes.filter(v => v.outcome === false).length;
  const finalOutcome = yesVotes > noVotes;
  const avgConfidence = Math.floor(validVotes.reduce((acc, v) => acc + v.confidence, 0) / validVotes.length);
  
  // Calculate DAMM Metrics
  const { marketHeat, sentimentScore } = calculateDAMM(m, articles, avgConfidence);
  
  // Calculate final DAMM Odds
  const oddsYes = sentimentScore;
  const oddsNo  = 100 - sentimentScore;

  // Combine reasoning and news for on-chain storage
  const consensusReasoning = validVotes.map(v => v.reasoning).join(" ");
  const topNews = articles.slice(0, 2).map((a, i) => `(${i+1}) ${a.title}`).join(" | ");
  
  // Enhanced On-Chain Evidence with DAMM stats including Odds
  const evidenceOnChain = `[Consensus ${yesVotes}-${noVotes}] ${finalOutcome ? "YES" : "NO"}. Odds: Y:${oddsYes}%/N:${oddsNo}% | Heat: ${marketHeat}% | Sentiment: ${sentimentScore}% | News: ${topNews}`;

  console.log(`  > Verdict: ${finalOutcome ? "YES" : "NO"} | Odds: Y:${oddsYes}%/N:${oddsNo}% | Heat: ${marketHeat}%`);
  console.log(`  > Storing on-chain: ${evidenceOnChain}`);

  const tx = await market.aiResolve(id, finalOutcome, evidenceOnChain, avgConfidence);
  await tx.wait();
  
  console.log(`  ✅ Resolved on-chain: ${tx.hash}`);
  articlesCache.delete(id); 
}

async function handleNewBet(id) {
  try {
    const m = await market.getMarket(id);
    const now = Math.floor(Date.now() / 1000);
    const remainingSec = Number(m.deadline) - now;
    if (remainingSec <= 0) return;

    const remainingMin = Math.floor(remainingSec / 60);
    console.log(`New bet on market ${id}. Scheduling GNews scrapes over ${remainingMin}m.`);

    const CHUNK_SIZE_MIN = 5;
    const totalChunks = Math.max(1, Math.floor(remainingMin / CHUNK_SIZE_MIN));

    for (let i = 0; i < totalChunks; i++) {
      setTimeout(() => newsScraper(id, m.question, i, totalChunks), i * CHUNK_SIZE_MIN * 60 * 1000);
    }
  } catch (err) {
    console.error("Error handling new bet:", err.message);
  }
}

// Listen for new markets being created
console.log("Listening for MarketCreated events...");
market.on("MarketCreated", (id, question, category, deadline, creator, minStake) => {
  console.log(`\n[EVENT] MarketCreated: Market ${id} | Question: "${question}" | Category: ${category}`);
  handleNewBet(id);
});

// Listen for new bets on-chain
console.log("Listening for StakePlaced events...");
market.on("StakePlaced", (id, user, side, amount) => {
  console.log(`\n[EVENT] StakePlaced: Market ${id} | User: ${user} | SHM: ${ethers.formatEther(amount)}`);
  // Note: handleNewBet will re-calculate the remaining time and ensure scrapes are still scheduled.
  handleNewBet(id);
});

// Check every 2 minutes
cron.schedule("*/2 * * * *", checkAndResolve);
console.log("OracleX Decentralized Jury running — checking every 2m...");
checkAndResolve();
