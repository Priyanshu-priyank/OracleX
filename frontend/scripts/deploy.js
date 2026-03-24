// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = hre.network.name;

    console.log("=".repeat(50));
    console.log("Network:", network);
    console.log("Deploying from:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "SHM");
    console.log("=".repeat(50));

    // Resolver (AI oracle wallet)
    const RESOLVER = process.env.RESOLVER_ADDRESS || deployer.address;

    console.log("\nDeploying PredictionMarket...");
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const market = await PredictionMarket.deploy(RESOLVER);

    await market.waitForDeployment();
    const address = await market.getAddress();

    console.log("\n✅ PredictionMarket deployed to:", address);

    const explorerBase =
        network === "shardeum_mainnet"
            ? "https://explorer.shardeum.org"
            : "https://explorer-mezame.shardeum.org";

    console.log("Explorer:", `${explorerBase}/address/${address}`);

    console.log("\n📌 Add this to frontend:");
    console.log(`export const MARKET_CONTRACT_ADDRESS = "${address}";`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});