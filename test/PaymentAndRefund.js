const { time, loadFixture } = require(
    "@nomicfoundation/hardhat-network-helpers");
const { expect, use} = require("chai");
const { ethers, BigNumber } = require("hardhat");

use(require("chai-as-promised"));

const ERC20_ABI = require('../data/abi/ERC20.json');
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDC_WHALE = '0x7713974908be4bed47172370115e8b1219f4a5f0';
const DIA_ADDRESS = '0x84cA8bc7997272c7CfB4D0Cd3D55cd942B3c9419';
const DIA_WHALE = '0x5a52e96bacdabb82fd05763e25335261b270efcb';
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
 */

const JAN_FIRST = 1672534860;
const JAN_TENTH = 1673312460;
const JAN_TWENTY_FOURTH = 1674522060;
const FEB_FIRST = 1675213260;
const FEB_SEVENTH = 1675731660;
const APRIL_EIGHTEENTH = 1681779660;
const JAN_2050 = 2524611660;

describe("PaymentAndRefund", function () {
    async function deployFixture() {
        const [admin, user1, user2, rescuer] = await ethers.getSigners();

        const PaymentContract = await ethers.getContractFactory("PaymentAndRefund");
        const paymentContract = await PaymentContract.deploy(USDC_ADDRESS, rescuer.address);

        await paymentContract.deployed();

        const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, ethers.provider);
        const diaContract = new ethers.Contract(DIA_ADDRESS, ERC20_ABI, ethers.provider);

        const usdcWhale = await ethers.getImpersonatedSigner(USDC_WHALE);
        const diaWhale = await ethers.getImpersonatedSigner(DIA_WHALE);

        await paymentContract.connect(admin).setPrice(PRICE_IN_DOLLARS);

        await usdcContract.connect(usdcWhale).transfer(user1.address, SPENDING_MONEY);
        await usdcContract.connect(usdcWhale).transfer(user2.address, SPENDING_MONEY);
        await diaContract.connect(diaWhale).transfer(user1.address, SPENDING_MONEY);
        
        // Approve both users for purchase of course once
        const approval1 = await usdcContract.connect(user1)
            .approve(paymentContract.address, PRICE_SIX_DECIMALS);
        const approval2 = await usdcContract.connect(user2)
            .approve(paymentContract.address, PRICE_SIX_DECIMALS);

        return { paymentContract, usdcContract, diaContract, admin, user1, user2, rescuer };
    }

    describe("Deposit", function () {
        it("User can deposit USDC", async function () {
            const { paymentContract, usdcContract, user1 } = await loadFixture(
                deployFixture);

            await paymentContract.connect(user1).payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
            const contractBalance = await usdcContract
                .balanceOf(paymentContract.address);
            expect(contractBalance).to.equal(PRICE_SIX_DECIMALS);
        });

        it("User cannot make multiple deposits", async function () {
            const { paymentContract, usdcContract, user1 } = await loadFixture(
                deployFixture);

            const payment1 = await paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);

             await expect(paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST)).to.be
                    .rejectedWith('User cannot deposit twice.');
        });


        it("Deposits will increment global var `depositedUSDC`", async function () {
            const { paymentContract, usdcContract, user1 } = await loadFixture(
                deployFixture);

            const payment1 = await paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
            const valueFromContract = await paymentContract.depositedUSDC();

            expect(valueFromContract).to.equal(5_000);
        });
    });

    describe("Withdraw", function () {
        describe("Original refundSchedule", function () {
            it("User can withdraw according the `refundSchedule` WEEK0", 
                async function () {
                    const { paymentContract, usdcContract, user1 } = await loadFixture(
                        deployFixture);
                    
                    await time.increaseTo(JAN_FIRST); 
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    // No increase of time. Immidiate withdraw

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 1.00;
                    const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterReduns = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterReduns);
            });

            it("User can withdraw according the `refundSchedule` WEEK1", 
                async function () {
                    const { paymentContract, usdcContract, user1 } = await loadFixture(
                        deployFixture);
                    
                    await time.increaseTo(JAN_FIRST); 
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(JAN_TENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 1.00;
                    const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterReduns = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterReduns);
            });

            it("User can withdraw according the `refundSchedule` WEEK5", 
                async function () {
                    const { paymentContract, usdcContract, user1 } = await loadFixture(
                        deployFixture);
                    
                    await time.increaseTo(JAN_FIRST); 
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(FEB_SEVENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 0.75;
                    const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterRefunds = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterRefunds);
            });

            it("User can withdraw according the `refundSchedule` WEEK15", 
                async function () {
                    const { paymentContract, usdcContract, user1 } = await loadFixture(
                        deployFixture);
                    
                    await time.increaseTo(JAN_FIRST); 
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(APRIL_EIGHTEENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 0;
                    const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
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
                    
                    await time.increaseTo(JAN_FIRST); 
                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(FEB_SEVENTH); 
                    
                    const contractBalanceBeforeRefund = await usdcContract
                        .balanceOf(paymentContract.address);
                    const calculatedRefundInDollars = await paymentContract
                        .calculateRefundDollars(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    await paymentContract.connect(admin).sellerTerminateAgreement(user1.address);

                    const expectedContractBalanceAfterTermination = Number(contractBalanceBeforeRefund) -
                        Number(calculatedRefundSixDecimals);

                    const contractBalanceAfterRefund = await usdcContract
                        .balanceOf(paymentContract.address);

                    expect(expectedContractBalanceAfterTermination).to.equal(contractBalanceAfterRefund);

                    const outstandingStudentRefund = await paymentContract
                        .calculateRefundDollars(user1.address);
            });
        });

        describe("Updated refundSchedule", function () {
            it("Only the administrator can update the `refundSchedule`", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);

                    await expect(paymentContract.connect(user1).
                        setRefundSchedule(NEW_REFUND_SCHEDULER)).to.be.rejectedWith(
                            'onlyAdmin');
                    await expect(paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER))
                        .to.not.be.rejected;
            });

            it("User can withdraw according the `refundSchedule` WEEK0", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);

                    await time.increaseTo(JAN_FIRST); 

                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER)
                    // No increase of time. Immidiate withdraw
                    // New refund schedule

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 1.00;
                    const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterReduns = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterReduns);
            });

            it("User can withdraw according the `refundSchedule` WEEK1", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);

                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);

                    await time.increaseTo(JAN_FIRST); 

                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(JAN_TENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 0.90;
                    const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterReduns = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterReduns);
            });

            it("User can withdraw according the `refundSchedule` WEEK5", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);

                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);

                    await time.increaseTo(JAN_FIRST); 

                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(FEB_SEVENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = PRICE_IN_DOLLARS * 0.50;
                    const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    expect(calculatedRefundInDollars).to.equal(expectedRefundInDollars);

                    await paymentContract.connect(user1).buyerClaimRefund();
                    const balanceAfterRefund = await usdcContract.balanceOf(user1.address);
                    const expectedBalanceAfterRefunds = Number(balanceBeforeRefund) + Number(calculatedRefundSixDecimals);
                   
                    expect(balanceAfterRefund).to.equal(expectedBalanceAfterRefunds);
            });

            it("User can withdraw according the `refundSchedule` WEEK15", 
                async function () {
                    const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                        deployFixture);
                    
                    await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);
                    
                    await time.increaseTo(JAN_FIRST); 

                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(APRIL_EIGHTEENTH); 

                    const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                    const expectedRefundInDollars = 0;
                    const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
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
                    await time.increaseTo(JAN_FIRST); 

                    const payment1 = await paymentContract.connect(user1)
                        .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                    await time.increaseTo(FEB_SEVENTH); 
                    
                    const contractBalanceBeforeRefund = await usdcContract
                        .balanceOf(paymentContract.address);
                    const calculatedRefundInDollars = await paymentContract
                        .calculateRefundDollars(user1.address);
                    const calculatedRefundSixDecimals = calculatedRefundInDollars * 10**6;

                    await paymentContract.connect(admin).sellerTerminateAgreement(user1.address);

                    const expectedContractBalanceAfterTermination = Number(contractBalanceBeforeRefund) -
                        Number(calculatedRefundSixDecimals);

                    const contractBalanceAfterRefund = await usdcContract
                        .balanceOf(paymentContract.address);

                    expect(expectedContractBalanceAfterTermination).to.equal(contractBalanceAfterRefund);

                    const outstandingStudentRefund = await paymentContract
                        .calculateRefundDollars(user1.address);
            });
        });

        describe("Aministrator withdraw throughout program", function () {
            it("Admin can withdraw payment without disrupting refund policy", async function () {
                /* THIS TEST WILL COVER THE FOLLOWING SITUATION:
                *  
                *  User will approve USDC allowance
                *  User will pay for course
                *  Fast forward time 23 days ( will round down to 3 weeks @ 75% refund )
                *  Admin will withdraw available funds ( 5k X 0.25 )
                *  User will leave program and withdraw refund ( 5k X 0.75 )
                */
                
                const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                    deployFixture);
                
                await time.increaseTo(JAN_FIRST); 

                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                await time.increaseTo(JAN_TWENTY_FOURTH); 

                await paymentContract.connect(admin).sellerWithdraw([user1.address]);

                const contractBalance = await usdcContract.balanceOf(paymentContract.address);

                expect(contractBalance).to.equal(PRICE_SIX_DECIMALS * 0.75);
                
                await paymentContract.connect(user1).buyerClaimRefund();

                const contractBalanceAtEnd = await usdcContract.balanceOf(paymentContract.address);
                
                expect(contractBalanceAtEnd).to.equal(0);
                expect(await paymentContract.depositedUSDC()).to.equal(0);
            });

            it("Admin can withdraw from multiple students in multiple cohorts w/ one request", 
                async function () {
                /* THIS TEST WILL COVER THE FOLLOWING SITUATION:
                *  
                *  User1 & user2 will approve USDC allowance
                *  User1 will pay for course begining JAN_FIRST
                *  User2 will pay for courses begining FEB_FIRST
                *  Fast forward to JAN_TWENTY_FOURTH 
                *  Admin will withdraw from both accounts 
                *         Make assertion that correct amount is with drawl
                *         User1 (week3 75% should remain) user2 (has not started 100% reamining)
                *  Fast forward to APRIL_EIGHTEENTH
                *  Admin will withdraw from both accounts 
                *         Make assertion that contract holds appropriate amount
                *         1st complete(0 remaining) 2nd week 11 (25%)
                */
                
                const { paymentContract, usdcContract, admin, user1, user2 } = await loadFixture(
                    deployFixture);

                await time.increaseTo(JAN_FIRST); 

                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                const payment2 = await paymentContract.connect(user2)
                    .payUpfront(PRICE_IN_DOLLARS, FEB_FIRST);

                await time.increaseTo(JAN_TWENTY_FOURTH); 

                expect(await usdcContract.balanceOf(paymentContract.address)).to.equal(
                    2 * PRICE_SIX_DECIMALS);

                await paymentContract.connect(admin).sellerWithdraw([
                    user1.address, user2.address
                ]);

                expect(await usdcContract.balanceOf(paymentContract.address)).to.equal(
                    PRICE_SIX_DECIMALS + (PRICE_SIX_DECIMALS * 0.75));

                await time.increaseTo(APRIL_EIGHTEENTH); 
                await paymentContract.connect(admin).sellerWithdraw([
                    user1.address, user2.address
                ]);

                expect(await usdcContract.balanceOf(paymentContract.address)).to.equal(
                    PRICE_SIX_DECIMALS * 0.25);
            });
        });
    });

    describe("Rescuse funds", function () {
        it("Rescuer can withdraw USDC if funds get stuck in payment contract", async function () {
            const { paymentContract, usdcContract, user1, rescuer } = await loadFixture(
                deployFixture);

            await usdcContract.connect(user1).transfer(paymentContract.address, SPENDING_MONEY);

            await paymentContract.connect(rescuer)
                .rescueERC20Token(USDC_ADDRESS, SPENDING_MONEY);

            const rescuerBalance = await usdcContract.balanceOf(rescuer.address);
            const contractBalance = await usdcContract.balanceOf(paymentContract.address);

            expect(rescuerBalance).to.equal(SPENDING_MONEY);
            expect(contractBalance).to.equal(0);
        });

        it("Rescuer can withdraw alternate ERC20 token from contract", async function () {
            const { 
                paymentContract, 
                usdcContract, 
                diaContract, 
                user1, 
                rescuer } = await loadFixture(deployFixture);

            await diaContract.connect(user1)
                .transfer(paymentContract.address, SPENDING_MONEY);

            await paymentContract.connect(rescuer)
                .rescueERC20Token(DIA_ADDRESS, SPENDING_MONEY);

            const rescuerBalance = await diaContract.balanceOf(rescuer.address);
            const contractBalance = await diaContract.balanceOf(paymentContract.address);

            expect(rescuerBalance).to.equal(SPENDING_MONEY);
            expect(contractBalance).to.equal(0);
        });

        it("Only the rescuer can use `rescueERC20Token` function", async function () {
            const { 
                paymentContract, 
                usdcContract, 
                diaContract, 
                admin,
                user1, 
                rescuer } = await loadFixture(deployFixture);

            await diaContract.connect(user1)
                .transfer(paymentContract.address, SPENDING_MONEY);

            await expect(paymentContract.connect(user1)
                .rescueERC20Token(DIA_ADDRESS, SPENDING_MONEY)).to.be.rejectedWith(
                    'onlyRescuer');

            await expect(paymentContract.connect(admin)
                .rescueERC20Token(DIA_ADDRESS, SPENDING_MONEY)).to.be.rejectedWith(
                    'onlyRescuer');
        });
    });

    describe("Other cases:", function () {
        it("Users cannot withdraw well after completion`refundSchedule` JANUARY 2050 ", 
            async function () {
                const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                    deployFixture);
                
                await paymentContract.connect(admin).setRefundSchedule(NEW_REFUND_SCHEDULER);
                
                await time.increaseTo(JAN_FIRST); 

                const payment1 = await paymentContract.connect(user1)
                    .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
                await time.increaseTo(JAN_2050); 

                const balanceBeforeRefund = await usdcContract.balanceOf(user1.address);
                const expectedRefundInDollars = 0;
                const calculatedRefundInDollars = await paymentContract.calculateRefundDollars(user1.address);
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

            const payment1 = await paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
            const depositedUSDCBeforeWithdraw = await paymentContract.depositedUSDC();

            await paymentContract.connect(user1).buyerClaimRefund();
           
            const depositedUSDCAfterWithdraw = await paymentContract.depositedUSDC();
            expect(depositedUSDCBeforeWithdraw).to.equal(depositedUSDCAfterWithdraw + PRICE_IN_DOLLARS);
        });

        it("User must pass in the correct value for `_price`", async function () {
            const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                deployFixture);
            
            await expect(paymentContract.connect(user1)
                .payUpfront(10_000, JAN_FIRST)).to.be.rejectedWith(
                    'User must pay correct price.');
        });

        it("User must approve the refund contract before making purchase", async function () {
            const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                deployFixture);
            
            // Allowance is made in fixture.
            await usdcContract.connect(user1).decreaseAllowance(
                paymentContract.address, PRICE_SIX_DECIMALS);

            await expect(paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST)).to.be.rejectedWith(
                    'User must have made allowance via USDC contract.');
        });

        it("Only the admin account can update the price", async function () {
            const { paymentContract, admin, user1 } = await loadFixture(
                deployFixture);

            await expect(paymentContract.connect(user1).
                setPrice(6_000)).to.be.rejectedWith(
                    'onlyAdmin');
            await expect(paymentContract.connect(admin).setPrice(6_000)).to.not.be.rejected;
        });

        it("An updated refund schedule must be longer than one week", async function () {
            const { paymentContract, admin } = await loadFixture(deployFixture);

            const badRefundSchedule = [50];
            await expect(paymentContract.connect(admin)
                .setRefundSchedule(badRefundSchedule)).to.be.rejectedWith(
                    'must have at least 1 non-zero refund period');
        });

        it("An updated refund schedule must end with zero refund", async function () {
            const { paymentContract, admin } = await loadFixture(deployFixture);

            const badRefundSchedule = [50, 50];
            await expect(paymentContract.connect(admin)
                .setRefundSchedule(badRefundSchedule)).to.be.rejectedWith(
                    'must end with zero refund');
        });

        it("An updated refund schedule must decrease over time", async function () {
            const { paymentContract, admin } = await loadFixture(deployFixture);

            const badRefundSchedule = [50, 100, 0];
            await expect(paymentContract.connect(admin)
                .setRefundSchedule(badRefundSchedule)).to.be.rejectedWith(
                    'refund must be non-increasing');
        });

        it("Only the admin can withdraw money from contract", async function () {
            const { paymentContract, usdcContract, admin, user1 } = await loadFixture(
                deployFixture);
            
            await time.increaseTo(JAN_FIRST); 
            const payment1 = await paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
            // No increase of time. Immidiate withdraw
        
            await expect(paymentContract.connect(user1).sellerWithdraw([user1.address])).
                to.be.rejectedWith('onlyAdmin');

            await expect(paymentContract.connect(admin).sellerWithdraw([user1.address])).
                to.not.be.rejected;
        });

        it("Only the admin can terminate an agreement", async function () {
            const { paymentContract, usdcContract, admin, user1, user2 } = await loadFixture(
                deployFixture);
            
            await time.increaseTo(JAN_FIRST); 
            const payment1 = await paymentContract.connect(user1)
                .payUpfront(PRICE_IN_DOLLARS, JAN_FIRST);
            // No increase of time. Immidiate withdraw
        
            await expect(paymentContract.connect(user2).sellerTerminateAgreement(user1.address)).
                to.be.rejectedWith('onlyAdmin');

            await expect(paymentContract.connect(admin).sellerTerminateAgreement(user1.address)).
                to.not.be.rejected;
        });
    });
});

