import { Component } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { ErrorCategory, handleErrorLocal } from 'src/app/services/error-handler/error-handler.service'
import { VaultStorageKey, VaultStorageService } from 'src/app/services/storage/storage.service'

@Component({
  selector: 'airgap-isolated-modules-onboarding-page',
  templateUrl: './isolated-modules-onboarding.page.html',
  styleUrls: ['./isolated-modules-onboarding.page.scss']
})
export class IsolatedModulesOnboardingPage {
  constructor(private readonly storageSerivce: VaultStorageService, private readonly modalController: ModalController) {
  }

  public back() {
    this.modalController.dismiss().catch(handleErrorLocal(ErrorCategory.IONIC_MODAL))
  }

  public async acknowledge() {
    await this.storageSerivce.set(VaultStorageKey.ISOLATED_MODULES_ONBOARDING_DISABLED, true).catch(handleErrorLocal(ErrorCategory.SECURE_STORAGE))

    this.modalController.dismiss().catch(handleErrorLocal(ErrorCategory.IONIC_MODAL))
  }
}
