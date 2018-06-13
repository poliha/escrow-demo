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
}
