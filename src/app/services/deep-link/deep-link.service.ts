import { Injectable, Inject } from '@angular/core'
import { AppPlugin } from '@capacitor/core'
import { AlertController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { first } from 'rxjs/operators'

import { serializedDataToUrlString } from '../../utils/utils'
import { ErrorCategory, handleErrorLocal } from '../error-handler/error-handler.service'
import { APP_PLUGIN } from '../..//capacitor-plugins/injection-tokens'

@Injectable({
  providedIn: 'root'
})
export class DeepLinkService {
  constructor(
    private readonly alertCtrl: AlertController,
    private readonly translateService: TranslateService,
    @Inject(APP_PLUGIN) private readonly app: AppPlugin
  ) {}

  public sameDeviceDeeplink(url: string = 'airgap-wallet://'): Promise<void> {
    const deeplinkUrl: string = url.includes('://') ? url : serializedDataToUrlString(url)

    return new Promise((resolve, reject) => {
      this.app
        .openUrl({ url: deeplinkUrl })
        .then(() => {
          console.log('Deeplink called')
          resolve()
        })
        .catch((error) => {
          console.error('deeplink used', deeplinkUrl)
          console.error(error)
          this.showAppNotFoundAlert()

          reject()
        })
    })
  }

  public showDeeplinkOnlyOnDevicesAlert(): void {
    this.translateService
      .get(['deep-link.not-supported-alert.title', 'deep-link.not-supported-alert.message', 'deep-link.not-supported-alert.ok'])
      .pipe(first())
      .subscribe(async (translated: string[]) => {
        const alert: HTMLIonAlertElement = await this.alertCtrl.create({
          header: translated['deep-link.not-supported-alert.title'],
          message: translated['deep-link.not-supported-alert.message'],
          backdropDismiss: false,
          buttons: [
            {
              text: translated['deep-link.not-supported-alert.ok'],
              role: 'cancel'
            }
          ]
        })
        alert.present().catch(handleErrorLocal(ErrorCategory.IONIC_ALERT))
      })
  }

  public showAppNotFoundAlert(): void {
    this.translateService
      .get(['deep-link.app-not-found.title', 'deep-link.app-not-found.message', 'deep-link.app-not-found.ok'], {
        otherAppName: 'AirGap Wallet'
      })
      .subscribe(async (translated: string[]) => {
        const alert: HTMLIonAlertElement = await this.alertCtrl.create({
          header: translated['deep-link.app-not-found.title'],
          message: translated['deep-link.app-not-found.message'],
          backdropDismiss: false,
          buttons: [
            {
              text: translated['deep-link.app-not-found.ok'],
              role: 'cancel'
            }
          ]
        })
        alert.present().catch(handleErrorLocal(ErrorCategory.IONIC_ALERT))
      })
  }
}
