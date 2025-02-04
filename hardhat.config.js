require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-solhint");
require("solidity-coverage");
require("dotenv").config();

const alchemyStr = process.env.ALCHEMY_STRING;
/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
    solidity: { 
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true,
                runs: 1_000_000,
            },
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: alchemyStr,
                blockNumber: 15685704,
            },
        },
    },
};
