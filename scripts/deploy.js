const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Set manual gas limits to bypass the inflated RPC estimation that thinks we need 3000 SHM
  const overrides = {
    gasLimit: 8500000,
    gasPrice: BigInt("100000000000") // 100 gwei - typical Shardeum limit
  };

  // 1. Deploy Reputation NFT
  const NFT = await hre.ethers.deployContract("ReputationNFT", [], overrides);
  await NFT.waitForDeployment();
  const nftAddr = await NFT.getAddress();
  console.log("ReputationNFT:", nftAddr);

  // 2. Deploy PredictionMarket — CPMM constructor only takes aiResolver
  const Market = await hre.ethers.deployContract("PredictionMarket", [deployer.address], overrides);
  await Market.waitForDeployment();
  const marketAddr = await Market.getAddress();
  console.log("PredictionMarket:", marketAddr);

  // 3. Connect NFT to Market
  const nftContract = await hre.ethers.getContractAt("ReputationNFT", nftAddr);
  await nftContract.setPredictionMarket(marketAddr, overrides);
  console.log("Linked ReputationNFT to PredictionMarket");

  console.log("\n=== COPY THESE INTO .env AND src/utils/contracts.js ===");
  console.log(`VITE_MARKET_ADDRESS="${marketAddr}"`);
  console.log(`VITE_NFT_ADDRESS="${nftAddr}"`);
}

main().catch(console.error);
