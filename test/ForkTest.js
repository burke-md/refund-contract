const { expect, use} = require("chai");
//const { ethers } = require('hardhat');
require('@nomiclabs/hardhat-ethers');

const ERC20_ABI = require('../data/abi/ERC20.json');
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDC = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, ethers.provider);

describe("Get contract name", function () {
    it("Should return a string value", async function () {
        const name = await USDC.name();
        console.log(`Name: ${name}`);

        const num = await ethers.provider.getBlockNumber();
        console.log(`NUM: ${num}`);

        expect(true).to.equal(true);
    });
});
