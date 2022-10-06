const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, use} = require("chai");
const USDCAbi = require("../data/abi/USDCAbi.json");

use(require("chai-as-promised"));

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const PRICE_IN_DOLLARS = 5_000; 

describe("PaymentAndRefund", function () {
    // Use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        const [admin, USDCSigner, user1, user2] = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("PaymentAndRefund");
        const instance = await Contract.deploy(USDC_ADDRESS);

        await instance.deployed();
        await instance.connect(admin).setPrice(PRICE_IN_DOLLARS);

        const USDCInstance = ethers.getContractAt(USDCAbi, USDC_ADDRESS);
        //const USDCInstance = new ethers.Contract(USDC_ADDRESS, USDCAbi, ethers.provider);

        return { instance, USDCInstance, admin, user1, user2 };
    }

    describe("Deposit", function () {
        it("User can deposit USDC", async function () {
            const { instance, USDCInstance, admin, user1 } = await loadFixture(deployFixture);
/*
            const approval = await USDCInstance.connect(user1)
                .approve(instance.address, PRICE_IN_DOLLARS * 10 ** 6);

            await instance.connect(user1).payUpfront(PRICE_IN_DOLLARS);
*/
                    

            //const contractBalance = await instance.getContractUSDCBalance();
            /*
             * Produces the following error:
             *     Error: Transaction reverted: function returned an unexpected amount of data
             */

            const contractBalance = await USDCInstance.balanceOf(instance.address);
            /*
             * Produces the following error:
             *      TypeError: USDCInstance.balanceOf is not a function

             */
            console.log(`contract balance : ${contractBalance}`);

            //expect(await instance.depositedUSDC()).to.equal(PRICE_IN_DOLLARS);
            //expect(contractBalance).to.equal(PRICE_IN_DOLLARS);
        });

        xit("User cannot make multiple deposits", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });


        xit("Deposits will increment global var ` `", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });
    });

    xdescribe("Withdraw", function () {
        it("User can withdraw according the `refundSchedule` (Pull over push)", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
        });

        it("User can be withdrawn from program by administrator (Push payment)", async function () {
            const { instance, admin } = await loadFixture(deployFixture);

            expect(true).to.equal(false);
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
