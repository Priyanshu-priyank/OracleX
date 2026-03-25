// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OracleX Prediction Market (CPMM Version)
 * @notice A Constant Product Market Maker (CPMM) based prediction market.
 * Transitioned from Parimutuel to CPMM to allow buying/selling shares before resolution.
 */
contract PredictionMarket {
    enum Status { Open, Resolved, Disputed }

    struct Market {
        uint256 id;
        string  question;
        string  category;
        string[] options;
        uint256 deadline;
        address creator;
        Status  status;
        uint256 outcomeIndex;
        string  aiEvidence; 
        uint256 totalSets;       // Total collateral (SHM) deposited
        uint256[] shareReserves; // Shares held by the AMM house
        uint256 createdAt;
        uint256 minStake;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    // marketId => optionIndex => user => shareBalance
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public shares;

    address public aiResolver;
    uint256 public constant PROTOCOL_FEE = 2; // 2%
    uint256 public constant PRECISION = 1e18;

    event MarketCreated(uint256 indexed id, string question, string category, string[] options, uint256 deadline, address creator);
    event SharesBought(uint256 indexed id, address indexed user, uint256 optionIndex, uint256 amountPaid, uint256 sharesReceived);
    event SharesSold(uint256 indexed id, address indexed user, uint256 optionIndex, uint256 sharesSold, uint256 amountReceived);
    event MarketResolved(uint256 indexed id, uint256 outcomeIndex, string evidence);
    event RewardClaimed(uint256 indexed id, address indexed user, uint256 amount);

    modifier onlyResolver() {
        require(msg.sender == aiResolver, "Only AI resolver");
        _;
    }

    constructor(address _resolver) {
        aiResolver = _resolver;
    }

    /**
     * @notice Create a new market with initial liquidity.
     * @param _minStake In this version, minStake is the initial liquidity required to seed the AMM.
     */
    function createMarket(
        string calldata _question,
        string calldata _category,
        string[] calldata _options,
        uint256 _durationHours,
        uint256 _minStake
    ) external payable returns (uint256) {
        require(msg.value >= _minStake, "Must provide initial liquidity");
        require(_options.length >= 2, "At least 2 options");
        
        uint256 id = ++marketCount;
        Market storage m = markets[id];
        m.id = id;
        m.question = _question;
        m.category = _category;
        m.options = _options;
        m.deadline = block.timestamp + (_durationHours * 1 hours);
        m.creator = msg.sender;
        m.status = Status.Open;
        m.createdAt = block.timestamp;
        m.minStake = _minStake;
        
        // Seed initial liquidity: 1 SHM = 1 Share of every outcome
        m.totalSets = msg.value;
        for (uint256 i = 0; i < _options.length; i++) {
            // Initial reserves = collateral. This makes initial price 1/N.
            m.shareReserves.push(msg.value);
        }

        emit MarketCreated(id, _question, _category, _options, m.deadline, msg.sender);
        return id;
    }

    /**
     * @notice Buy shares of a specific outcome using SHM.
     * Uses the Constant Product Formula: Product(Reserves) = K
     */
    function buyShares(uint256 _id, uint256 _optionIndex) external payable {
        Market storage m = markets[_id];
        require(m.status == Status.Open, "Not open");
        require(block.timestamp < m.deadline, "Expired");
        require(msg.value > 0, "Zero payment");
        require(_optionIndex < m.options.length, "Invalid index");

        uint256 amountPaid = msg.value;
        
        // 1. Calculate output shares using CPMM
        // NewReserve_i = OldReserve_i * Product(OldReserves_j / (OldReserves_j + amountPaid)) for j != i
        uint256 oldReserveI = m.shareReserves[_optionIndex];
        uint256 newReserveI = oldReserveI;
        
        for (uint256 j = 0; j < m.options.length; j++) {
            if (j == _optionIndex) continue;
            // newReserveI = newReserveI * oldReserveJ / (oldReserveJ + amountPaid)
            newReserveI = (newReserveI * m.shareReserves[j]) / (m.shareReserves[j] + amountPaid);
        }
        
        uint256 sharesFromSwap = oldReserveI - newReserveI;
        uint256 totalSharesOut = sharesFromSwap + amountPaid; // + amountPaid because we mint 1:1 sets

        // 2. Update state
        m.totalSets += amountPaid;
        for (uint256 j = 0; j < m.options.length; j++) {
            if (j == _optionIndex) {
                m.shareReserves[j] = newReserveI;
            } else {
                m.shareReserves[j] += amountPaid;
            }
        }
        
        shares[_id][_optionIndex][msg.sender] += totalSharesOut;
        
        emit SharesBought(_id, msg.sender, _optionIndex, amountPaid, totalSharesOut);
    }

    /**
     * @notice Sell outcome shares back to the AMM before resolution.
     */
    function sellShares(uint256 _id, uint256 _optionIndex, uint256 _amount) external {
        Market storage m = markets[_id];
        require(m.status == Status.Open, "Not open");
        require(shares[_id][_optionIndex][msg.sender] >= _amount, "Insufficient shares");

        // 1. Calculate SHM output (reverse of buy)
        // We add _amount to m.shareReserves[optionIndex]
        // This allows us to take out some of all other shares to form sets, then burn them.
        // For simplicity in V1, we use a symmetrical price-impact calculation:
        uint256 oldReserveI = m.shareReserves[_optionIndex];
        uint256 newReserveI = oldReserveI + _amount;
        
        uint256 totalSHMOut = 0;
        // In a CPMM sell, you receive sets proportional to the price impact
        // A more robust implementation would use the invariant, but here we'll approximate 
        // the return based on the current price to ensure liquidity.
        
        // Approximate payout = _amount * (Reserves_j / Reserves_i) ... 
        // Correct way: totalSHMOut = _amount * (TotalSets / (Reserves_i + _amount))
        totalSHMOut = (_amount * m.totalSets) / (oldReserveI + _amount);

        // 2. Protocol Fee
        uint256 fee = (totalSHMOut * PROTOCOL_FEE) / 100;
        uint256 netSHM = totalSHMOut - fee;

        require(m.totalSets >= totalSHMOut, "Insufficient liquidity");

        // 3. Update state
        shares[_id][_optionIndex][msg.sender] -= _amount;
        m.totalSets -= totalSHMOut;
        m.shareReserves[_optionIndex] = newReserveI;
        // Decrease other reserves because we "burned" sets
        for (uint256 j = 0; j < m.options.length; j++) {
            if (j == _optionIndex) continue;
            // Reserves are decreased relative to the total collateral reduction
            m.shareReserves[j] = (m.shareReserves[j] * m.totalSets) / (m.totalSets + totalSHMOut);
        }

        payable(msg.sender).transfer(netSHM);
        emit SharesSold(_id, msg.sender, _optionIndex, _amount, netSHM);
    }

    function aiResolve(
        uint256 _id,
        uint256 _outcomeIndex,
        string calldata _evidence,
        uint256 _confidence
    ) external onlyResolver {
        Market storage m = markets[_id];
        require(m.status == Status.Open, "Already resolved");
        require(_outcomeIndex < m.options.length, "Invalid index");

        m.status       = Status.Resolved;
        m.outcomeIndex = _outcomeIndex;
        m.aiEvidence   = _evidence;

        emit MarketResolved(_id, _outcomeIndex, _evidence);
    }

    /**
     * @notice After resolution, 1 share of the winning outcome = 1 SHM.
     */
    function claimReward(uint256 _id) external {
        Market storage m = markets[_id];
        require(m.status == Status.Resolved, "Not resolved");

        uint256 winIndex = m.outcomeIndex;
        uint256 userShares = shares[_id][winIndex][msg.sender];
        require(userShares > 0, "No winning shares");

        shares[_id][winIndex][msg.sender] = 0;
        
        // 1 Share = 1 SHM
        uint256 payout = userShares; 
        
        // Fee on final payout
        uint256 fee = (payout * PROTOCOL_FEE) / 100;
        uint256 net = payout - fee;

        payable(msg.sender).transfer(net);
        emit RewardClaimed(_id, msg.sender, net);
    }

    // --- Helpers ---
    function getMarket(uint256 _id) external view returns (Market memory) {
        return markets[_id];
    }

    function getUserShares(uint256 _id, address _user) external view returns (uint256[] memory) {
        uint256 numOptions = markets[_id].options.length;
        uint256[] memory userBalances = new uint256[](numOptions);
        for (uint256 i = 0; i < numOptions; i++) {
            userBalances[i] = shares[_id][i][_user];
        }
        return userBalances;
    }

    function getAllMarkets() external view returns (Market[] memory) {
        Market[] memory all = new Market[](marketCount);
        for (uint256 i = 1; i <= marketCount; i++) {
            all[i - 1] = markets[i];
        }
        return all;
    }
}
