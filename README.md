# Creating an Escrow Account Using Stellar

Stellar can be used to build smart contracts. These smart contracts are expressed as compositions of transactions that are connected and executed using a variety of parameters. A 2-party multisig escrow account is one common use pattern for Stellar smart contracts. 

To learn more about Stellar smart contracts, considerations in designing your contract, and this & other design patters take a look at our [Stellar Smart Contracts document](https://www.stellar.org/developers/guides/walkthroughs/stellar-smart-contracts.html). To learn more about the foundational concepts this demo is based on read our section on [2-Party Multisignature Escrow Account with Time Lock & Recovery](https://www.stellar.org/developers/guides/walkthroughs/stellar-smart-contracts.html#2-party-multisignature-escrow-account-with-time-lock-recovery). Please note this demo takes the walkthrough a step further with some minor modification. 

## The Demo 

Once you understand Stellar Smart Contracts conceptually, [check-out our interactive demo](https://lightyeario.github.io/escrow-demo/) that walks you through creation of a 2-party escrow account with time lock and recovery. Though the premise of the demo is highly specific, it can easily be adapted for wider applications. The premise of the demo is as follows: 

 - Tunde would like to buy a car. 
 - A car dealer agrees to sell Tunde a car for 2 million NGN under the condition that the car dealer will return Tunde's funds if the car develops issues after 2 days. We call this the unlock period. 
 - Tunde does not trust the car dealer so he will only pay the funds after two days. 
 
To solve the premise outlined above they decide to set up an escrow that will ensure: 
 - Funds will only be released after 2 days to car dealer.
 - Tunde can get his money back on the 3rd day if there are any issues.
 
 While the demo describes a contract with NGN, any token can be used. 

## How It Works

The demo simulates the creation of a smart contract via a series of paramaters and tasks. The parameters are core decisions that should be determined prior to the creation of a smart contract. They will alter the functionality of the contract. Once you've determined your parameters you should enter them into the demo and proceed with each outlined task. The parameters and tasks are dicussed in more detail below. 

### Parameters 

- Starting balance: Balance in each of the three accounts (Tunde, Escrow and Car dealer) before transactions occur
- Escrow Amount: Amount of NGN that the source account funds into the escrow account.
- Unlock After: Amount of seconds before the funds in escrow can be unlocked for the target account.
- Recover After: Amount of seconds in which the funds in the escrow account are sent back to the source account (if the funds are unclaimed).
- Automate escrow release: If selected, once the unlock period has elapsed, the funds are released.


### Tasks

In order to setup an escrow account using Stellar Smart Contracts you'll need to perform the following steps: 

- Generate Keypairs: Generate Stellar public and private keypairs for each account. 

```javascript
const pair = StellarSdk.Keypair.random();
    return { publicKey: pair.publicKey(), privateKey: pair.secret()};
```

- Create Accounts: Fund the accounts with their corresponding starting balances (in the demo, 10m NGN).

```javascript
   let transaction = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.createAccount({
            destination: srcAccount.publicKey,
            startingBalance: amount
          }))
          .addMemo(StellarSdk.Memo.text('Test Transaction'))
          .build();
        transaction.sign(sourceKeys);
        return horizonServer.submitTransaction(transaction);
```

- Parties Sign: Add the target account as a signer to the escrow accounts

```javascript
    let transaction = new StellarSdk.TransactionBuilder(source)
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 2, // masterweight is set to 2 here so it is still the only signature needed for adding another signer
              lowThreshold: 2,
              medThreshold: 2,
              highThreshold: 2,
              signer: { ed25519PublicKey: carDealerAccount.publicKey, weight: 1 }
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              medThreshold: 3,  // payments will need to be authorised by escrow and one other party
              signer: { ed25519PublicKey: tundeAccount.publicKey, weight: 1 }
            }))
            .addMemo(StellarSdk.Memo.text('Test Transaction'))
            .build();
          transaction.sign(sourceKeys);
          return horizonServer.submitTransaction(transaction);
```

- Start Hold Period: Builds the transaction to unlock the funds in the escrow. This transaction can only be submitted after the unlock time has passed.

```javascript
  let transaction = new StellarSdk.TransactionBuilder(source, { timebounds: { minTime: this.minimumUnlockTime, maxTime: this.maximumTime } })
            .addOperation(StellarSdk.Operation.payment({
              destination: carDealerAccount.publicKey,
              asset: StellarSdk.Asset.native(),
              amount:  this.escrowAmount
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              signer: { ed25519PublicKey: carDealerAccount.publicKey, weight: 0 }
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 1, // revert to original state
              lowThreshold: 0,
              medThreshold: 0,
              highThreshold: 0,
              signer: { ed25519PublicKey: tundeAccount.publicKey, weight: 0 }
            }))
            .addMemo(StellarSdk.Memo.text('Test Transaction'));
          // build and sign transactions but do not submit yet.
          let builtTx = transaction.build();
          builtTx.sign(escrowSourceKeys, destSourceKeys);
          // Save as an XDR string
          this.unlockXDR = builtTx.toEnvelope().toXDR().toString('base64');
```

- Start Refund Period: Builsd the transaction to recover the funds in the escrow if it remains unclaimed. This transaction can only be submitted after the recovery time has passed.

```javascript
  let transaction = new StellarSdk.TransactionBuilder(source, { timebounds: { minTime: this.minimumUnlockTime, maxTime: this.maximumTime } })
            .addOperation(StellarSdk.Operation.payment({
              destination: tundeAccount.publicKey,
              asset: StellarSdk.Asset.native(),
              amount:  this.escrowAmount
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              signer: { ed25519PublicKey: carDealerAccount.publicKey, weight: 0 }
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 1, // revert to original state
              lowThreshold: 0,
              medThreshold: 0,
              highThreshold: 0,
              signer: { ed25519PublicKey: carDealerAccount.publicKey, weight: 0 }
            }))
            .addMemo(StellarSdk.Memo.text('Test Transaction'));
          // build and sign transactions but do not submit yet.
          let builtTx = transaction.build();
          builtTx.sign(escrowSourceKeys, destSourceKeys);
          // Save as an XDR string
          this.recoveryXDR = builtTx.toEnvelope().toXDR().toString('base64');
```

- Fund Escrow: Sends the funds to the escrow account. Can be done multiple times.

```javascript
    let transaction = new StellarSdk.TransactionBuilder(source)
        .addOperation(StellarSdk.Operation.payment({
          destination: this.escrowAccount.publicKey,
          asset: StellarSdk.Asset.native(),
          amount: this.escrowAmount
        }))
        .addMemo(StellarSdk.Memo.text('Test Transaction'))
        .build();
      transaction.sign(sourceKeys);
      return horizonServer.submitTransaction(transaction);

```

- Unlock Funds: Runs the unlock transaction built previously.

```javascript
    // build transaction from saved xdr string
    const transaction = new StellarSdk.Transaction(unlockXDR);
      // submit transaction to network
      return horizonServer.submitTransaction(transaction)
```

- Recover Funds: Run the recovery transaction built previously.

```javascript
    // build transaction from saved xdr string
    const transaction = new StellarSdk.Transaction(recoveryXDR);
      // submit transaction to network
      return horizonServer.submitTransaction(transaction)
```

The following step can be performed by escrow manager, if strictly necessary.
- Raise Dispute: Stop the smart contract if any issues. This removes Tunde and the Car dealer as signers.
Then:
  - Pay Tunde: Refund the buyer
  - Pay Car dealer: Release escrow funds to seller

### Logs
At the bottom of the screen, you'll see logs that contain information about the status of each task. 

### Other Things To Know 

- Under the hood we are not really creating NGN tokens. XLM is used all through the demo on the backend. We've replaced XLM with NGN in the view as it allows us to build a more realistic scenario.
- 1 day is depicted as 100seconds. 


## Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running Unit Tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running End-To-End Tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Disclaimer
This is just a demo and it will most likely contain bugs. Do not use this in production.

