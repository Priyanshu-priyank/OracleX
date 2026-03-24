//Root package.json for hardhat + contracts
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.19",
        settings: { optimizer: { enabled: true, runs: 200 } },
    },
    networks: {
        shardeum: {
            url: process.env.SHARDEUM_RPC || "https://sphinx.shardeum.org/",
            chainId: 8082,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        hardhat: {},
    },
};