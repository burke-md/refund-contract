require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const alchemyKey = process.env.ALCHEMY_API_KEY;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.17",
    netoworks: {
        hardhat: {
            forking: {
                url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyKey}`,
                blockNumber: 15685704
            }
        }
    }
};
