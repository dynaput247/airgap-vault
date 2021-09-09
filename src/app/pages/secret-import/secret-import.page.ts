import { Component } from '@angular/core'
import { AlertController } from '@ionic/angular'

import { BIPSigner } from '../../models/BIP39Signer'
import { MnemonicSecret } from '../../models/secret'
import { DeviceService } from '../../services/device/device.service'
import { ErrorCategory, handleErrorLocal } from '../../services/error-handler/error-handler.service'
import { NavigationService } from '../../services/navigation/navigation.service'

import * as bip39 from 'bip39'
import { Observable, Subject } from 'rxjs'
import { map } from 'rxjs/operators'

type SingleWord = string

@Component({
  selector: 'airgap-secret-import',
  templateUrl: './secret-import.page.html',
  styleUrls: ['./secret-import.page.scss']
})
export class SecretImportPage {
  public secretWords: string[] = []
  public secretWordsValid: Observable<boolean>
  public selectedWordIndex: number = 0
  public selectedWord: string = ''

  public maskWords: boolean = false

  public wordList: SingleWord[] = bip39.wordlists.EN as any

  public lastWordOptions: string[] = []

  public setWordEmitter: Subject<string> = new Subject()

  constructor(
    private readonly deviceService: DeviceService,
    private readonly navigationService: NavigationService,
    private readonly alertController: AlertController
  ) {
    this.secretWordsValid = this.setWordEmitter.pipe(
      map(() => {
        return this.isValid()
      })
    )
  }

  selectWord(index: number) {
    console.log(index)
    this.selectedWordIndex = index
    this.selectedWord = this.secretWords[this.selectedWordIndex]

    if (this.selectedWordIndex === 0 && !this.selectedWord) {
      this.selectedWordIndex = -1
    }

    this.setWordEmitter.next(this.selectedWord ?? '')
  }

  wordSelected(word: string | undefined) {
    if (typeof word === 'undefined') {
      if (this.selectedWordIndex >= 0) {
        this.secretWords.splice(this.selectedWordIndex, 1)
        this.selectWord(Math.max(this.selectedWordIndex - 1, 0))
      } else if (this.selectedWordIndex === -1) {
        this.selectWord(this.secretWords.length - 1)
      }
      return
    }

    if (this.selectedWordIndex === -1) {
      this.secretWords.push(word)
    } else {
      this.secretWords[this.selectedWordIndex] = word
    }

    this.selectedWordIndex = -1
    this.selectedWord = ''

    this.getLastWord()

    this.setWordEmitter.next(this.selectedWord ?? '')
  }

  public ionViewDidEnter(): void {
    this.deviceService.enableScreenshotProtection({ routeBack: 'secret-setup' })
  }

  public ionViewWillLeave(): void {
    this.deviceService.disableScreenshotProtection()
  }

  public isValid(): boolean {
    return BIPSigner.validateMnemonic(this.secretWords.join(' '))
  }

  public goToSecretSetupPage(): void {
    const signer: BIPSigner = new BIPSigner()
    const secret: MnemonicSecret = new MnemonicSecret(signer.mnemonicToEntropy(BIPSigner.prepareMnemonic(this.secretWords.join(' '))))
    this.navigationService.routeWithState('secret-add', { secret }).catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
  }

  public async paste(text: string | undefined) {
    if (BIPSigner.validateMnemonic(text)) {
      this.secretWords = text.split(' ')
      this.selectedWordIndex = -1
      this.selectedWord = ''
      this.setWordEmitter.next(this.selectedWord ?? '')
    } else {
      const alert = await this.alertController.create({
        header: 'Invalid Mnemonic',
        message: 'The text in your clipboard is not a valid mnemonic.',
        backdropDismiss: false,
        buttons: [
          {
            text: 'Ok'
          }
        ]
      })
      alert.present()
    }
  }

  public async mask(enabled: boolean) {
    this.maskWords = enabled
  }

  public getLastWord() {
    const options = []
    if (this.secretWords.length === 23) {
      // The last word is 3 bits entropy and 8 bits checksum of the entropy. But because there are only 2048 words, it's fast to just try all combinations and the code is a lot easier, so we do that.
      for (const word of bip39.wordlists.EN) {
        if (bip39.validateMnemonic([...this.secretWords, word].join(' '))) {
          options.push(word)
          console.log('LAST WORD', word)
        }
      }
    }
    this.lastWordOptions = options
  }
}
