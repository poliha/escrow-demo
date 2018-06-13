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


}
