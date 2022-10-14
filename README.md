# Payment and Refund


```shell
npx hardhat coverage
npx prettier --write 'contracts/**/*.sol'

Install: `pip3 install --user-vertigo`
Run: `vertigo run --hardhat-parallel 8`
```

## Mutation testing:

### 3 Mutations remain:


Mutation:
```
[+] Survivors
Mutation:
    File: /home/mb/Documents/code/refund-contract/contracts/PaymentAndRefund.sol
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
    File: /home/mb/Documents/code/refund-contract/contracts/PaymentAndRefund.sol
    Line nr: 152
    Result: Lived
    Original line:
                 if (currentTime < startTime) { 

    Mutated line:
                 if (currentTime <= startTime) { 

    ACTION TAKEN: None. The business logic of this conditional statment sets a variable to 0. In 
                  circumstance of variable equality, it is later set to zero as well (the two values
                  are subtracted. The if statment is to protect against creating a nagitive number).

Mutation:
    File: /home/mb/Documents/code/refund-contract/contracts/PaymentAndRefund.sol
    Line nr: 272
    Result: Lived
    Original line:
                 if (contractBalance > depositedUSDC * USDC_DECIMALS) {

    Mutated line:
                 if (contractBalance >= depositedUSDC * USDC_DECIMALS) {

    ACTION TAKEN: None. This if statement is used to ensure the subtraction that follows does not
                  procude a nagitive value.

Mutation:
    File: /home/mb/Documents/code/refund-contract/contracts/PaymentAndRefund.sol
    Line nr: 272
    Result: Lived
    Original line:
                 if (contractBalance > depositedUSDC * USDC_DECIMALS) {

    Mutated line:
                 if (contractBalance > depositedUSDC / USDC_DECIMALS) {

    ACTION TAKEN: None. This mutation is likely to cause a decimal value and revert.
                  Ex:
                  if (5_000_000_000 > 5_000 / 10 **6) -> 5_000_000_000 / 0.005_000

                  If there were 201 purchasers this would result in a division by 1.005
                  and the GT check would fail. 
[*] Done! 
```
## Unit tests
![Screen Shot 2022-10-12 at 11 24 31 AM](https://user-images.githubusercontent.com/22263098/195384417-d1514f19-9ac0-4138-844b-47a7f2c0c657.png)
