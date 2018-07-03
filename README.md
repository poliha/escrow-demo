# EscrowDemo
This demo displays how a multisig escrow smart contract can be implemented in stellar. It is the product of what is described in the developer docs: [2-Party Multisignature Escrow Account with Time Lock & Recovery](https://www.stellar.org/developers/guides/walkthroughs/stellar-smart-contracts.html#2-party-multisignature-escrow-account-with-time-lock-recovery) with some minor modification.



[See Demo Here](https://poliha.github.io/escrow-demo/)

## How it works


### Demo Control
- Starting balance: This is the balance for all accounts(Tunde, Escrow and Car dealer).
- Escrow Amount: This is the amount that the source account funds the escrow account with
- Unlock After: The amount of seconds before the funds in escrow can be unlocked for the target account
- Recover After: The amount of seconds after which the funds in the escrow account is sent back to the source account if it is unclaimed.
- Automate escrow release: If selected, once the ulock period has elapsed, the funds are released


### Tasks
The tasks to be done in this smart contract
- Generate Keypairs: Generate Stellar public and private keypairs for each account.
- Create Accounts: Fund the accounts with their corresponding starting balances.
- Parties Sign: Add target account as a signer to the escrow accounts.
- Start Hold Period: Build the transaction to unlock the funds in the escrow. Note this transaction can only be submitted after the unlock time has passed.
- Start Refund Period: Build the transaction to recover the funds in the escrow if it remains unclaimed. Note this transaction can only be submitted after the recovery time has passed.
- Fund Escrow: Send funds to the escrow account. Can be done multiple times.
- Unlock Funds: Run the unlock transaction built above
- Recover Funds: Run the recovery transaction built above
Tasks below to be performed by escrow manager
- Raise Dispute: Stop the smart contract if any issues, then:
  - Pay Tunde: Refund the buyer
  - Pay Car dealer: Release escrow funds to seller

### Logs
At the bottom of the screen, this contains information about the status of each task. 



## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Disclaimer
This is just a demo and it will most likely contain bugs. Do not use this in production.

