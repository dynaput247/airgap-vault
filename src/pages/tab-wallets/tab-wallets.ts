import { Component } from '@angular/core'
import { IonicPage, NavController, NavParams } from 'ionic-angular'
import { WalletAddressPage } from '../wallet-address/wallet-address'
import { SecretsProvider } from '../../providers/secrets/secrets.provider'
import { WalletSelectCoinsPage } from '../wallet-select-coins/wallet-select-coins'
import { Secret } from '../../models/secret'
import { AirGapWallet } from 'airgap-coin-lib'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

/**
 * Generated class for the TabWalletsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-tab-wallets',
  templateUrl: 'tab-wallets.html'
})
export class TabWalletsPage {

  symbolFilter: string
  activeSecret: Secret

  public wallets = new BehaviorSubject<AirGapWallet[]>([])

  constructor(public navController: NavController, public navParams: NavParams, private secretsProvider: SecretsProvider) {

  }

  ionViewDidEnter() {
    if (this.secretsProvider.getActiveSecret()) {
      this.activeSecret = this.secretsProvider.getActiveSecret()
      this.wallets.next(this.activeSecret.wallets)
    }
  }

  onSecretChanged(secret: Secret) {
    this.activeSecret = secret
    this.wallets.next(this.activeSecret.wallets)
  }

  goToReceiveAddress(wallet: AirGapWallet) {
    this.navController.push(WalletAddressPage, { wallet: wallet })
  }

  filterItems(ev: any) {
    let val = ev.target.value
    if (val && val !== '') {
      val = val.trim().toLowerCase()
      this.symbolFilter = val
    } else {
      this.symbolFilter = null
    }
  }

  addWallet() {
    this.navController.push(WalletSelectCoinsPage)
  }
}
