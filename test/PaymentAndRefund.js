const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, use} = require("chai");

use(require("chai-as-promised"));

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
describe("PaymentAndRefund", function () {
    // Use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        const [admin, user1, user2] = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("PaymentAndRefund");
        const instance = await Contract.deploy(USDC_ADDRESS);

        await instance.deployed();

        return { instance, admin, user1, user2 };
    }

    describe("Deposit", function () {
        it("User can deposit USDC", async function () {
            const { instance, admin, user1 } = await loadFixture(deployFixture);
        
            expect(true).to.equal(false);
        });

        it("User cannot make multiple deposits", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });


        it("Deposits will increment global var ` `", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });
    });

    describe("Withdraw", function () {
        it("User can withdraw according the `refundSchedule` (Pull over push)", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });

        it("User can be withdrawn from program by administrator (Push payment)", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });
    });

    describe("Business logic", function () {
        it("Updating `refundSchedule` does not effect existing users", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });

        it("Payment is for no greater than 30 days in the future", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });

        it("Payment is for no greater than 21 days in the past", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });
    });
});

/*
it("===TEMPLATE TEST===", async function () {
const { instance, admin } = await loadFixture(deployFixture);

expect(true).to.equal(false);
});
*/
