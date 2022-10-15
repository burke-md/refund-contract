# Implement these changes:

- [ ] splitting the require statements into two, you can save gas (you can double check this with

- [ ] admin will be a storage read, and we already know admin will be calling via the modifier, so if we use msg.sender it will save gas L: 264
- [ ] Should be immutable right? L: 11
- [ ] this with the variable above it, then we avoid a cold storage read. When a user pays up front, the priceInDollars variable must be cold read to check they paid the right price. We might as well warm up the depositedUSDC slot at the same time too L: 31

- [ ] Since the code is so similar in the tests when you are testing different Week 5/15 etc scenarios, how about abstract these into helper functions? L:302

- [ ] Functions that are onlyAdmin can be made payable because presumably the admin won’t be stupid enough to send ether in those transactions. This will save a little gas also

- [x] The solc optimizer should be set to 1 Million
- [x] publicly mispelled L:193
- [x] publicly mispelled L:219
- [x] interanlly spelled wrong L: 237
- [x] requirments also misspelled L:230

***

- [x] format USDCABI.json (removed                              - (use standard ERC20 ABI)
- [x] Handle Forktest commented test                            - (removed file - test mirror in main test file)
- [x] Deploy script is for demo proj                            - (setup for PaymentAndRefund)
- [x] Test new deploy script on HH network                      - (Succesfully run locally)
- [x] Resolve number of args issue                              - (remove 'rescuer' role/address)
- [x] Create constant for 10**6 (USDC_DECIMALS)                 - (Implemented throughout test)
- [x] Add Natspec @dev @param @return @author                   - (Completed)
- [x] Admin and rescuer should be the same                      - (update contract, then tests)
- [x] License should be GPL-3.0                                 - (Resolved)
- [x] Prevent people from 'starting' to far in past or future   - (Implemented w/ 30 day constant)
- [x] Uncheck math L 51 L109                                    - (Resolved)
- [x] Solmint                                                   - (Completed)
- [x] Rerun and resolve mutation test                           - (Notes added to mutationOutput dir)
