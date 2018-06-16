import { Component, OnInit, Input } from '@angular/core';
import * as StellarSdk from 'stellar-sdk';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.css']
})
export class AccountDetailComponent implements OnInit {

  @Input() publicKey: string;

  account: any;
  componentInterval: any;
  effects: any;

  constructor() { }

  ngOnInit() {
    if (this.publicKey) {
      this.getAccount();
    }
    this.componentInterval = setInterval(() => {
      // console.log('checking account ...');
      if (this.publicKey) {
        this.getAccount();
      }
    }, 5000);
  }

  getAccount() {
    // console.log('getting account details ... ', this.publicKey);
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

    server.accounts().accountId(this.publicKey).call()
      .then((account) => {
        // console.log('account: ', account);
        this.account = account;
        return server.effects().forAccount(this.publicKey).order('desc').limit(10).call();
      }).catch(function (error) {
        console.log('Error', error);
        throw new Error('Account not found');
      })
      .then((effectResults) => {
        // console.log(effectResults.records);

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
        console.log(err);
      });
  }

}
