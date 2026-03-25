import { ethers } from "ethers";

const STORAGE_KEY = "oraclex_mock_blockchain";
const DEFAULT_USER = "0x742d...444";
const INITIAL_MOCK_BALANCE = ethers.parseEther("25000"); // 25k fake SHM

const initialMarkets = [
  {
    id: "1",
    question: "Will Bitcoin reach $100,000 before May 2026?",
    category: "Crypto",
    options: ["YES", "NO"],
    deadline: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
    creator: "0x123...abc",
    status: 0,
    outcomeIndex: 0,
    aiEvidence: "[] Waiting for deadline...",
    totalSets: ethers.parseEther("50000").toString(),
    shareReserves: [ethers.parseEther("40000").toString(), ethers.parseEther("60000").toString()],
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    minStake: ethers.parseEther("1000").toString()
  },
  {
    id: "2",
    question: "Who will win the 2026 Academy Award for Best Picture?",
    category: "Daily Life",
    options: ["Christopher Nolan Film", "Denis Villeneuve Film", "Greta Gerwig Film", "Other"],
    deadline: Math.floor(Date.now() / 1000) + 86400 * 60,
    creator: "0xMock...Creator",
    status: 0,
    outcomeIndex: 0,
    aiEvidence: "[] Analysis pending...",
    totalSets: ethers.parseEther("120000").toString(),
    shareReserves: [
      ethers.parseEther("25000").toString(), 
      ethers.parseEther("35000").toString(), 
      ethers.parseEther("20000").toString(), 
      ethers.parseEther("40000").toString()
    ],
    createdAt: Math.floor(Date.now() / 1000) - 172800,
    minStake: ethers.parseEther("1000").toString()
  }
];

class MockContract {
  constructor() {
    this._load();
    this.signer = { address: DEFAULT_USER };
  }

