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

  assetCode = 'NGN';
  startingBalance = '10';
  escrowAmount = '2';
  escrowStartingBalance = '3';
  totalSent = 0;
  minimumUnlockTime = 0;
  minimumRecoveryTime = 0;
  maximumTime = 0;
  unlockAfter = 200;
  recoverAfter = 300;
  unlockXDR = '';
  recoveryXDR = '';
  unlockInterval: any;
  recoveryInterval: any;
  currentTime: any;
  automateProcess = false;

  tasks = {
    generateKeypairs: { active: false, status: false, completed: false },
    createAccounts: { active: false, status: false, completed: false },
    enableMultisig: { active: false, status: false, completed: false },
    buildUnlock: { active: false, status: false, completed: false },
    buildRecovery: { active: false, status: false, completed: false },
    fundEscrow: { active: false, status: false, completed: false },
    runUnlock: { active: false, status: false, completed: false },
    runRecovery: { active: false, status: false, completed: false },
    raiseDispute: { active: false, status: false, completed: false },
    paySource: { active: false, status: false, completed: false },
    payTarget: { active: false, status: false, completed: false },
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
    this.logs.push('Waiting for configuration');
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
      .then((result) => {
        this.tasks.createAccounts.active = false;
        this.tasks.createAccounts.completed = true;
        this.tasks.createAccounts.status = true;
        this.logs.push('Create accounts success');
        return Promise.resolve('Success');
      })
      .catch((error) => {
        this.tasks.createAccounts.active = false;
        this.tasks.createAccounts.completed = true;
        this.tasks.createAccounts.status = false;
        return Promise.reject(error);
      });
  }

  enableMultisig() {

    try {
      this.logs.push('Enabling Multisig...');
      this.tasks.enableMultisig.active = true;

      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const sourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);

      return server.loadAccount(this.escrowAccount.publicKey)
        .catch((error) => {
          throw new Error('The escrow account does not exist!');
        })
        .then((source) => {
          // Start building the transaction.
          let transaction = new StellarSdk.TransactionBuilder(source)
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 2, // masterweight is set to 2 here so it is still the only signature needed for adding another signer
              lowThreshold: 2,
              medThreshold: 2,
              highThreshold: 2,
              signer: { ed25519PublicKey: this.destAccount.publicKey, weight: 1 }
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              medThreshold: 3,  // payments will need to be authorised by escrow and one other party
              signer: { ed25519PublicKey: this.srcAccount.publicKey, weight: 1 }
            }))
            .addMemo(StellarSdk.Memo.text('Test Transaction'))
            .build();
          transaction.sign(sourceKeys);
          return server.submitTransaction(transaction);
        })
        .then((result) => {

          this.tasks.enableMultisig.status = true;
          this.tasks.enableMultisig.active = false;
          this.tasks.enableMultisig.completed = true;
          this.logs.push('Multisig enabled');
          return Promise.resolve('success');
        })
        .catch((error) => {
          this.tasks.enableMultisig.status = false;
          this.tasks.enableMultisig.active = false;
          this.tasks.enableMultisig.completed = true;
          return Promise.reject(error);
        });
    } catch (error) {
      this.tasks.enableMultisig.status = false;
      this.tasks.enableMultisig.active = false;
      this.tasks.enableMultisig.completed = true;
    }


  }

  raiseDispute() {

    try {

      if(this.tasks.runUnlock.completed && this.tasks.runUnlock.status){
        alert('Funds already released. Please handle this manually');
        return;
      }

      if (this.tasks.runRecovery.completed && this.tasks.runRecovery.status) {
        alert('Funds already refunded. Please handle this manually');
        return;
      }

      if (!this.isFunded()) {
        this.logs.push('Escrow is not yet funded');
        return;
      }

      this.logs.push('Dispute raised, removing signers...');
      this.tasks.raiseDispute.active = true;

      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const sourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);

      return server.loadAccount(this.escrowAccount.publicKey)
        .catch((error) => {

          throw new Error('The escrow account does not exist!');
        })
        .then((source) => {
          // Start building the transaction.
          let transaction = new StellarSdk.TransactionBuilder(source)
            .addOperation(StellarSdk.Operation.setOptions({
              signer: { ed25519PublicKey: this.destAccount.publicKey, weight: 0 }
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 1, // revert to original state
              lowThreshold: 0,
              medThreshold: 0,
              highThreshold: 0,
              signer: { ed25519PublicKey: this.srcAccount.publicKey, weight: 0 }
            }))
            .addMemo(StellarSdk.Memo.text('Test Transaction'))
            .build();
          transaction.sign(sourceKeys);
          return server.submitTransaction(transaction);
        })
        .then((result) => {
          this.tasks.raiseDispute.status = true;
          this.tasks.raiseDispute.active = false;
          this.tasks.raiseDispute.completed = true;
          this.logs.push('Dispute raised: manual action required');
          return Promise.resolve('success');
        })
        .catch((error) => {
          this.tasks.raiseDispute.status = false;
          this.tasks.raiseDispute.active = false;
          this.tasks.raiseDispute.completed = true;
          return Promise.reject(error);
        });
    } catch (error) {
      this.tasks.raiseDispute.status = false;
      this.tasks.raiseDispute.active = false;
      this.tasks.raiseDispute.completed = true;
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
        if (this.unlockAfter <= 0) {
          this.unlockAfter = 0;
          clearInterval(this.unlockInterval);

          if (this.automateProcess) {
            this.runUnlockTx();
          }
        } else {
          this.unlockAfter--;
        }
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

        if (this.recoverAfter <= 0) {
          this.recoverAfter = 0;
          clearInterval(this.recoveryInterval);
          if (this.automateProcess) {
            this.runRecoveryTx();
          }

        } else {
          this.recoverAfter--;
        }
      }, 1000);

    } catch (error) {

    }
  }

  buildUnlockTransaction() {
    try {
      this.logs.push('Building Unlock Transaction');
      this.tasks.buildUnlock.active = true;

      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const escrowSourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);
      const destSourceKeys = StellarSdk.Keypair.fromSecret(this.destAccount.privateKey);

      return server.loadAccount(this.escrowAccount.publicKey)
        .catch((error) => {

          throw new Error('The escrow account does not exist!');
        })
        .then((source) => {
          this.currentTime = moment().unix();
          this.minimumUnlockTime = this.currentTime + Number(this.unlockAfter);

          // Start building the transaction.
          let transaction = new StellarSdk.TransactionBuilder(source, { timebounds: { minTime: this.minimumUnlockTime, maxTime: this.maximumTime } })
            .addOperation(StellarSdk.Operation.payment({
              destination: this.destAccount.publicKey,
              asset: StellarSdk.Asset.native(),
              amount:  this.escrowAmount
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              signer: { ed25519PublicKey: this.destAccount.publicKey, weight: 0 }
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 1, // revert to original state
              lowThreshold: 0,
              medThreshold: 0,
              highThreshold: 0,
              signer: { ed25519PublicKey: this.srcAccount.publicKey, weight: 0 }
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

          this.tasks.buildUnlock.status = true;
          this.tasks.buildUnlock.active = false;
          this.tasks.buildUnlock.completed = true;
          this.logs.push('Building Unlock Transaction Successful');
          return Promise.resolve('success');
        })
        .catch((error) => {

          this.tasks.buildUnlock.status = false;
          this.tasks.buildUnlock.active = false;
          this.tasks.buildUnlock.completed = true;
          return Promise.reject(error);
        });
    } catch (error) {
      this.tasks.buildUnlock.status = false;
      this.tasks.buildUnlock.active = false;
      this.tasks.buildUnlock.completed = true;
    }

  }

  buildRecoveryTransaction() {
    try {
      this.logs.push('Building Recovery Transaction');
      this.tasks.buildRecovery.active = true;
      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const escrowSourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);
      const srcSourceKeys = StellarSdk.Keypair.fromSecret(this.srcAccount.privateKey);

      return server.loadAccount(this.escrowAccount.publicKey)
        .catch((error) => {

          throw new Error('The escrow account does not exist!');
        })
        .then((source) => {
          this.currentTime = moment().unix();
          this.minimumRecoveryTime = this.currentTime + Number(this.recoverAfter);

          // Start building the transaction.
          let transaction = new StellarSdk.TransactionBuilder(source, {
              timebounds: { minTime: this.minimumRecoveryTime, maxTime: this.maximumTime }
            })
            .addOperation(StellarSdk.Operation.payment({
              destination: this.srcAccount.publicKey,
              asset: StellarSdk.Asset.native(),
              amount: this.escrowAmount
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              signer: { ed25519PublicKey: this.destAccount.publicKey, weight: 0 }
            }))
            .addOperation(StellarSdk.Operation.setOptions({
              masterWeight: 1, // revert to original state
              lowThreshold: 0,
              medThreshold: 0,
              highThreshold: 0,
              signer: { ed25519PublicKey: this.srcAccount.publicKey, weight: 0 }
            }))
            .addMemo(StellarSdk.Memo.text('Test Transaction'));
           
          // build and sign transaction
          // sign transactions by both escrow and destination
          // IDEA: maybe split the signing into two seperate events to depict how
          // this might be signed when you dont have access to the keys of both account.
          // i.e. convert to XDR during intermediate signing events.
          
          let builtTx = transaction.build();
          builtTx.sign(escrowSourceKeys, srcSourceKeys);
          this.recoveryXDR = builtTx.toEnvelope().toXDR().toString('base64');

        })
        .then(() => {
          this.tasks.buildRecovery.status = true;
          this.tasks.buildRecovery.active = false;
          this.tasks.buildRecovery.completed = true;
          this.logs.push('Building Recovery Transaction Success');
          return Promise.resolve('success');
        })
        .catch((error) => {
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

      if (this.isFunded()) {
        this.logs.push('Escrow is already funded');
        return;
      }

      this.logs.push('Funding Escrow');
      this.tasks.fundEscrow.active = true;
      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const sourceKeys = StellarSdk.Keypair.fromSecret(this.srcAccount.privateKey);

      return server.loadAccount(this.srcAccount.publicKey)
        .catch((error) => {
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
          this.tasks.fundEscrow.status = true;
          this.tasks.fundEscrow.active = false;
          this.tasks.fundEscrow.completed = true;
          this.logs.push('Funding Escrow Success');
          this.totalSent = this.totalSent + Number(this.escrowAmount);
          return Promise.resolve('success');
        })
        .catch((error) => {
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

      if (!this.isFunded()) {
        this.logs.push('Escrow is not yet funded');
        return;
      }
      
      this.logs.push('Attempting to unlock funds');
      this.tasks.runUnlock.active = true;
      await this.addDelay(2000);
      // check if unlock interval period is active,
      if (moment().unix() >= this.minimumUnlockTime) {
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

      if (!this.isFunded()) {
        this.logs.push('Escrow is not yet funded');
        return;
      }
      this.logs.push('Attempting to recover funds');
      this.tasks.runRecovery.active = true;
      await this.addDelay(2000);
      if (moment().unix() >= this.minimumRecoveryTime) {
        this.logs.push('Recovery period started. Escrow funds can be recovered if unclaimed');

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
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    const transaction = new StellarSdk.Transaction(xdrString);

    // submit transaction to network
    return server.submitTransaction(transaction)
      .then(function (result) {
        return Promise.resolve('success');
      })
      .catch(function (error) {
        throw new Error('TxError');
      })
      .catch(function (error) {
        console.error('Something went wrong at the end', error);
        return Promise.reject(error)
      });
  }

  buildDisputePayment(recipient) {
    try {
      this.logs.push('Processing payment ... ');
      StellarSdk.Network.useTestNetwork();
      const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
      const sourceKeys = StellarSdk.Keypair.fromSecret(this.escrowAccount.privateKey);

      return server.loadAccount(this.escrowAccount.publicKey)
        .catch((error) => {
          throw new Error('The source account does not exist!');
        })
        .then((source) => {
          // Start building the transaction.
          let transaction = new StellarSdk.TransactionBuilder(source)
            .addOperation(StellarSdk.Operation.payment({
              destination: recipient,
              asset: StellarSdk.Asset.native(),
              amount: this.escrowAmount
            }))
            .addMemo(StellarSdk.Memo.text('Test Transaction'));
          
          let builtTx = transaction.build();
          builtTx.sign(sourceKeys);
          
          return Promise.resolve(builtTx.toEnvelope().toXDR().toString('base64'));
        })
        .catch((error) => {

          return Promise.reject(error);
        });
    } catch (error) {
      console.error('Something went wrong!', error);
      return Promise.reject(error);
    }

  }

  async paySource() {
    try {
      this.logs.push('Attempting to pay Tunde');
      this.tasks.paySource.active = true;

      if (this.tasks.raiseDispute.status) {
        // clearInterval(this.recoveryInterval);
        const payXDR = await this.buildDisputePayment(this.srcAccount.publicKey);

        if (!payXDR) {
          this.logs.push('Unable to build transaction');
          throw new Error('Unable to recover funds');
        }

        const tx = await this.runTx(payXDR);
        if (!tx) {
          throw new Error('Unable to recover funds');
        }
        this.tasks.paySource.active = false;
        this.tasks.paySource.completed = true;
        this.tasks.paySource.status = true;
        this.logs.push('Funds returned to Tunde');
      } else {
        this.logs.push('Dispute not raised, please wait for recovery period to claim funds');
        this.tasks.paySource.active = false;
        this.tasks.paySource.completed = true;
        this.tasks.paySource.status = false;
      }
    } catch (error) {
      this.tasks.paySource.active = false;
      this.tasks.paySource.completed = true;
      this.tasks.paySource.status = false;
    }
  }

  async payTarget() {
    try {
      this.logs.push('Attempting to pay Car Delaer');
      this.tasks.payTarget.active = true;

      if (this.tasks.raiseDispute.status) {
        // clearInterval(this.recoveryInterval);
        const payXDR = await this.buildDisputePayment(this.destAccount.publicKey);

        if (!payXDR) {
          this.logs.push('Unable to build transaction');
          throw new Error('Unable to recover funds');
        }

        const tx = await this.runTx(payXDR);
        if (!tx) {
          throw new Error('Unable to recover funds');
        }
        this.tasks.payTarget.active = false;
        this.tasks.payTarget.completed = true;
        this.tasks.payTarget.status = true;
        this.logs.push('Funds released to Car Dealer');
      } else {
        this.logs.push('Dispute not raised, please wait for unlock period to claim funds');
        this.tasks.payTarget.active = false;
        this.tasks.payTarget.completed = true;
        this.tasks.payTarget.status = false;
      }
    } catch (error) {
      this.tasks.payTarget.active = false;
      this.tasks.payTarget.completed = true;
      this.tasks.payTarget.status = false;
    }
  }

  addDelay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  generateAccount(fedName) {
    const pair = StellarSdk.Keypair.random();
    return { publicKey: pair.publicKey(), privateKey: pair.secret(), fedName: `${fedName}*stellar.org` };
  }

  isFunded() {
    if (this.tasks.fundEscrow.completed && this.tasks.fundEscrow.status) {
      return true;
    }
    return false;
  }


}
