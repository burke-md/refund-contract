//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

interface IUSDC {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract PaymentAndRefund {

    address private immutable USDC;
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
        USDC = IUSDC(_usdc);
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

    function setPrice(uint256 _price) external onlyAdmin {
        priceInDollars = _price;
    }

    function payUpfront(uint256 _price) external {
        uint256 currentPriceInDollars = priceInDollars;
        // cannot deposit twice
        require(deposits[msg.sender] == 0,
                "User cannot deposit twice.");
        // require price to be correct
        require(_price == currentPriceInDollars,
                "User must pay correct price.");
        // require approval granted
        require(USDC.allowance(msg.sender, address(this) >= currentPriceInDollars,
                "User must approve sufficient amount of USDC.");
        
        USDC.transferFrom(msg.sender, address(this), _price * 10 ** 6);
        depositedUSDC += currentPriceInDollars;

        Deposit memory deposit;
        deposit = Deposit({
            originalDepositInDollars: currentPriceInDollars,
            depositTime: block.timestamp,
            refundSchedule: refundSchedule
        });

        deposites[msg.sender] = deposit;
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
