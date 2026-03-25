// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PredictionMarket {
    enum Status { Open, Resolved, Disputed }

    struct Market {
        uint256 id;
        string  question;
        string  category;
        string  optionA;         // Default: "YES"
        string  optionB;         // Default: "NO"
        uint256 deadline;
        address creator;
        Status  status;
        bool    outcome;         // true = Option A, false = Option B
        string  aiEvidence; 
        uint256 yesPool;
        uint256 noPool;
        uint256 createdAt;
        uint256 minStake;
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesStakes;
    mapping(uint256 => mapping(address => uint256)) public noStakes;

    address public aiResolver;
    uint256 public constant PROTOCOL_FEE = 2; // 2%

    event MarketCreated(uint256 indexed id, string question, string category, string optionA, string optionB, uint256 deadline, address creator, uint256 minStake);
    event StakePlaced(uint256 indexed id, address indexed user, bool side, uint256 amount);
    event MarketResolved(uint256 indexed id, bool outcome, string evidence, uint256 confidence);
    event DisputeRaised(uint256 indexed id, address indexed challenger);
    event RewardClaimed(uint256 indexed id, address indexed user, uint256 amount);

    modifier onlyResolver() {
        require(msg.sender == aiResolver, "Only AI resolver");
        _;
    }

    constructor(address _resolver) {
        aiResolver = _resolver;
    }

    function createMarket(
        string calldata _question,
        string calldata _category,
        string calldata _optionA,
        string calldata _optionB,
        uint256 _durationHours,
        uint256 _minStake
    ) external returns (uint256) {
        require(bytes(_question).length > 0, "Empty question");
        require(bytes(_optionA).length > 0 && bytes(_optionB).length > 0, "Empty options");
        require(_durationHours >= 1 && _durationHours <= 8760, "Invalid duration");
        require(_minStake >= 1000 * 10**18, "Min bet must be >= 1000 SHM");

        uint256 id = ++marketCount;
        markets[id] = Market({
            id:         id,
            question:   _question,
            category:   _category,
            optionA:    _optionA,
            optionB:    _optionB,
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

        emit MarketCreated(id, _question, _category, _optionA, _optionB, markets[id].deadline, msg.sender, _minStake);
        return id;
    }

    function stake(uint256 _id, bool _side) external payable {
        Market storage m = markets[_id];
        require(m.id != 0, "Market not found");
        require(m.status == Status.Open, "Market not open");
        require(block.timestamp < m.deadline, "Market expired");
        require(msg.value >= m.minStake, "Below minimum stake");

        if (_side) {
            m.yesPool += msg.value;
            yesStakes[_id][msg.sender] += msg.value;
        } else {
            m.noPool += msg.value;
            noStakes[_id][msg.sender] += msg.value;
        }

        emit StakePlaced(_id, msg.sender, _side, msg.value);
    }

    function aiResolve(
        uint256 _id,
        bool    _outcome,
        string calldata _evidence,
        uint256 _confidence
    ) external onlyResolver {
        Market storage m = markets[_id];
        require(m.id != 0, "Market not found");
        require(m.status == Status.Open, "Already resolved");
        require(block.timestamp >= m.deadline, "Deadline not reached");

        m.status     = Status.Resolved;
        m.outcome    = _outcome;
        m.aiEvidence = _evidence;

        emit MarketResolved(_id, _outcome, _evidence, _confidence);
    }

    function claimReward(uint256 _id) external {
        Market storage m = markets[_id];
        require(m.status == Status.Resolved, "Not resolved");

        uint256 userStake;
        uint256 winPool;
        uint256 losePool;

        if (m.outcome) {
            userStake = yesStakes[_id][msg.sender];
            winPool   = m.yesPool;
            losePool  = m.noPool;
            yesStakes[_id][msg.sender] = 0;
        } else {
            userStake = noStakes[_id][msg.sender];
            winPool   = m.noPool;
            losePool  = m.yesPool;
            noStakes[_id][msg.sender] = 0;
        }

        require(userStake > 0, "No winning stake");

        // If winPool is 0 (should not happen if userStake > 0), prevent division by zero
        uint256 totalPool   = winPool + losePool;
        uint256 grossPayout = (userStake * totalPool) / winPool;
        uint256 fee         = (grossPayout * PROTOCOL_FEE) / 100;
        uint256 netPayout   = grossPayout - fee;

        payable(msg.sender).transfer(netPayout);
        emit RewardClaimed(_id, msg.sender, netPayout);
    }

    function raiseDispute(uint256 _id) external {
        Market storage m = markets[_id];
        require(m.status == Status.Resolved, "Not resolved yet");
        m.status = Status.Disputed;
        emit DisputeRaised(_id, msg.sender);
    }

    function getMarket(uint256 _id) external view returns (Market memory) {
        return markets[_id];
    }

    function getUserStakes(uint256 _id, address _user) external view returns (uint256 yes, uint256 no) {
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
