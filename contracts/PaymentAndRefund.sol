//SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity 0.8.17;

contract PaymentAndRefund {

    //address private immutable USDC;

    IERC20 usdc;
    // Each index is 1 week. First two weeks 100% refund is available
    uint8[] public refundSchedule = [
        100,
        100,
         75,
         75,
         75,
         75,
         50,
         50,
         50,
         50,
         25,
         25,
         25,
         25,
         0
    ];
    uint64 public priceInDollars;
    uint256 public depositedUSDC = 0;
    mapping(address => Deposit) public deposits;
    address public admin;

    constructor(address _usdc) {
        admin = msg.sender;
        //USDC = _usdc;

        usdc = IERC20(_usdc);
    }

    struct Deposit {
        uint64 originalDepositInDollars;  // price may change
        // balanceLeftInDollars to be calculated at time of withdraw?
        //uint64 balanceLeftInDollars;      // the seller can withdraw up to the amount NOT eligible for refund
        uint64 depositTime;
        uint8[] refundSchedule; // The refund schedule can change in the future, but it should stay with the agreed up on one
    }

    modifier onlyAdmin {
        require(msg.sender == admin);
        _;
    }

    function setPrice(uint64 _price) external onlyAdmin {
        priceInDollars = _price;
    }

    function payUpfront(uint64 _price) external {
        uint64 currentPriceInDollars = priceInDollars;
        // cannot deposit twice
        require(deposits[msg.sender].depositTime == 0,
                "User cannot deposit twice.");
        // require price to be correct
        require(_price == currentPriceInDollars,
                "User must pay correct price.");
        // require approval granted




        /*
        bytes memory payload = abi.encodeWithSignature("allowance(address,address)",
            msg.sender, address(this));

        (bool successCheck, bytes memory returnCheckData) = address(USDC).call(payload);
        
        require(successCheck, "Non-successful allance check.");
        *
        *               type issue: how to compare bytes returnCheckData w/ uint64
        require(uint64(returnCheckData) >= currentPriceInDollars * 10 ** 6,
                "User must approve sufficient amount of USDC.");
        *
        *
        bytes memory payload2 = abi.encodeWithSignature("transferFrom(address,address,uint256)", 
            msg.sender, address(this), currentPriceInDollars * 2 * 10 ** 6);

        (bool successTransfer, bytes memory returnTransferData) = address(USDC).call(payload2);

        require(successTransfer, "Non-successful transferFrom operation.");
        */ 


        depositedUSDC += currentPriceInDollars;

        Deposit memory deposit;
        deposit = Deposit({
            originalDepositInDollars: currentPriceInDollars,
            depositTime: uint64(block.timestamp),
            refundSchedule: refundSchedule
        });

        deposits[msg.sender] = deposit;
    }

    function buyerClaimRefund() external {
        delete deposits[msg.sender];
    }

    function setRefundSchedule(uint8[] calldata _schedule) external onlyAdmin {
        require(_schedule.length > 1, "must have at least 1 non-zero refund period");
        require(_schedule[_schedule.length - 1] == 0, "must end with zero refund");

        for (uint256 i = 0; i < _schedule.length - 1; ) {
            require(_schedule[i] >= _schedule[i + 1], "refund must be non-increasing");
            unchecked {
                ++i;
            }
        }
        refundSchedule = _schedule;
    }

    // kick student from the program. Refund them according to what they are owed
    function sellerTerminateAgreement() external onlyAdmin {

    }

    function getEligibleRefundAmount(address _buyer) public view returns(uint256) {

    }

    function _getEligibleWithdrawAmount(address _buyer) internal view returns(uint256) {

    }

    function sellerGetEligibleWithdrawAmount(address[] calldata _buyers) public view returns (uint256[] memory) {

    }

    function _sellerWithdraw(address _deposit) internal {

    }

    function sellerWithdraw(address[] calldata _deposits) external onlyAdmin {
        for (uint256 i = 0; i < _deposits.length; ) {
            _sellerWithdraw(_deposits[i]);
            unchecked {
                ++i;
            }
        }
    }

    function getContractUSDCBalance() external returns(uint256) {
        return usdc.balanceOf(address(this));
    }
}
