//SPDX-License-Identifier: GPL-3.0

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity 0.8.17;

contract PaymentAndRefund {

    IERC20 USDC;
    uint8[15] public refundSchedule = [
        100,100,75,75,75,75,50,50,50,50,25,25,25,25,0
    ];

    uint64 public priceInDollars;
    uint256 public depositedUSDC = 0;
    mapping(address => Deposit) public deposits;
    address public admin;

    struct Deposit {
        uint64 originalDepositInDollars;  
        uint64 balanceInDollars;
        uint64 depositTime;
        uint64 startTime;
        uint8[15] refundSchedule;
    }

    constructor(address _usdc) {
        admin = msg.sender;
        USDC = IERC20(_usdc);
    }

    modifier onlyAdmin {
        require(msg.sender == admin, "onlyAdmin");
        _;
    }

    function payUpfront(uint64 _price, uint64 _startTime) external {
        uint64 currentPriceInDollars = priceInDollars;

        require(deposits[msg.sender].depositTime == 0,
                "User cannot deposit twice.");
        require(_price == currentPriceInDollars,
                "User must pay correct price.");
        require(USDC.allowance(msg.sender, address(this)) >= currentPriceInDollars * 10 ** 6,
                "User must have made allowance via USDC contract.");
                
        USDC.transferFrom(msg.sender, address(this), currentPriceInDollars * 10 ** 6);
        
        depositedUSDC += currentPriceInDollars;

        Deposit memory deposit;
        deposit = Deposit({
            originalDepositInDollars: currentPriceInDollars,
            balanceInDollars: currentPriceInDollars,
            depositTime: uint64(block.timestamp),
            startTime: _startTime,
            refundSchedule: refundSchedule
        });

        deposits[msg.sender] = deposit;
    }

    function buyerClaimRefund() external {
        uint256 refundInDollars = calculateRefundDollars(msg.sender);

        depositedUSDC -= refundInDollars; 
        delete deposits[msg.sender];

        USDC.transfer(msg.sender, refundInDollars * 10 ** 6);
    }

    function setPrice(uint64 _price) external onlyAdmin {
        priceInDollars = _price;
    }

    function setRefundSchedule(uint8[15] calldata _schedule) external onlyAdmin {
        require(_schedule[0] > 0, "must have at least 1 non-zero refund period");
        require(_schedule[_schedule.length - 1] == 0, "must end with zero refund");

        uint len = _schedule.length;
        for (uint256 i = 0; i < len - 1; ) {
            uint256 idxValue = _schedule[i];
            require(idxValue >= _schedule[i + 1], "refund must be non-increasing");
            require(idxValue < 101, "refund cannot exceed 100%");
            unchecked {
                ++i;
            }
        }
        refundSchedule = _schedule;
    }

    function sellerTerminateAgreement(address _buyer) external onlyAdmin {
        uint256 refundInDollars = calculateRefundDollars(_buyer);

        depositedUSDC -= refundInDollars;
        delete deposits[_buyer];

        USDC.transfer(_buyer, refundInDollars * 10 ** 6);
    }

    function sellerWithdraw(address[] calldata _buyers) external onlyAdmin {
        uint256 dollarsToWithdraw = 0;
        uint256 len = _buyers.length;

        for (uint256 i = 0; i < len; ) {
            uint256 safeValue = calculateSafeWithdrawDollars(_buyers[i]);
            dollarsToWithdraw += safeValue;
            deposits[_buyers[i]].balanceInDollars -= uint64(safeValue);
            unchecked {
                ++i;
            }
        }
        depositedUSDC -= dollarsToWithdraw;
        USDC.transfer(admin, dollarsToWithdraw *10 **6);
    }

    function calculateRefundDollars(address _buyer) public view returns(uint256) {
        uint256 paidDollars = deposits[_buyer].originalDepositInDollars;
        uint256 scheduleLength = deposits[_buyer].refundSchedule.length;

        uint256 weeksComplete = _getWeeksComplete(_buyer);
        uint256 multiplier;
       
        if (weeksComplete < scheduleLength) {
            multiplier = deposits[_buyer].refundSchedule[weeksComplete];
        }

        if (weeksComplete > scheduleLength) {
            multiplier = 0;
        }

        return (paidDollars * multiplier) / 100;
    }


    function calculateSafeWithdrawDollars(address _buyer) public view returns(uint256) {
        uint256 accountRequirments = calculateRefundDollars(_buyer);
        uint256 accountBalance = deposits[_buyer].balanceInDollars;

        if (accountRequirments >= accountBalance) {
            return 0;
        }
        
        return accountBalance - accountRequirments;
    }

    function _getWeeksComplete(address _account) internal view returns(uint256) {
        uint256 startTime = deposits[_account].startTime;
        uint256 currentTime = block.timestamp;
        
        if (currentTime < startTime) { 
            return 0;
        }

        uint256 weeksComplete = (currentTime - startTime) / 1 weeks;
        
        return weeksComplete;
    }

    function rescueERC20Token(IERC20 _tokenContract, uint256 _amount) external onlyAdmin {
        _tokenContract.transfer(admin, _amount);
    }
}
