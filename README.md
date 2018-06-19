# EscrowDemo
This demo displays how a multisig escrow smart contract can be implemented in stellar. It is the product of what is described in the developer docs: [2-Party Multisignature Escrow Account with Time Lock & Recovery](https://www.stellar.org/developers/guides/walkthroughs/stellar-smart-contracts.html#2-party-multisignature-escrow-account-with-time-lock-recovery)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.8.

## How it works
The demo page contains 2 horizontal sections, each having 3 vertical components.
The top horizontal section contains the Demo control, Tasks and Logs. 
The bottom horizontal section contains the account details for the source, escrow and target accounts.
Clicking on each task will carry out the required action.



### Demo Control
- Starting balance: This is the balance that the source and target accounts are created with
- Escrow Balance: This is the balance that the escrow account is created with
- Escrow Amount: This is the amount that the source account funds the escrow account with.
- Unlock After: The amount of seconds before the funds in escrow can be unlocked for the target account
- Recover After: The amount of seconds after which the funds in the escrow account is sent back to the source account if it is unclaimed.

### Tasks
The tasks to be done in this smart contract
- Generate Keypairs: Generate Stellar public and private keypairs for each account.
- Create Accounts: Fund the accounts with their corresponding starting balances.
- Enable Multisig: Add target account as a signer to the escrow accounts.
- Build Unlock Transaction: Build the transaction to unlock the funds in the escrow. Note this transaction can only be submitted after the unlock time has passed.
- Build Recovery Transaction: Build the transaction to recover the funds in the escrow if it remains unclaimed. Note this transaction can only be submitted after the recovery time has passed.
- Fund Escrow: Send funds to the escrow account. Can be done multiple times.
- Unlock Funds: Run the unlock transaction built above
- Recover Funds: Run the recovery transaction built above

### Logs
This contains information about the status of each task.



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

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
