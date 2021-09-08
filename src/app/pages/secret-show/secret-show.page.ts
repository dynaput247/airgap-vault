import { Component } from '@angular/core'
import { AlertController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { first } from 'rxjs/operators'

import { SHOW_SECRET_MIN_TIME_IN_SECONDS } from '../../constants/constants'
import { MnemonicSecret } from '../../models/secret'
import { DeviceService } from '../../services/device/device.service'
import { ErrorCategory, handleErrorLocal } from '../../services/error-handler/error-handler.service'
import { NavigationService } from '../../services/navigation/navigation.service'

@Component({
  selector: 'airgap-secret-show',
  templateUrl: './secret-show.page.html',
  styleUrls: ['./secret-show.page.scss']
})
export class SecretShowPage {
  public readonly secret: MnemonicSecret
  public readonly startTime: Date = new Date()

  constructor(
    private readonly deviceService: DeviceService,
    private readonly navigationService: NavigationService,
    private readonly alertController: AlertController,
    private readonly translateService: TranslateService
  ) {
    this.secret = this.navigationService.getState().secret
  }

  public ionViewDidEnter(): void {
    this.deviceService.enableScreenshotProtection({ routeBack: 'secret-setup' })
  }

  public ionViewWillLeave(): void {
    this.deviceService.disableScreenshotProtection()
  }

  public goToValidateSecret(): void {
    if (this.startTime.getTime() + SHOW_SECRET_MIN_TIME_IN_SECONDS * 1000 > new Date().getTime()) {
      this.translateService
        .get([
          'secret-show.too-fast_alert.title',
          'secret-show.too-fast_alert.heading',
          'secret-show.too-fast_alert.text',
          'secret-show.too-fast_alert.wait_label_p1',
          'secret-show.too-fast_alert.wait_label_p2'
        ])
        .pipe(first())
        .subscribe(async (values: string[]) => {
          const title: string = values['secret-show.too-fast_alert.title']
          const heading: string = values['secret-show.too-fast_alert.heading']
          const text: string = values['secret-show.too-fast_alert.text']
          const waitLabelP1: string = values['secret-show.too-fast_alert.wait_label_p1']
          const waitLabelP2: string = values['secret-show.too-fast_alert.wait_label_p2']

          const alert: HTMLIonAlertElement = await this.alertController.create({
            header: title,
            message: [
              heading,
              '<br/>',
              text,
              '<br/>',
              waitLabelP1,
              '<strong>',
              SHOW_SECRET_MIN_TIME_IN_SECONDS.toString(),
              waitLabelP2,
              '</strong>'
            ].join(''),
            buttons: ['Okay']
          })
          alert.present().catch(handleErrorLocal(ErrorCategory.IONIC_ALERT))
        })
    } else {
      this.navigationService
        .routeWithState('secret-validate', { secret: this.secret })
        .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
    }
  }
}
