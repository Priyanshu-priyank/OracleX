// src/utils/contracts.js
// ── Deploy your contract to Shardeum Sphinx Testnet then paste the address below ──

//contract ABI + addresses util
export const SHARDEUM_CHAIN_ID = 8082;
export const SHARDEUM_RPC = "https://sphinx.shardeum.org/";
export const SHARDEUM_EXPLORER = "https://explorer-sphinx.shardeum.org/";

// TODO: replace with your deployed address after `npx hardhat run scripts/deploy.js --network shardeum`
export const MARKET_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export const MARKET_ABI = [
    // createMarket(question, category, durationHours, minStakeWei)
    "function createMarket(string question, string category, uint256 durationHours, uint256 minStake) external returns (uint256)",
    // stake(marketId, side) payable
    "function stake(uint256 id, bool side) external payable",
    // claimReward(marketId)
    "function claimReward(uint256 id) external",
    // raiseDispute(marketId)
    "function raiseDispute(uint256 id) external",
    // views
    "function getMarket(uint256 id) external view returns (tuple(uint256 id, string question, string category, uint256 deadline, address creator, uint8 status, bool outcome, string aiEvidence, uint256 yesPool, uint256 noPool, uint256 createdAt, uint256 minStake))",
    "function getAllMarkets() external view returns (tuple(uint256 id, string question, string category, uint256 deadline, address creator, uint8 status, bool outcome, string aiEvidence, uint256 yesPool, uint256 noPool, uint256 createdAt, uint256 minStake)[])",
    "function getUserStakes(uint256 id, address user) external view returns (uint256 yes, uint256 no)",
    "function marketCount() external view returns (uint256)",
    // events
    "event MarketCreated(uint256 indexed id, string question, string category, uint256 deadline, address creator)",
    "event StakePlaced(uint256 indexed id, address indexed user, bool side, uint256 amount)",
    "event MarketResolved(uint256 indexed id, bool outcome, string evidence, uint256 confidence)",
    "event DisputeRaised(uint256 indexed id, address indexed challenger)",
    "event RewardClaimed(uint256 indexed id, address indexed user, uint256 amount)",
];