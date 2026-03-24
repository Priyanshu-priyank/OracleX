# OracleX — Decentralized Prediction Market on Shardeum

> Polymarket/Kalshi-style prediction markets with an **AI oracle** (Claude) that
> stores its verdict permanently on-chain. No token-weighted voting. No manipulation.

---

## Stack

| Layer       | Tech                                      |
|-------------|-------------------------------------------|
| Frontend    | React (Vite) + Tailwind CSS + react-router-dom |
| Wallet      | ethers.js v6 + MetaMask                   |
| Contracts   | Solidity 0.8.19 + Hardhat                 |
| Blockchain  | Shardeum Sphinx Testnet (chainId: 8082)   |

---

## Project Structure

```
oraclex/
├── contracts/
│   └── PredictionMarket.sol   ← smart contract
├── scripts/
│   └── deploy.js
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── MarketCard.jsx
│   │   ├── StakeModal.jsx     ← bet YES/NO with ₹1000 minimum
│   │   └── VerdictPanel.jsx   ← AI oracle verdict display
│   ├── hooks/
│   │   ├── useWallet.js       ← MetaMask + Shardeum chain switch
│   │   └── useMarkets.js      ← reads markets from contract (mock fallback)
│   ├── pages/
│   │   ├── Home.jsx           ← dashboard with filters
│   │   ├── CreateMarket.jsx   ← create market form
│   │   └── MarketDetail.jsx   ← bet + dispute + verdict
│   └── utils/
│       ├── contracts.js       ← ABI + address
│       └── format.js          ← helpers
├── hardhat.config.js
├── .env.example
└── README.md
```

---

## Quick Start

### 1. Install frontend dependencies

```bash
cd oraclex
npm install
npm run dev
# → http://localhost:5173
```

The app runs with **mock data** until you deploy the contract.

---

### 2. Deploy the smart contract to Shardeum Sphinx Testnet

#### Get testnet SHM
- Faucet: https://docs.shardeum.org/faucet/claim

#### Setup
```bash
# In the project root (separate package.json for hardhat)
cp contracts-package.json package.json   # or add hardhat deps manually
npm install

cp .env.example .env
# Edit .env → add PRIVATE_KEY and RESOLVER_ADDRESS
```

#### Compile & Deploy
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network shardeum
```

You'll see:
```
✅ PredictionMarket deployed to: 0xABC...
Paste this into src/utils/contracts.js:
export const MARKET_CONTRACT_ADDRESS = "0xABC...";
```

#### Wire it up
Open `src/utils/contracts.js` and replace the address:
```js
export const MARKET_CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_ADDRESS";
```

---

### 3. MetaMask setup for Shardeum

Add Shardeum Sphinx Testnet manually in MetaMask:
- **Network name:** Shardeum Sphinx 1.X
- **RPC URL:** https://sphinx.shardeum.org/
- **Chain ID:** 8082
- **Symbol:** SHM
- **Explorer:** https://explorer-sphinx.shardeum.org/

Or just click **"Switch to Shardeum"** in the app — it adds the network automatically.

---

## Key Features

### Dashboard (`/`)
- Live market cards with YES/NO probability bars
- Filter by category (Crypto, Sports, Politics, Tech…)
- Filter by status (Open / Resolved / Disputed)
- Search + sort

### Create Market (`/create`)
- **Question** — any YES/NO prediction (10–280 chars)
- **Category** — Crypto, Sports, Politics, Tech, Economics, Science, Other
- **Duration** — 1 Day / 3 Days / 1 Week / 1 Month / Custom hours
- **Minimum Bet** — creator sets it (platform floor: **₹1,000**)
- Preview card before deploying
- Submits `createMarket()` tx on Shardeum

### Market Detail (`/market/:id`)
- Real-time YES/NO probability
- Pool sizes + min bet
- **Bet modal** — validates ₹1000 minimum, quick-pick amounts
- Estimated payout calculator (−2% fee)
- **AI Oracle verdict panel** — shows Claude's 2-sentence reasoning stored on-chain
- **Dispute button** — raises `raiseDispute()` tx if outcome seems wrong

### Wallet
- MetaMask connect
- Auto-detects wrong network → "Switch to Shardeum" one-click
- Handles account changes

---

## Minimum Bet Logic

- Platform floor: **₹1,000** (hardcoded in both UI and contract)
- Market creator can set a **higher** minimum when creating (e.g. ₹5,000)
- Contract enforces: `msg.value >= market.minStake`
- UI enforces: validates before enabling submit button

---

## Smart Contract: Key Functions

| Function | Who calls it | What it does |
|----------|-------------|--------------|
| `createMarket(question, category, durationHours, minStake)` | Anyone | Creates a new market |
| `stake(id, side)` payable | Anyone | Locks SHM on YES or NO |
| `aiResolve(id, outcome, evidence, confidence)` | AI Resolver only | Settles market + stores reasoning |
| `claimReward(id)` | Winners | Withdraws proportional payout |
| `raiseDispute(id)` | Anyone | Flags resolved market for review |
| `getAllMarkets()` | Frontend | Returns all market data |

---

## For Judges

> "Most prediction markets use either a centralized team or token-weighted voting to resolve outcomes.
> In March 2025, a single actor with 25% of UMA tokens manipulated a $7M Polymarket contract.
>
> OracleX replaces the oracle with an AI agent. When the deadline passes, Claude searches the web,
> determines the outcome, and stores its 2-sentence reasoning **permanently** in this transaction.
> Anyone can open the block explorer and read WHY a market was resolved.
>
> That's OracleX: AI-verified truth, on-chain forever, accessible to everyone."