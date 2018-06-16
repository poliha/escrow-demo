import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'

import { AppComponent } from './app.component';
import { EscrowComponent } from './pages/escrow/escrow.component';
import { AccountDetailComponent } from './pages/account-detail/account-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    EscrowComponent,
    AccountDetailComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
