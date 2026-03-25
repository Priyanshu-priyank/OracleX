// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title  OracleX PredictionMarket
/// @notice Decentralized prediction market on Shardeum.
///         Markets are created by users, stakes are locked on-chain,
///         and resolved by an AI oracle (OracleX) that stores its
///         2-sentence reasoning permanently in this contract's state.
contract PredictionMarket {

    // ─────────────────────────────────────────────
    //  Enums & Structs
    // ─────────────────────────────────────────────

    enum Status { Open, Resolved, Disputed }

    struct Market {
        uint256 id;
        string  question;
        string  category;
        uint256 deadline;       // unix timestamp
        address creator;
        Status  status;
        bool    outcome;        // true = YES won
        string  aiEvidence;    // OracleX's reasoning — stored forever on-chain
        uint256 yesPool;       // total SHM staked on YES
        uint256 noPool;        // total SHM staked on NO
        uint256 createdAt;
        uint256 minStake;      // per-market minimum stake (set by creator, >= PLATFORM_MIN)
    }

    // ─────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────

    uint256 public marketCount;
    mapping(uint256 => Market)  public markets;
    mapping(uint256 => mapping(address => uint256)) public yesStakes;
    mapping(uint256 => mapping(address => uint256)) public noStakes;

    address public owner;
    address public aiResolver;          // wallet controlled by the Node.js AI agent

    /// @dev Platform-wide floor: 0.1 SHM ≈ ₹1 (adjust for mainnet)
    ///      For hackathon demo on testnet SHM has no real value so we keep it low.
    uint256 public constant PLATFORM_MIN = 0.001 ether;

    uint256 public constant PROTOCOL_FEE_BPS = 200; // 2%

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    event MarketCreated(
        uint256 indexed id,
        string  question,
        string  category,
        uint256 deadline,
        address indexed creator,
        uint256 minStake
    );
    event StakePlaced(uint256 indexed id, address indexed user, bool side, uint256 amount);
    event MarketResolved(uint256 indexed id, bool outcome, string evidence, uint256 confidence);
    event DisputeRaised(uint256 indexed id, address indexed challenger);
    event RewardClaimed(uint256 indexed id, address indexed user, uint256 amount);
    event ResolverUpdated(address newResolver);

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    modifier onlyOwner()    { require(msg.sender == owner,      "Not owner");    _; }
    modifier onlyResolver() { require(msg.sender == aiResolver, "Not resolver"); _; }

    // ─────────────────────────────────────────────
    //  Constructor
    // ─────────────────────────────────────────────

    constructor(address _resolver) {
        owner       = msg.sender;
        aiResolver  = _resolver;
    }

    // ─────────────────────────────────────────────
    //  Market Creation
    // ─────────────────────────────────────────────

    /// @param _question      The YES/NO prediction question
    /// @param _category      Category string (Crypto, Sports, etc.)
    /// @param _durationHours How long until the market expires (1–8760)
    /// @param _minStake      Minimum stake per bet in wei (must be >= PLATFORM_MIN)
    function createMarket(
        string  calldata _question,
        string  calldata _category,
        uint256          _durationHours,
        uint256          _minStake
    ) external returns (uint256) {
        require(bytes(_question).length >= 10,           "Question too short");
        require(bytes(_question).length <= 280,          "Question too long");
        require(_durationHours >= 1 && _durationHours <= 8760, "Invalid duration");
        require(_minStake >= PLATFORM_MIN,               "Below platform minimum");

        uint256 id = ++marketCount;

        markets[id] = Market({
            id:         id,
            question:   _question,
            category:   _category,
            deadline:   block.timestamp + (_durationHours * 1 hours),
            creator:    msg.sender,
            status:     Status.Open,
            outcome:    false,
            aiEvidence: "",
            yesPool:    0,
            noPool:     0,
            createdAt:  block.timestamp,
            minStake:   _minStake
        });

        emit MarketCreated(id, _question, _category, markets[id].deadline, msg.sender, _minStake);
        return id;
    }

    // ─────────────────────────────────────────────
    //  Staking
    // ─────────────────────────────────────────────

    /// @param _id   Market ID
    /// @param _side true = YES, false = NO
    function stake(uint256 _id, bool _side) external payable {
        Market storage m = markets[_id];
        require(m.id != 0,                      "Market not found");
        require(m.status == Status.Open,         "Market not open");
        require(block.timestamp < m.deadline,    "Market expired");
        require(msg.value >= m.minStake,         "Below market minimum stake");

        if (_side) {
            m.yesPool              += msg.value;
            yesStakes[_id][msg.sender] += msg.value;
        } else {
            m.noPool               += msg.value;
            noStakes[_id][msg.sender]  += msg.value;
        }

        emit StakePlaced(_id, msg.sender, _side, msg.value);
    }

    // ─────────────────────────────────────────────
    //  AI Oracle Resolution
    // ─────────────────────────────────────────────

    /// @dev Called by the Node.js AI agent after OracleX determines the outcome.
    ///      _evidence is stored permanently in Shardeum state — judges can read it.
    function aiResolve(
        uint256          _id,
        bool             _outcome,
        string calldata  _evidence,
        uint256          _confidence   // 0–100, logged in event
    ) external onlyResolver {
        Market storage m = markets[_id];
        require(m.id != 0,                      "Market not found");
        require(m.status == Status.Open,         "Already settled");
        require(block.timestamp >= m.deadline,   "Deadline not reached");

        m.status     = Status.Resolved;
        m.outcome    = _outcome;
        m.aiEvidence = _evidence;

        emit MarketResolved(_id, _outcome, _evidence, _confidence);
    }

    // ─────────────────────────────────────────────
    //  Claim Reward
    // ─────────────────────────────────────────────

    function claimReward(uint256 _id) external {
        Market storage m = markets[_id];
        require(m.status == Status.Resolved, "Not resolved");

        uint256 userStake;
        uint256 winPool;
        uint256 losePool;

        if (m.outcome) {
            userStake               = yesStakes[_id][msg.sender];
            winPool                 = m.yesPool;
            losePool                = m.noPool;
            yesStakes[_id][msg.sender] = 0;
        } else {
            userStake               = noStakes[_id][msg.sender];
            winPool                 = m.noPool;
            losePool                = m.yesPool;
            noStakes[_id][msg.sender]  = 0;
        }

        require(userStake > 0, "No winning stake");

        uint256 totalPool   = winPool + losePool;
        uint256 grossPayout = (userStake * totalPool) / winPool;
        uint256 fee         = (grossPayout * PROTOCOL_FEE_BPS) / 10000;
        uint256 netPayout   = grossPayout - fee;

        // Fee stays in contract (owner withdrawable)
        payable(msg.sender).transfer(netPayout);
        emit RewardClaimed(_id, msg.sender, netPayout);
    }

    // ─────────────────────────────────────────────
    //  Dispute
    // ─────────────────────────────────────────────

    function raiseDispute(uint256 _id) external {
        Market storage m = markets[_id];
        require(m.status == Status.Resolved, "Not resolved yet");
        m.status = Status.Disputed;
        emit DisputeRaised(_id, msg.sender);
    }

    // ─────────────────────────────────────────────
    //  Admin
    // ─────────────────────────────────────────────

    function setResolver(address _resolver) external onlyOwner {
        aiResolver = _resolver;
        emit ResolverUpdated(_resolver);
    }

    function withdrawFees() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // ─────────────────────────────────────────────
    //  Views
    // ─────────────────────────────────────────────

    function getMarket(uint256 _id) external view returns (Market memory) {
        return markets[_id];
    }

    function getUserStakes(uint256 _id, address _user)
        external view returns (uint256 yes, uint256 no)
    {
        return (yesStakes[_id][_user], noStakes[_id][_user]);
    }

    function getAllMarkets() external view returns (Market[] memory) {
        Market[] memory all = new Market[](marketCount);
        for (uint256 i = 1; i <= marketCount; i++) {
            all[i - 1] = markets[i];
        }
        return all;
    }
}
