# Payment and Refund


```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

The standard test `npx hardhat test` is now producing an error 'could not determin exicutable to run'. 
Instead run the coverage test command :
`npx hardhat coverage` via solidity-coverage package

## Mutation testing:

Install: `pip3 install --user-vertigo`
Run: `vertigo run --hardhat-parallel 8`

Test output is being saved to `./mutationOutput/<Date with underscores>_<Attempt number>`
