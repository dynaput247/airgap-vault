import { Component } from '@angular/core'
import { IonicPage, NavController } from 'ionic-angular'
import { BIP39Signer } from '../../models/BIP39Signer'
import { SecretEditPage } from '../secret-edit/secret-edit'
import { Secret } from '../../models/secret'
import { FormGroup, Validators, FormBuilder } from '@angular/forms'
import { MnemonicValidator } from '../../validators/mnemonic.validator'

const signer = new BIP39Signer()

/**
 * Generated class for the SecretImportPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-secret-import',
  templateUrl: 'secret-import.html'
})
export class SecretImportPage {

  readonly mnemonic: string
  secretImportForm: FormGroup

  constructor(public navController: NavController, private formBuilder: FormBuilder) {

    let formGroup = {
      mnemonic: ['', Validators.compose([Validators.required, MnemonicValidator.isValid])]
    }

    this.secretImportForm = this.formBuilder.group(formGroup)

  }

  goToSecretCreatePage() {
    let secret = new Secret(signer.mnemonicToEntropy(this.mnemonic.trim()))
    this.navController.push(SecretEditPage, { secret: secret, isGenerating: true })
  }

}
