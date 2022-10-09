const { time, loadFixture } = require(
    "@nomicfoundation/hardhat-network-helpers");
const { expect, use} = require("chai");
const { ethers, BigNumber } = require("hardhat");

use(require("chai-as-promised"));

const ERC20_ABI = require('../data/abi/ERC20.json');
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDC_WHALE = '0x7713974908be4bed47172370115e8b1219f4a5f0';
const PRICE_IN_DOLLARS = 5_000; 
const PRICE_SIX_DECIMALS = 5_000_000_000;
const SPENDING_MONEY = PRICE_IN_DOLLARS * 2 * 10**6;
const NEW_REFUND_SCHEDULER = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 9, 8, 7, 6, 0];

/* 
 * FOR TIME RELATED TESTING THE DATE WILL BE MOVED FORWARD TO JAN 1ST 2023 AND WORK 
 * FORWARD FROM THERE
 *
 * These constants will be used with `helpers.time.increaseTo(<time since epoch>);`
 *
 * JAN_FIRST -> Time stamp for 1/1/23 01:01:00 AM
 * JAN_TENTH -> 1 week and 2 days after JAN_FIRST
 * FEB_SEVENTH -> 5 weeks and 2 days after JAN_FIRST
 * APRIL_EIGHTEENTH -> 15 weeks and 2 days after JAN_FIRST
 */

const JAN_FIRST = 1672534860000;
const JAN_TENTH = 1673312460000;
const FEB_SEVENTH = 1675731660000;
const APRIL_EIGHTEENTH = 1681779660000;
const JAN_2050 = 2524611660000;

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
            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK0", 
                async function () {
                    const { paymentContract, usdcContract, user1 } = await loadFixture(
                        deployFixture);
                    
                    // Set up
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    // No increase of time. Immidiate withdraw

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 1.00;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterReduns = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterReduns);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK1", 
                async function () {
                    const { paymentContract, usdcContract, user1 } = await loadFixture(
                        deployFixture);
                    
                    // Set up
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(JAN_TENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 1.00;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterReduns = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterReduns);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK5", 
                async function () {
                    const { paymentContract, usdcContract, user1 } = await loadFixture(
                        deployFixture);
                    
                    // Set up
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(FEB_SEVENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 0.75;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterRefunds = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterRefunds);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK15", 
                async function () {
                    const { paymentContract, usdcContract, user1 } = await loadFixture(
                        deployFixture);
                    
                    // Set up
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(APRIL_EIGHTEENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 0;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterRefunds = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterRefunds);
            });

            it("User can be withdrawn from program by administrator (Push payment) WEEK5",
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);
                    
                    // Set up
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(FEB_SEVENTH); 
                    
                    const contractBalanceBeforeRefund = await usdcContract
                        .balanceOf(paymentContract.address);
                    const calculatedRefundInDollars = await paymentContract
                        .getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    await paymentContract.connect(admin).sellerTerminateAgreement(user1.address);

                    const expectedContractBalanceAfterTermination = Number(contractBalanceBeforeRefund) -
                        Number(calculatedRefundSixDecimals);

                    const contractBalanceAfterRefund = await usdcContract
                        .balanceOf(paymentContract.address);

                    expect(expectedContractBalanceAfterTermination).to.equal(contractBalanceAfterRefund);

                    const outstandingStudentRefund = await paymentContract
                        .getEligibleRefundAmount(user1.address);
            });
        });

        describe("Updated refundSchedule", function () {
            it("Only the administrator can update the `refundSchedule`", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);

                    let error = null;
                    try {
                        await paymentContract.connect(user1).setRefundSchedule(NEW_REFUND_SCHEDULER);
                    } catch (e) {
                        error = e;
                    }
                    /* Catch error w/o reversion string:
                    *  Error: Transaction reverted without a reason string
                    */
                    expect(error).to.not.equal(null);
                    await expect(paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER))
                        .to.not.be.rejected;
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK0", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);

                    // Set up
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER)
                    // No increase of time. Immidiate withdraw
                    // New refund schedule

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 1.00;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterReduns = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterReduns);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK1", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);

                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);

                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(JAN_TENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 0.90;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterReduns = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterReduns);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK5", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);

                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);

                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(FEB_SEVENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 0.50;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterRefunds = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterRefunds);
            });

            it("User can withdraw according the `refundSchedule` (Pull over push) WEEK15", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);
                    
                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);
                    
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(APRIL_EIGHTEENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = 0;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterRefunds = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterRefunds);
            });

            it("User can be withdrawn from program by administrator (Push payment) WEEK5", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);
                    
                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);
                    // Set up
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(FEB_SEVENTH); 
                    
                    const contractBalanceBeforeRefund = await usdcContract
                        .balanceOf(paymentContract.address);
                    const calculatedRefundInDollars = await paymentContract
                        .getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    await paymentContract.connect(admin).sellerTerminateAgreement(user1.address);

                    const expectedContractBalanceAfterTermination = Number(contractBalanceBeforeRefund) -
                        Number(calculatedRefundSixDecimals);

                    const contractBalanceAfterRefund = await usdcContract
                        .balanceOf(paymentContract.address);

                    expect(expectedContractBalanceAfterTermination).to.equal(contractBalanceAfterRefund);

                    const outstandingStudentRefund = await paymentContract
                        .getEligibleRefundAmount(user1.address);
            });
        });

        xdescribe("Aministrator withdraw throughout program", function () {
            it("===test===", 
                async function () {
                    expect(true).to.equal(false);
            });

            it("===test===", 
                async function () {
                    expect(true).to.equal(false);
            });
        });
        
        describe("Other cases:", function () {
            it("Users cannot withdraw well after completion`refundSchedule` (Pull over push) JANUARY 2050 ", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);
                    
                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);
                    
                    await time.increaseTo(JAN_FIRST); 
                    const approval = await usdcContract.connect(user1)
                        .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(JAN_2050); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = 0;
                    const calculatedRefundInDollars = await paymentContract.getEligibleRefundAmount(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterRefunds = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterRefunds);
            });
            it("Withdrawing should decrement global var `depositedUSDC`", async function () {
                const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                    deployFixture);

                await time.increaseTo(JAN_FIRST); 
                const approval = await usdcContract.connect(user1)
                    .approve(paymentContract.address, PRICE_SIX_DECIMALS);
                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                const depositedUSDCBeforeWithdraw = await paymentContract.depositedUSDC();

                await paymentContract.connect(user1).buyerClaimRefund();
               
                const depositedUSDCAfterWithdraw = await paymentContract.depositedUSDC();
                expect(depositedUSDCBeforeWithdraw).to.equal(depositedUSDCAfterWithdraw + PRICE_IN_DOLLARS);
            });

            xit("===test===", 
                async function () {
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
