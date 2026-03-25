import { ethers } from "ethers";

const STORAGE_KEY = "oraclex_mock_blockchain";

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
    this.signer = { address: "0x742d...444" }; // Mock User
  }

  _load() {
    const data = localStorage.getItem(STORAGE_KEY);
    this.data = data ? JSON.parse(data) : { markets: initialMarkets, userShares: {} };
    if (!data) this._save();
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
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
    this.data.markets.push(m);
    this._save();
    return { id: BigInt(id), wait: async () => ({}) };
  }

  async buyShares(id, optionIndex, { value }) {
    const m = this.data.markets.find(x => x.id === id.toString());
    const amt = BigInt(value);
    
    // Simple mock math for reserves
    m.totalSets = (BigInt(m.totalSets) + amt).toString();
    m.shareReserves[optionIndex] = (BigInt(m.shareReserves[optionIndex]) / 2n).toString(); // Simulate price impact
    
    // Update user balance
    const key = `shares_${id}_${optionIndex}_${this.signer.address}`;
    this.data.userShares[key] = (BigInt(this.data.userShares[key] || "0") + amt * 2n).toString(); // Mock shares given
    
    this._save();
    return { hash: "mock_tx_" + Date.now(), wait: async () => ({}) };
  }

  async sellShares(id, optionIndex, amount) {
    const m = this.data.markets.find(x => x.id === id.toString());
    const amt = BigInt(amount);
    
    const key = `shares_${id}_${optionIndex}_${this.signer.address}`;
    this.data.userShares[key] = (BigInt(this.data.userShares[key] || "0") - amt).toString();
    
    m.totalSets = (BigInt(m.totalSets) - amt / 2n).toString();
    m.shareReserves[optionIndex] = (BigInt(m.shareReserves[optionIndex]) * 2n).toString();
    
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
    return { hash: "mock_tx_claim_" + Date.now(), wait: async () => ({}) };
  }
}

export const mockContract = new MockContract();
