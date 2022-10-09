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
    uint64 constant ONE_WEEK = 3600 * 24 * 7 * 1000;

    struct Deposit {
        uint64 originalDepositInDollars;  
        uint64 balanceLeftInDollars;      // Total to ensure seller does not double dip
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
    * - Simplfify admin with draw flow
    * - Track each students book keep at time of withdraw
    * - Custom log for start dates
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
            balanceLeftInDollars: currentPriceInDollars,
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
        uint64 refundInDollars = getEligibleRefundAmount(_student);

        depositedUSDC -= refundInDollars;
        delete deposits[_student];

        USDC.transfer(_student, refundInDollars * 10 ** 6);
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
        uint64 paidDollars = deposits[_buyer].originalDepositInDollars;
        uint64 scheduleLength = uint64(deposits[_buyer].refundSchedule.length);

        uint64 weeksComplete = _getWeeksComplete(_buyer);
        uint64 multiplier;
       
        if (weeksComplete < scheduleLength) {
            multiplier = deposits[_buyer].refundSchedule[weeksComplete];
        }

        if (weeksComplete > scheduleLength) {
            multiplier == 0;
        }

        return (paidDollars * multiplier) / 100;
    }

/*
    function getEligibleWithdrawAmount(address[] calldata _buyers) public view returns (uint256) {
        uint256 len = _buyers.length;
        uint256 refund = 0;
        
        for (uint256 i = 0; i < len; ) {
            refund += _getEligibleWithdrawAmount(_buyers[i]);
            unchecked {
                ++i;
            }
        }
        return refund;
    }
*/
    function _sellerWithdraw(address _buyer) internal {
        uint64 amountDollars = _getEligibleWithdrawAmount(_buyer); 

        depositedUSDC -= amountDollars;
        deposits[_buyer].balanceLeftInDollars -= amountDollars;

        USDC.transfer(admin, amountDollars *10 **6);
    }

    function _getEligibleWithdrawAmount(address _buyer) internal view returns(uint64) {

        /* LOGIC:
        * - Get amount user can withdraw based on time frame 
        * - Get amount in "account" see `balanceLeftInDollars`
        * - Check balance is greater and return 
        */
        uint64 buyerPaid deposits[_buyer].originalDepositInDollars ;
        uint64 possibleUserWithdraw = buyerPaid - getEligibleRefundAmount(_buyer);
        uint64 accountBalance = deposits[_buyer].balanceLeftInDollars;

        if (possibleUserWithdraw > accountBalance) {
            return 0;
        }

        return possibleUserWithdraw;
    }

    function _getWeeksComplete(address _account) internal view returns(uint64) {
        uint64 startTime = deposits[_account].startTime;
        uint64 currentTime = uint64(block.timestamp);
        
        // Refund before course starts
        if (currentTime < startTime) {
            return 0;
        }

        uint64 weeksComplete = (currentTime - startTime) / ONE_WEEK;
        
        return weeksComplete;
    }
}
