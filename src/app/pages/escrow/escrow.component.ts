import { Component, OnInit } from '@angular/core';
import * as StellarSdk from 'stellar-sdk';

@Component({
  selector: 'app-escrow',
  templateUrl: './escrow.component.html',
  styleUrls: ['./escrow.component.css']
})
export class EscrowComponent implements OnInit {

  originAccount: { publicKey: string, privateKey: string };
  srcAccount: {publicKey: string, privateKey: string};
  destAccount: { publicKey: string, privateKey: string };
  escrowAccount: { publicKey: string, privateKey: string };
  startingBalance = '10';
  premiumAmount =  '50';
  minimumTime = 0;
  maximumTime = 0;
  unlockXDR = '';
  recoveryXDR = '';

  constructor() {
    this.originAccount = { publicKey: '', privateKey: '' };
   }

  ngOnInit() {

  }

  generateAccount() {
    const pair = StellarSdk.Keypair.random();
    return { publicKey: pair.publicKey(), privateKey: pair.secret() };
  }

  startDemo() {
    console.log('1. Generate Keypairs ...');
    this.srcAccount = this.generateAccount();
    this.destAccount = this.generateAccount();
    this.escrowAccount = this.generateAccount();
    console.log('2. Keypairs Generated');

  }

  createAccounts() {
    console.log('3. Creating accounts ... ');
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const sourceKeys = StellarSdk.Keypair.fromSecret(this.originAccount.privateKey);

    server.loadAccount(this.originAccount.publicKey)
      .catch((error) => {
        console.error(error);
        throw new Error('The origin account does not exist!');
      })
      .then((source) => {
        // Start building the transaction.
        let transaction = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.createAccount({
            destination: this.srcAccount.publicKey,
            startingBalance: this.startingBalance
          }))
          .addOperation(StellarSdk.Operation.createAccount({
            destination: this.destAccount.publicKey,
            startingBalance: this.startingBalance
          }))
          .addOperation(StellarSdk.Operation.createAccount({
            destination: this.escrowAccount.publicKey,
            startingBalance: this.startingBalance
          }))
          .addMemo(StellarSdk.Memo.text('Test Transaction'))
          .build();
        transaction.sign(sourceKeys);
        return server.submitTransaction(transaction);
      })
      .then(function (result) {
        console.log('Success! Results:', result);
        console.log('4. Accounts created ');
      })
      .catch(function (error) {
        console.error('Something went wrong!', error);
      });
  }

  multisigEnable() {
    console.log('5. Enabling Multisig ... ');
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const sourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);

    server.loadAccount(this.escrowAccount.publicKey)
      .catch((error) => {
        console.error(error);
        throw new Error('The escrow account does not exist!');
      })
      .then((source) => {
        // Start building the transaction.
        let transaction = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.setOptions({
            masterWeight: 1,
            lowThreshold: 2,
            medThreshold: 2,
            highThreshold: 2,
            signer: { ed25519PublicKey: this.destAccount.publicKey, weight: 1 }
          }))
          .addMemo(StellarSdk.Memo.text('Test Transaction'))
          .build();
        transaction.sign(sourceKeys);
        return server.submitTransaction(transaction);
      })
      .then(function (result) {
        console.log('Success! Results:', result);
        console.log('6. Multisig Enabled ');
      })
      .catch(function (error) {
        console.error('Something went wrong!', error);
      });
  }

  buildUnlockTransaction() {
    console.log('7. building unlock transaction ... ');
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const escrowSourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);
    const destSourceKeys = StellarSdk.Keypair.fromSecret(this.destAccount.privateKey);

    server.loadAccount(this.escrowAccount.publicKey)
      .catch((error) => {
        console.error(error);
        throw new Error('The escrow account does not exist!');
      })
      .then((source) => {
        // Start building the transaction.
        let transaction = new StellarSdk.TransactionBuilder(source, { timebounds: { minTime: this.minimumTime, maxTime: this.maximumTime } })
          .addOperation(StellarSdk.Operation.setOptions({
            masterWeight: 0,
            lowThreshold: 1,
            medThreshold: 1,
            highThreshold: 1
          }))
          .addMemo(StellarSdk.Memo.text('Test Transaction'));

        // build and sign transaction
        // sign transactions by both escrow and destination
        // IDEA: maybe split the signing into two seperate events to depict how
        // this might be signed when you dont have access to the keys of both account.
        // i.e. convert to XDR during intermediate signing events.
        let builtTx = transaction.build();
        builtTx.sign(escrowSourceKeys, destSourceKeys);
        this.unlockXDR = builtTx.toEnvelope().toXDR().toString('base64');

      })
      .then(function () {
        console.log('8. Unlock transaction built');
      })
      .catch(function (error) {
        console.error('Something went wrong!', error);
      });
  }

  buildRecoveryTransaction() {
    console.log('9. building recovery transaction ... ');
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const escrowSourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);
    const destSourceKeys = StellarSdk.Keypair.fromSecret(this.destAccount.privateKey);

    server.loadAccount(this.escrowAccount.publicKey)
      .catch((error) => {
        console.error(error);
        throw new Error('The escrow account does not exist!');
      })
      .then((source) => {
        // Start building the transaction.
        let transaction = new StellarSdk.TransactionBuilder(source, {
          timebounds: { minTime: this.minimumTime, maxTime: this.maximumTime }
        })
          .addOperation(StellarSdk.Operation.setOptions({
            masterWeight: 1, // might not be necessary, weight is already 1
            lowThreshold: 1,
            medThreshold: 1,
            highThreshold: 1,
            signer: { ed25519PublicKey: this.destAccount.publicKey, weight: 0 }
          }))
          .addMemo(StellarSdk.Memo.text('Test Transaction'));

        // build and sign transaction
        // sign transactions by both escrow and destination
        // IDEA: maybe split the signing into two seperate events to depict how
        // this might be signed when you dont have access to the keys of both account.
        // i.e. convert to XDR during intermediate signing events.
        let builtTx = transaction.build();
        builtTx.sign(escrowSourceKeys, destSourceKeys);
        this.recoveryXDR = builtTx.toEnvelope().toXDR().toString('base64');

      })
      .then(function () {
        console.log('8. Recovery transaction built');
      })
      .catch(function (error) {
        console.error('Something went wrong!', error);
      });
  }

  fundEscrow() {
    console.log('Funding Escrow ... ');
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const sourceKeys = StellarSdk.Keypair.fromSecret(this.srcAccount.privateKey);

    server.loadAccount(this.srcAccount.publicKey)
      .catch((error) => {
        console.error(error);
        throw new Error('The source account does not exist!');
      })
      .then((source) => {
        // Start building the transaction.
        let transaction = new StellarSdk.TransactionBuilder(source)
          .addOperation(StellarSdk.Operation.payment({
            destination: this.escrowAccount.publicKey,
            asset: StellarSdk.Asset.native(),
            amount: this.premiumAmount
          }))
          .addMemo(StellarSdk.Memo.text('Test Transaction'))
          .build();
        transaction.sign(sourceKeys);
        return server.submitTransaction(transaction);
      })
      .then(function (result) {
        console.log('Success! Results:', result);
        console.log('Escrow Funded ');
      })
      .catch(function (error) {
        console.error('Something went wrong!', error);
      });
  }

}
