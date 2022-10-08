//SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity 0.8.17;

contract PaymentAndRefund {

    IERC20 USDC;
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
    uint64 constant ONE_WEEK = 3600 * 24 * 7;

    struct Deposit {
        uint64 originalDepositInDollars;  // price may change
        // balanceLeftInDollars to be calculated at time of withdraw?
        //uint64 balanceLeftInDollars;      // the seller can withdraw up to the amount NOT eligible for refund
        uint64 depositTime;
        uint64 startTime;
        uint8[] refundSchedule; // The refund schedule can change in the future, but it should stay with the agreed up on one
    }
//----------------------------------------------------------------------------\\
    constructor(address _usdc) {
        admin = msg.sender;
        USDC = IERC20(_usdc);
    }

    /******
    * TODO:
    * 
    * - Resolve mainnet fork USCD testing issue
    * - Simplfify admin with draw flow
    * - Track each students book keep at time of withdraw
    */


//-----------------------------BUYER (student)--------------------------------\\
    function payUpfront(uint64 _price, uint64 _startTime) external {
        uint64 currentPriceInDollars = priceInDollars;

        require(deposits[msg.sender].depositTime == 0,
                "User cannot deposit twice.");
        require(_price == currentPriceInDollars,
                "User must pay correct price.");
        // require approval granted
        require(USDC.allowance(msg.sender, address(this)) >= currentPriceInDollars * 10 ** 6,
                "User must have made allowance via USDC contract.");
                
        USDC.transferFrom(msg.sender, address(this), currentPriceInDollars * 10 ** 6);
        
        depositedUSDC += currentPriceInDollars;

        Deposit memory deposit;
        deposit = Deposit({
            originalDepositInDollars: currentPriceInDollars,
            depositTime: uint64(block.timestamp),
            startTime: _startTime,
            refundSchedule: refundSchedule
        });

        deposits[msg.sender] = deposit;
    }

    function buyerClaimRefund() external {
        uint64 refundInDollars = getEligibleRefundAmount(msg.sender);

        depositedUSDC -= refundInDollars; 
        delete deposits[msg.sender];

        USDC.transfer(msg.sender, refundInDollars * 10 ** 6);
    }

//-----------------------------SELLER (admin)--------------------------------\\
    modifier onlyAdmin {
        require(msg.sender == admin);
        _;
    }

    function setPrice(uint64 _price) external onlyAdmin {
        priceInDollars = _price;
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
    function sellerTerminateAgreement(address _student) external onlyAdmin {
        /*
           uint64 refundInDollars = 

        depositedUSDC -= refundInDollars;
        delete deposits[_student];

        USDC.transfer(_student, refundInDollars * 10 ** 6);
        */
    }

    function sellerWithdraw(address[] calldata _deposits) external onlyAdmin {
        for (uint256 i = 0; i < _deposits.length; ) {
            _sellerWithdraw(_deposits[i]);
            unchecked {
                ++i;
            }
        }
    }
//------------------------------------UTILS------------------------------------\\

    function getEligibleRefundAmount(address _buyer) public view returns(uint64) {
        uint64 startTime = deposits[_buyer].startTime;
        uint64 currentTime = uint64(block.timestamp);

        //uint64 weeksComplete = (startTime - currentTime) / ONE_WEEK;
        //uint64 multiplier = deposits[_buyer].refundSchedule[weeksComplete] / 100; 
        //uint64 refundInDollars = deposits[_buyer].originalDepositInDollars * multiplier;
        
        //return refundInDollars;
       return deposits[_buyer].originalDepositInDollars;
    }

    function _getEligibleWithdrawAmount(address _account) internal view returns(uint64) {
    }

    function sellerGetEligibleWithdrawAmount(address[] calldata _buyers) public view returns (uint256[] memory) {
        uint256 len = _buyers.length;
        uint256[] memory refunds;
        
        for (uint256 i = 0; i < len; ) {
            //refunds.push(uint256(_getEligibleWithdrawAmount(_buyers[i]));
            unchecked {
                ++i;
            }
        }
        return refunds;
    }

    function _sellerWithdraw(address _deposit) internal {

    }
}
