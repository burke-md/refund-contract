const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, use} = require("chai");

use(require("chai-as-promised"));

const USDCAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
describe("PaymentAndRefund", function () {
  // Use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("PaymentAndRefund");
    const instance = await Contract.deploy(USDCAddress);

    await instance.deployed();

    return { instance, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("===TEMPLATE TEST===", async function () {
      const { instance, owner } = await loadFixture(deployFixture);

      expect(true).to.equal(false);
    });
  });

  describe("Withdraw", function () {
    it("===TEMPLATE TEST===", async function () {
      const { instance, owner } = await loadFixture(deployFixture);

      expect(true).to.equal(false);
    });
  });
});
