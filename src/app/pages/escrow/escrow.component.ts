import { Component, OnInit } from '@angular/core';
import * as StellarSdk from 'stellar-sdk';
import * as moment from 'moment';
import { delay } from 'q';

@Component({
  selector: 'app-escrow',
  templateUrl: './escrow.component.html',
  styleUrls: ['./escrow.component.css']
})
export class EscrowComponent implements OnInit {
  logs = [];
  originAccount: { publicKey: string, privateKey: string, fedName: string } = {
    publicKey: '',
    privateKey: '',
    fedName: 'origin*stellar.org'
  };
  srcAccount: { publicKey: string, privateKey: string, fedName: string } = {
    publicKey: '',
    privateKey: '',
    fedName: 'source*stellar.org'
  };
  destAccount: { publicKey: string, privateKey: string, fedName: string } = {
    publicKey: '',
    privateKey: '',
    fedName: 'target*stellar.org'
  };
  escrowAccount: { publicKey: string, privateKey: string, fedName: string } = {
    publicKey: '',
    privateKey: '',
    fedName: 'escrow*stellar.org'
  };
  startingBalance = '100';
  escrowAmount = '5';
  escrowStartingBalance = '2.1';
  totalSent = 0;
  minimumUnlockTime = 0;
  minimumRecoveryTime = 0;
  maximumTime = 0;
  unlockAfter = 60;
  recoverAfter = 100;
  unlockXDR = '';
  recoveryXDR = '';
  unlockInterval: any;
  recoveryInterval: any;
  currentTime: any;

  tasks = {
    generateKeypairs: { active: false, status: false, completed: false },
    createAccounts: { active: false, status: false, completed: false },
    enableMultisig: { active: false, status: false, completed: false },
    buildUnlock: { active: false, status: false, completed: false },
    buildRecovery: { active: false, status: false, completed: false },
    fundEscrow: { active: false, status: false, completed: false },
    runUnlock: { active: false, status: false, completed: false },
    runRecovery: { active: false, status: false, completed: false },
  };


  constructor() {
    this.originAccount = {
      publicKey: 'GBZHC2HO35PLTAB4VCCKNSRONUONQVJ3TTVAT5QI3NZWP2MXCHE22QNA',
      privateKey: 'SC4AIUZ2N6E3ACB4O3BALXKI4C2FBSCYOY3VSGFBHKVIVGKPJD7ACYU3',
      fedName: 'origin*stellar.org'
    };

  }

  ngOnInit() {
    this.currentTime = moment().unix();
    this.minimumUnlockTime = this.currentTime + this.unlockAfter;
    this.minimumRecoveryTime = this.currentTime + this.recoverAfter;
   }

  async generateAll() {
    try {
      this.logs.push('Generate Keypairs ...');
      this.tasks.generateKeypairs.active = true;
      // add a little delay :)
      await this.addDelay(3000);

      this.srcAccount = this.generateAccount('source');
      this.destAccount = this.generateAccount('target');
      this.escrowAccount = this.generateAccount('escrow');

      this.logs.push('Keypairs Generated');
      this.tasks.generateKeypairs.status = true;
      this.tasks.generateKeypairs.active = false;
      this.tasks.generateKeypairs.completed = true;
    } catch (error) {
      this.tasks.generateKeypairs.status = false;
      this.tasks.generateKeypairs.active = false;
      this.tasks.generateKeypairs.completed = true;
    }
  }

