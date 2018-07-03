import { Component, OnInit, Input } from '@angular/core';
import * as StellarSdk from 'stellar-sdk';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.css']
})
export class AccountDetailComponent implements OnInit{

  @Input() publicKey: string;
  @Input() fedName: string;

  account: any;
  componentInterval: any;
  effects = [];

  constructor() {
    this.account = {};
    this.account.signers = [];
    this.account.balances = [{ balance: 0 }];
  }

  ngOnInit() {
    if (this.publicKey == null || this.fedName == null) {
     console.error('component not properly initialized');
    }

    if (this.publicKey) {
      this.getAccount();
      this.getEffects();
    }

    this.componentInterval = setInterval(() => {
      if (this.publicKey) {
        this.getAccount();
        this.getEffects();
      }
    }, 3000);
  }

  getAccount() {
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

    server.accounts().accountId(this.publicKey).call()
      .then((account) => {
        this.account = account;
      }).catch((error) => {
        // set balances and signers to 0
        this.account = {};
        this.account.signers = [];
        this.account.balances = [{balance: 0}];
      });

  }

  getEffects() {
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

    server.effects().forAccount(this.publicKey).order('desc').limit(5).call()
      .then((effectResults) => {
        this.effects = effectResults.records.map(record => {
          let returnObj = {};
          returnObj['account'] = record.account;
          returnObj['amount'] = record.amount;
          returnObj['type'] = record.type.replace('_', ' ');
          return returnObj;
        });
      })
      .catch((err) => {
        console.log('Effects not found');
      });
  }



}
