require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "paris",
    },
  },
  networks: {
    // Shardeum Testnet (Mezame)
    shardeum_testnet: {
      url: process.env.SHARDEUM_TESTNET_RPC || process.env.SHARDEUM_RPC || "https://api-mezame.shardeum.org",
      chainId: Number(process.env.SHARDEUM_TESTNET_CHAIN_ID) || 8119,
      accounts: [PRIVATE_KEY],
    },
    // Shardeum Mainnet
    shardeum_mainnet: {
      url: process.env.SHARDEUM_MAINNET_RPC || "https://api.shardeum.org",
      chainId: 8118,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};