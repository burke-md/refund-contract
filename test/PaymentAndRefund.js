const { time, loadFixture } = require(
    "@nomicfoundation/hardhat-network-helpers");
const { expect, use} = require("chai");
const { ethers } = require("hardhat");

use(require("chai-as-promised"));

const ERC20_ABI = require('../data/abi/ERC20.json');
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDC_WHALE = '0x7713974908be4bed47172370115e8b1219f4a5f0';
const PRICE_IN_DOLLARS = 5_000; 
const PRICE_SIX_DECIMALS = 5_000_000_000;
const SPENDING_MONEY = PRICE_IN_DOLLARS * 2 * 10**6;

/* 
 * These constants will be used with `helpers.time.increaseTo(<time since epoch>);
 * JAN_FIRST -> Time stamp for 1/1/22 01:01:00 AM
 * JAN_TENTH -> 1 week and 2 days after JAN_FIRST
 * FEB_SEVENTH -> 5 weeks and 2 days after JAN_FIRST
 * APRIL_EIGHTEENTH -> 15 weeks and 2 days after JAN_FIRST
 */
const JAN_FIRST = 1640998860;
const JAN_TENTH = 1641776460;
const FEB_SEVENTH = 1644195660;
const APRIL_EIGHTEENTH = 1650243660;

describe("PaymentAndRefund", function () {
    async function deployFixture() {
        const [admin, user1, user2] = await ethers.getSigners();

        const PaymentContract = await ethers.getContractFactory("PaymentAndRefund");
        const paymentContract = await PaymentContract.deploy(USDC_ADDRESS);
        await paymentContract.deployed();
        const usdcContract = new ethers.
            Contract(USDC_ADDRESS, ERC20_ABI, ethers.provider);

        const whale = await ethers.getImpersonatedSigner(USDC_WHALE);
        await paymentContract.connect(admin).setPrice(PRICE_IN_DOLLARS);
        await usdcContract.connect(whale).transfer(user1.address, SPENDING_MONEY);
        await usdcContract.connect(whale).transfer(user2.address, SPENDING_MONEY);

        return { paymentContract, usdcContract, admin, user1, user2 };
    }

    describe("Deposit", function () {
        it("User can deposit USDC", async function () {
            const { paymentContract, usdcContract, user1 } = await loadFixture(
                deployFixture);

            const approval = await usdcContract.connect(user1)
                .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);

            await paymentContract.connect(user1).payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
            const contractBalance = await usdcContract
                .balanceOf(paymentContract.address);

            expect(contractBalance).to.equal(PRICE_SIX_DECIMALS);
        });

        it("User cannot make multiple deposits", async function () {
            const { paymentContract, usdcContract, user1 } = await loadFixture(
                deployFixture);

            const approval = await usdcContract.connect(user1)
                .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);

            const payment1 = await paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);

             await expect(paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST)).to.be
                    .rejectedWith('User cannot deposit twice.');
        });


        it("Deposits will increment global var `depositedUSDC`", async function () {
            const { paymentContract, usdcContract, user1 } = await loadFixture(
                deployFixture);
            
            const approval = await usdcContract.connect(user1)
                .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);
            const payment1 = await paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
            const valueFromContract = await paymentContract.depositedUSDC();

            expect(valueFromContract).to.equal(5_000);
        });
    });

    describe("Withdraw", function () {
        describe("Original refundSchedule", function () {
            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK1", async function () {
                const { paymentContract, usdcContract, user1 } = await loadFixture(
                    deployFixture);
                
                const approval = await usdcContract.connect(user1)
                    .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);
                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);


                expect(true).to.equal(false);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK5", async function () {
                const { paymentContract, usdcContract, user1 } = await loadFixture(
                    deployFixture);
                
                const approval = await usdcContract.connect(user1)
                    .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);
                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);


                expect(true).to.equal(false);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK15", async function () {
                const { paymentContract, usdcContract, user1 } = await loadFixture(
                    deployFixture);
               // This is week15 and according the refund schedule there should be 0 refund. 
                const approval = await usdcContract.connect(user1)
                    .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);
                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);


                expect(true).to.equal(false);
            });

            it("User can be withdrawn from program by administrator (Push payment)", async function () {
                const { instance, admin } = await loadFixture(deployFixture);

                expect(true).to.equal(false);
            });
        });

        describe("Updated refundSchedule", function () {
            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK1", async function () {
                const { paymentContract, usdcContract, user1 } = await loadFixture(
                    deployFixture);
                
                const approval = await usdcContract.connect(user1)
                    .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);
                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);


                expect(true).to.equal(false);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK5", async function () {
                const { paymentContract, usdcContract, user1 } = await loadFixture(
                    deployFixture);
                
                const approval = await usdcContract.connect(user1)
                    .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);
                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);


                expect(true).to.equal(false);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK15", async function () {
                const { paymentContract, usdcContract, user1 } = await loadFixture(
                    deployFixture);
               // This is week15 and according the refund schedule there should be 0 refund. 
                const approval = await usdcContract.connect(user1)
                    .approve(paymentContract.address, PRICE_IN_DOLLARS * 10 ** 6);
                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);


                expect(true).to.equal(false);
            });

            it("User can be withdrawn from program by administrator (Push payment)", async function () {
                const { instance, admin } = await loadFixture(deployFixture);

                expect(true).to.equal(false);
            });
        });
    });

    xdescribe("Business logic", function () {
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
