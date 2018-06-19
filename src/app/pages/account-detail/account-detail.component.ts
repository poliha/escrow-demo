import { Component, OnInit, Input } from '@angular/core';
import * as StellarSdk from 'stellar-sdk';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.css']
})
export class AccountDetailComponent implements OnInit {

  @Input() publicKey: string;
  @Input() fedName: string;

  account: any;
  componentInterval: any;
  effects: any;

  constructor() { }

  ngOnInit() {

    if (this.publicKey == null || this.fedName == null) {
     console.error('component not properly initialized');
    }

    if (this.publicKey) {
      this.getAccount();
      this.getEffects();
    }
    this.componentInterval = setInterval(() => {
      // console.log('checking account ...');
      if (this.publicKey) {
        this.getAccount();
        this.getEffects();
      }
    }, 5000);
  }

  getAccount() {
    // console.log('getting account details ... ', this.publicKey);
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

    server.accounts().accountId(this.publicKey).call()
      .then((account) => {
        this.account = account;
      }).catch((error) => {
        console.log('Account not found');
        // set balances and signers to 0
        this.account = {};
        this.account.signers = [];
        this.account.balances = [{balance: 0}];

        // throw new Error('Account not found');
      });

  }

  getEffects() {
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    server.effects().forAccount(this.publicKey).order('desc').limit(10).call()
      .then((effectResults) => {
        this.effects = effectResults.records.map(record => {
          let returnObj = {};
          returnObj['account'] = record.account;
          returnObj['amount'] = record.amount;
          returnObj['type'] = record.type.replace('_', ' ');
          return returnObj;
        });

        // console.log(this.effects);

      })
      .catch((err) => {
        console.log('Effects not found');
      });
  }



}
