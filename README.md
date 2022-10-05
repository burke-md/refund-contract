# Payment and Refund


```shell
npx hardhat coverage
npx prettier --write 'contracts/**/*.sol'

Install: `pip3 install --user-vertigo`
Run: `vertigo run --hardhat-parallel 8`
```

## Mutation testing:

### 3 Mutations remain:


```
Mutation:
    File: /home/mb/Documents/code/refund-contract/contracts/PaymentAndRefund.sol
    Line nr: 45
    Result: Lived
    Original line:
                 require(_startTime >= maxPastTime && _startTime <= maxFutureTime,

    Mutated line:
                 require(_startTime >= maxPastTime && _startTime < maxFutureTime,

    ACTION TAKEN: None. This require statment is to enforce a range. Changing the 
                  `<=` to a `<` ensures the value is still within the range. The 
                  possible change here would be to use the more restrictive operator
                  and variable -> `maxFutureTimePlusOneSecond` but this has been
                  avoided for simplicity.
                  
                  
Mutation:
    Line nr: 129
    Result: Lived
    Original line:
                 if (weeksComplete > scheduleLength) {

    Mutated line:
                 if (weeksComplete >= scheduleLength) {
    
    ACTION TAKEN: None. The business logic of this conditional statment sets a variable to 0. In 
                  circumstance of variable equality, the `multiplier` is set to zero (The 
                  refundSchedule's last index, this is inforced by the refundSchedule setter
                  function's requirments).

Mutation:
    Line nr: 152
    Result: Lived
    Original line:
                 if (currentTime < startTime) { 

    Mutated line:
                 if (currentTime <= startTime) { 

    ACTION TAKEN: None. The business logic of this conditional statment sets a variable to 0. In 
                  circumstance of variable equality, it is later set to zero as well (the two values
                  are subtracted. The if statment is to protect against creating a nagitive number).
```
## Unit tests
![Screen Shot 2022-10-12 at 11 24 31 AM](https://user-images.githubusercontent.com/22263098/195384417-d1514f19-9ac0-4138-844b-47a7f2c0c657.png)