  createAccounts() {
    this.logs.push('Create accounts');
    this.tasks.createAccounts.active = true;

    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const sourceKeys = StellarSdk.Keypair.fromSecret(this.originAccount.privateKey);

    return server.loadAccount(this.originAccount.publicKey)
      .catch((error) => {
        console.error(error);
        throw new Error('The origin account does not exist!');
      })
      .then((source) => {
        // Start building the transaction.
        // to do use different starting balances
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
            startingBalance: this.escrowStartingBalance
          }))
          .addMemo(StellarSdk.Memo.text('Test Transaction'))
          .build();
        transaction.sign(sourceKeys);
        return server.submitTransaction(transaction);
      })
      .then((result) => {
        console.log('Success! Results:', result);
        console.log('4. Accounts created ');
        this.tasks.createAccounts.active = false;
        this.tasks.createAccounts.completed = true;
        this.tasks.createAccounts.status = true;
        this.logs.push('Create accounts success');
        return Promise.resolve('Success');
      })
      .catch((error) => {
        console.error('Something went wrong!', error);
        this.tasks.createAccounts.active = false;
        this.tasks.createAccounts.completed = true;
        this.tasks.createAccounts.status = false;
        return Promise.reject(error);
      });
  }

  enableMultisig() {

    try {
      console.log('5. Enabling Multisig ... ');
      this.logs.push('Enabling Multisig...');
      this.tasks.enableMultisig.active = true;

      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const sourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);

      return server.loadAccount(this.escrowAccount.publicKey)
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
        .then((result) => {
          console.log('Success! Results:', result);
          console.log('6. Multisig Enabled ');
          this.tasks.enableMultisig.status = true;
          this.tasks.enableMultisig.active = false;
          this.tasks.enableMultisig.completed = true;
          this.logs.push('Multisig enabled');
          return Promise.resolve('success');
        })
        .catch((error) => {
          console.error('Something went wrong!', error);
          this.tasks.enableMultisig.status = false;
          this.tasks.enableMultisig.active = false;
          this.tasks.enableMultisig.completed = true;
          return Promise.reject(error);
        });
    } catch (error) {
      console.error('Something went wrong!', error);
      this.tasks.enableMultisig.status = false;
      this.tasks.enableMultisig.active = false;
      this.tasks.enableMultisig.completed = true;
    }


  }

  async unlockProcess() {
    try {

      const buildUnlock = await this.buildUnlockTransaction();

      if (!buildUnlock) {
        throw new Error('unable to build unlock tx');
      }

      this.logs.push('Waiting for Unlock Period');
      this.unlockInterval = setInterval(() => {
        console.log('checking unlock status ...');
        if (this.unlockAfter <= 0) {
          this.unlockAfter = 0;
          clearInterval(this.unlockInterval);
        } else {
          this.unlockAfter--;
        }
        // this.runUnlockTx();
      }, 1000);

    } catch (error) {
      
    }
  }

  async recoveryProcess() {
    try {
      const buildRecovery = await this.buildRecoveryTransaction();

      if (!buildRecovery) {
        throw new Error('unable to build recovery tx');
      }
      this.logs.push('Waiting for Recovery Period');
      this.recoveryInterval = setInterval(() => {
        console.log('checking recovery status ...');
        if (this.recoverAfter <= 0) {
          this.recoverAfter = 0;
          clearInterval(this.recoveryInterval);
        } else {
          this.recoverAfter--;
        }
        // this.runRecoveryTx();
      }, 1000);

    } catch (error) {

    }
  }


  
  buildUnlockTransaction() {
    try {
      console.log('7. building unlock transaction ... ');
      this.logs.push('Building Unlock Transaction');
      this.tasks.buildUnlock.active = true;

      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const escrowSourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);
      const destSourceKeys = StellarSdk.Keypair.fromSecret(this.destAccount.privateKey);

      return server.loadAccount(this.escrowAccount.publicKey)
        .catch((error) => {
          console.error(error);
          throw new Error('The escrow account does not exist!');
        })
        .then((source) => {
          this.currentTime = moment().unix();
          console.log('CT: ', this.currentTime);

          this.minimumUnlockTime = this.currentTime + this.unlockAfter;
          console.log('UT: ', this.minimumUnlockTime);

          // Start building the transaction.
          let transaction = new StellarSdk.TransactionBuilder(source, { timebounds: { minTime: this.minimumUnlockTime, maxTime: this.maximumTime } })
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 0,
              lowThreshold: 1,
              medThreshold: 1,
              highThreshold: 1
            }))
            .addOperation(StellarSdk.Operation.accountMerge({
              destination: this.destAccount.publicKey
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
        .then(() => {
          console.log('8. Unlock transaction built');
          console.log('Unlock XDR', this.unlockXDR);
          this.tasks.buildUnlock.status = true;
          this.tasks.buildUnlock.active = false;
          this.tasks.buildUnlock.completed = true;
          this.logs.push('Building Unlock Transaction Successful');
          return Promise.resolve('success');
        })
        .catch((error) => {
          console.error('Something went wrong!', error);
          this.tasks.buildUnlock.status = false;
          this.tasks.buildUnlock.active = false;
          this.tasks.buildUnlock.completed = true;
          return Promise.reject(error);
        });
    } catch (error) {
      console.error('Something went wrong!', error);
      this.tasks.buildUnlock.status = false;
      this.tasks.buildUnlock.active = false;
      this.tasks.buildUnlock.completed = true;
    }

  }

  buildRecoveryTransaction() {
    try {
      console.log('9. building recovery transaction ... ');
      this.logs.push('Building Recovery Transaction');
      this.tasks.buildRecovery.active = true;
      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const escrowSourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);
      const destSourceKeys = StellarSdk.Keypair.fromSecret(this.destAccount.privateKey);

      return server.loadAccount(this.escrowAccount.publicKey)
        .catch((error) => {
          console.error(error);
          throw new Error('The escrow account does not exist!');
        })
        .then((source) => {
          this.currentTime = moment().unix();
          console.log('CT: ', this.currentTime);

          this.minimumRecoveryTime = this.currentTime + this.recoverAfter;
          console.log('RT: ', this.minimumRecoveryTime);

          // Start building the transaction.
          let transaction = new StellarSdk.TransactionBuilder(source, {
            timebounds: { minTime: this.minimumRecoveryTime, maxTime: this.maximumTime }
          })
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 1, // might not be necessary, weight is already 1
              lowThreshold: 1,
              medThreshold: 1,
              highThreshold: 1,
              signer: { ed25519PublicKey: this.destAccount.publicKey, weight: 0 }
            }))
            .addOperation(StellarSdk.Operation.accountMerge({
              destination: this.srcAccount.publicKey
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
        .then(() => {
          console.log('8. Recovery transaction built');
          console.log('Recovery XDR', this.recoveryXDR);
          this.tasks.buildRecovery.status = true;
          this.tasks.buildRecovery.active = false;
          this.tasks.buildRecovery.completed = true;
          this.logs.push('Building Recovery Transaction Success');
          return Promise.resolve('success');
        })
        .catch((error) => {
          console.error('Something went wrong!', error);
          this.tasks.buildRecovery.status = false;
          this.tasks.buildRecovery.active = false;
          this.tasks.buildRecovery.completed = true;
          return Promise.reject(error);
        });
    } catch (error) {
      console.error('Something went wrong!', error);
      this.tasks.buildRecovery.status = false;
      this.tasks.buildRecovery.active = false;
      this.tasks.buildRecovery.completed = true;

    }
  }

  fundEscrow() {
    try {
      console.log('Funding Escrow ... ');
      this.logs.push('Funding Escrow');
      this.tasks.fundEscrow.active = true;
      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const sourceKeys = StellarSdk.Keypair.fromSecret(this.srcAccount.privateKey);

      return server.loadAccount(this.srcAccount.publicKey)
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
              amount: this.escrowAmount
            }))
            .addMemo(StellarSdk.Memo.text('Test Transaction'))
            .build();
          transaction.sign(sourceKeys);
          return server.submitTransaction(transaction);
        })
        .then((result) => {
          console.log('Success! Results:', result);
          console.log('Escrow Funded ');
          this.tasks.fundEscrow.status = true;
          this.tasks.fundEscrow.active = false;
          this.tasks.fundEscrow.completed = true;
          this.logs.push('Funding Escrow Success');
          this.totalSent = this.totalSent + Number(this.escrowAmount);
          return Promise.resolve('success');
        })
        .catch((error) => {
          console.error('Something went wrong!', error);
          this.tasks.fundEscrow.status = false;
          this.tasks.fundEscrow.active = false;
          this.tasks.fundEscrow.completed = true;
          return Promise.reject(error);
        });
    } catch (error) {
      console.error('Something went wrong!', error);
      this.tasks.fundEscrow.status = false;
      this.tasks.fundEscrow.active = false;
      this.tasks.fundEscrow.completed = true;
    }

  }

  async runUnlockTx() {

    try {
      this.logs.push('Attempting to unlock funds');
      this.tasks.runUnlock.active = true;

      // check if unlock interval period is active,
      if (moment().unix() >= this.minimumUnlockTime) {
        console.log('Starting unlock period ...');
        this.logs.push('Unlock period started. Escrow funds can be released');
        // clearInterval(this.unlockInterval);
        const tx = await this.runTx(this.unlockXDR);
        if (!tx) {
          throw new Error('Unable to unlock funds');
        }
        this.tasks.runUnlock.active = false;
        this.tasks.runUnlock.completed = true;
        this.tasks.runUnlock.status = true;
        this.logs.push('Funds Unlocked');

      } else {
        this.logs.push('Unlock period in not yet active, cant claim funds');
        this.tasks.runUnlock.active = false;
        this.tasks.runUnlock.completed = true;
        this.tasks.runUnlock.status = false;

      }
    } catch (error) {
      this.tasks.runUnlock.active = false;
      this.tasks.runUnlock.completed = true;
      this.tasks.runUnlock.status = false;

    }
  }

  async runRecoveryTx() {
    try {
      this.logs.push('Attempting to recover funds');
      this.tasks.runRecovery.active = true;

      if (moment().unix() >= this.minimumRecoveryTime) {
        console.log('Starting recovery period ...');
        this.logs.push('Recovery period started. Escrow funds can be recovered if unclaimed');
        // clearInterval(this.recoveryInterval);
        const tx = await this.runTx(this.recoveryXDR);
        if (!tx) {
          throw new Error('Unable to recover funds');
        }
        this.tasks.runRecovery.active = false;
        this.tasks.runRecovery.completed = true;
        this.tasks.runRecovery.status = true;
        this.logs.push('Funds Recovered');
      } else {
        this.logs.push('Recovery period in not yet active, cant claim funds');
        this.tasks.runRecovery.active = false;
        this.tasks.runRecovery.completed = true;
        this.tasks.runRecovery.status = false;
      }
    } catch (error) {
      this.tasks.runRecovery.active = false;
      this.tasks.runRecovery.completed = true;
      this.tasks.runRecovery.status = false;
    }


  }

  runTx(xdrString) {
    console.log('Submitting transaction ... ');
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const transaction = new StellarSdk.Transaction(xdrString);

    // submit transaction to network
    return server.submitTransaction(transaction)
      .then(function (result) {
        console.log('Success! Results:', result);
        return Promise.resolve('success');
      })
      .catch(function (error) {
        console.log(error);
        throw new Error('TxError');
      })
      .catch(function (error) {
        console.error('Something went wrong at the end\n', error);
        return Promise.reject(error)
      });
  }

  addDelay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  generateAccount(fedName) {
    const pair = StellarSdk.Keypair.random();
    return { publicKey: pair.publicKey(), privateKey: pair.secret(), fedName: `${fedName}*stellar.org` };
  }


}