  _load() {
    const data = localStorage.getItem(STORAGE_KEY);
    this.data = data ? JSON.parse(data) : { markets: initialMarkets, userShares: {}, wallets: {}, claims: {} };
    if (!this.data.wallets) this.data.wallets = {};
    if (!this.data.claims) this.data.claims = {};
    if (!this.data.wallets[this.signer?.address || DEFAULT_USER]) {
      this.data.wallets[this.signer?.address || DEFAULT_USER] = INITIAL_MOCK_BALANCE.toString();
    }
    if (!data) this._save();
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  _wallet(address = this.signer.address) {
    if (!this.data.wallets[address]) {
      this.data.wallets[address] = INITIAL_MOCK_BALANCE.toString();
    }
    return BigInt(this.data.wallets[address]);
  }

  _setWallet(amount, address = this.signer.address) {
    this.data.wallets[address] = BigInt(amount).toString();
  }

  _priceWei(market, optionIndex) {
    const PRECISION = 10n ** 18n;
    const reserves = market.shareReserves.map((r) => BigInt(r));
    const inverses = reserves.map((r) => (r > 0n ? (PRECISION * PRECISION) / r : 0n));
    const sum = inverses.reduce((a, b) => a + b, 0n);
    if (sum === 0n) return PRECISION / BigInt(Math.max(1, reserves.length));
    return (inverses[optionIndex] * PRECISION) / sum;
  }

  async marketCount() {
    return BigInt(this.data.markets.length);
  }

  async getAllMarkets() {
    return this.data.markets.map(m => ({
      ...m,
      id: BigInt(m.id),
      deadline: BigInt(m.deadline),
      totalSets: BigInt(m.totalSets),
      shareReserves: m.shareReserves.map(r => BigInt(r)),
      createdAt: BigInt(m.createdAt),
      minStake: BigInt(m.minStake)
    }));
  }

  async getMarket(id) {
    const m = this.data.markets.find(x => x.id === id.toString());
    if (!m) throw new Error("Market not found");
    return {
      ...m,
      id: BigInt(m.id),
      deadline: BigInt(m.deadline),
      totalSets: BigInt(m.totalSets),
      shareReserves: m.shareReserves.map(r => BigInt(r)),
      createdAt: BigInt(m.createdAt),
      minStake: BigInt(m.minStake)
    };
  }

  async createMarket(question, category, options, duration, minStake) {
    const wallet = this._wallet();
    if (wallet < BigInt(minStake)) throw new Error("Insufficient mock wallet balance to create market");

    const id = (this.data.markets.length + 1).toString();
    const m = {
      id,
      question,
      category,
      options,
      deadline: Math.floor(Date.now() / 1000) + (Number(duration) * 3600),
      creator: this.signer.address,
      status: 0,
      outcomeIndex: 0,
      aiEvidence: "",
      totalSets: minStake.toString(),
      shareReserves: options.map(() => minStake.toString()),
      createdAt: Math.floor(Date.now() / 1000),
      minStake: minStake.toString()
    };
    this._setWallet(wallet - BigInt(minStake));
    this.data.markets.push(m);
    this._save();
    return { id: BigInt(id), wait: async () => ({}) };
  }

  async buyShares(id, optionIndex, { value }) {
    const m = this.data.markets.find(x => x.id === id.toString());
    if (!m) throw new Error("Market not found");
    const amt = BigInt(value);
    const wallet = this._wallet();
    if (wallet < amt) throw new Error("Insufficient mock wallet balance");

    const price = this._priceWei(m, optionIndex);
    const sharesOut = (amt * (10n ** 18n)) / price;

    // Simple mock math for reserves
    m.totalSets = (BigInt(m.totalSets) + amt).toString();
    const reserve = BigInt(m.shareReserves[optionIndex]);
    m.shareReserves[optionIndex] = (reserve > amt / 2n ? reserve - amt / 2n : 1n).toString();

    // Update user balance
    const key = `shares_${id}_${optionIndex}_${this.signer.address}`;
    this.data.userShares[key] = (BigInt(this.data.userShares[key] || "0") + sharesOut).toString();
    this._setWallet(wallet - amt);

    this._save();
    return { hash: "mock_tx_" + Date.now(), wait: async () => ({}) };
  }

  async sellShares(id, optionIndex, amount) {
    const m = this.data.markets.find(x => x.id === id.toString());
    if (!m) throw new Error("Market not found");
    const amt = BigInt(amount);

    const key = `shares_${id}_${optionIndex}_${this.signer.address}`;
    const currentShares = BigInt(this.data.userShares[key] || "0");
    if (currentShares < amt) throw new Error("Not enough shares to sell");

    const price = this._priceWei(m, optionIndex);
    const shmOut = (amt * price) / (10n ** 18n);
    this.data.userShares[key] = (currentShares - amt).toString();

    const totalSets = BigInt(m.totalSets);
    m.totalSets = (totalSets > shmOut ? totalSets - shmOut : 0n).toString();
    m.shareReserves[optionIndex] = (BigInt(m.shareReserves[optionIndex]) + shmOut / 2n).toString();
    this._setWallet(this._wallet() + shmOut);

    this._save();
    return { hash: "mock_tx_sell_" + Date.now(), wait: async () => ({}) };
  }

  async getUserShares(id, user) {
    const m = this.data.markets.find(x => x.id === id.toString());
    return m.options.map((_, i) => {
      const key = `shares_${id}_${i}_${user}`;
      return BigInt(this.data.userShares[key] || "0");
    });
  }

  async claimReward(id) {
    const m = this.data.markets.find((x) => x.id === id.toString());
    if (!m) throw new Error("Market not found");
    if (Number(m.status) !== 1) throw new Error("Market not resolved yet");
    const claimKey = `claimed_${id}_${this.signer.address}`;
    if (this.data.claims[claimKey]) throw new Error("Reward already claimed");

    const winner = Number(m.outcomeIndex);
    const winKey = `shares_${id}_${winner}_${this.signer.address}`;
    const winningShares = BigInt(this.data.userShares[winKey] || "0");
    if (winningShares <= 0n) throw new Error("No winning shares");

    this._setWallet(this._wallet() + winningShares);
    this.data.claims[claimKey] = true;
    const marketId = id.toString();
    m.options.forEach((_, idx) => {
      const key = `shares_${marketId}_${idx}_${this.signer.address}`;
      this.data.userShares[key] = "0";
    });
    this._save();
    return { hash: "mock_tx_claim_" + Date.now(), wait: async () => ({}) };
  }

  async getWalletBalance(user) {
    return this._wallet(user || this.signer.address);
  }
}

export const mockContract = new MockContract();
