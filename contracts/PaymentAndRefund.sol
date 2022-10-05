//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

contract PaymentAndRefund {

    address private immutable USDC;

    // each index is 1 week. So the first two weeks you can get a 100% refund
    // the next five, a 75%, etc.
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

    struct Deposit {
        uint64 originalDepositInDollars;  // price may change
        uint64 balanceLeftInDollars;      // the seller can withdraw up to the amount NOT eligible for refund
        uint64 depositTime;
        uint8[] refundSchedule; // The refund schedule can change in the future, but it should stay with the agreed up on one
    }

    mapping(address => Deposit) public deposits;

    address public admin;
    constructor(address _usdc) {
        admin = msg.sender;
        USDC = _usdc;
    }

    modifier onlyAdmin {
        require(msg.sender == admin);
        _;
    }

    function setPrice() external onlyAdmin {

    }

    function payUpfront() external {
        // cannot deposit twice
        // require price to be correct
        // require approval granted
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
}
