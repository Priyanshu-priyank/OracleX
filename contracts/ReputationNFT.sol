// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationNFT is ERC721, Ownable {
    uint256 public nextTokenId = 1;

    // tokenId => category => points
    mapping(uint256 => mapping(string => uint256)) public categoryReputation;
    
    // address => tokenId
    mapping(address => uint256) public userToToken;

    // Authorized caller (Prediction Market)
    address public predictionMarket;

    event ReputationAdded(address indexed user, uint256 tokenId, string category, uint256 points);

    constructor() ERC721("OracleX Reputation", "OXR") Ownable(msg.sender) {}

    function setPredictionMarket(address _market) external onlyOwner {
        predictionMarket = _market;
    }

    modifier onlyMarket() {
        require(msg.sender == predictionMarket || msg.sender == owner(), "Not authorized");
        _;
    }

    // Called by the Prediction Market when a user wins
    function addReputation(address user, string calldata category, uint256 points) external onlyMarket {
        uint256 tokenId = userToToken[user];
        if (tokenId == 0) {
            // Mint Soulbound NFT for the user
            tokenId = nextTokenId++;
            _mint(user, tokenId);
            userToToken[user] = tokenId;
        }

        categoryReputation[tokenId][category] += points;
        emit ReputationAdded(user, tokenId, category, points);
    }

    function getCategoryReputation(address user, string calldata category) external view returns (uint256) {
        uint256 tokenId = userToToken[user];
        if (tokenId == 0) return 0;
        return categoryReputation[tokenId][category];
    }

    // OpenZeppelin v5 override to prevent transfers (making the NFT Soulbound)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Soulbound: NFTs are non-transferable and earned only via prediction accuracy");
        return super._update(to, tokenId, auth);
    }
}
