import { DeeplinkService } from '@airgap/angular-core'
import { Injectable } from '@angular/core'
import { AirGapWallet, UnsignedTransaction, MessageSignResponse } from '@airgap/coinlib-core'

import { Secret } from '../../models/secret'
import { assertNever } from '../../utils/utils'
import { ErrorCategory, handleErrorLocal } from '../error-handler/error-handler.service'
import { NavigationService } from '../navigation/navigation.service'

export enum InteractionSetting {
  UNDETERMINED = 'undetermined',
  ALWAYS_ASK = 'always',
  SAME_DEVICE = 'same_device',
  OFFLINE_DEVICE = 'offline_device'
}

export enum InteractionCommunicationType {
  QR = 'qr',
  DEEPLINK = 'deeplink'
}

export enum InteractionOperationType {
  WALLET_SYNC = 'walletSync',
  TRANSACTION_BROADCAST = 'transactionBroadcast',
  MESSAGE_SIGN_REQUEST = 'messageSignRequest'
}

export interface IInteractionOptions {
  operationType: InteractionOperationType
  url: string
  communicationType?: InteractionCommunicationType
  signedTxs?: string[]
  wallets?: AirGapWallet[]
  transactions?: UnsignedTransaction[]
  messageSignResponse?: MessageSignResponse
}

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  constructor(private readonly navigationService: NavigationService, private readonly deepLinkService: DeeplinkService) {}

  public startInteraction(interactionOptions: IInteractionOptions, secret: Secret): void {
    const interactionSetting: InteractionSetting = secret.interactionSetting

    if (interactionOptions.communicationType) {
      if (interactionSetting === InteractionSetting.UNDETERMINED) {
        this.goToInteractionSelectionSettingsPage(interactionOptions)
      }
      if (interactionOptions.communicationType === InteractionCommunicationType.DEEPLINK) {
        this.startDeeplink(interactionOptions.url)
      } else if (interactionOptions.communicationType === InteractionCommunicationType.QR) {
        this.navigateToPageByOperationType(interactionOptions)
      }
    } else {
      switch (interactionSetting) {
        case InteractionSetting.UNDETERMINED:
          this.goToInteractionSelectionPage(interactionOptions)
          break
        case InteractionSetting.ALWAYS_ASK:
          this.goToInteractionSelectionPage(interactionOptions)
          break
        case InteractionSetting.SAME_DEVICE:
          this.startDeeplink(interactionOptions.url)
          break
        case InteractionSetting.OFFLINE_DEVICE:
          this.navigateToPageByOperationType(interactionOptions)
          break
        default:
      }
    }
  }

  private goToInteractionSelectionPage(interactionOptions: IInteractionOptions): void {
    this.navigationService
      .routeWithState('/interaction-selection', { interactionOptions })
      .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
  }

  private goToInteractionSelectionSettingsPage(interactionOptions: IInteractionOptions): void {
    this.navigationService
      .routeWithState('/interaction-selection-settings', { interactionOptions })
      .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
  }

  private navigateToPageByOperationType(interactionOptions: IInteractionOptions): void {
    if (interactionOptions.operationType === InteractionOperationType.WALLET_SYNC) {
      this.navigationService
        .routeWithState('/account-share', { interactionUrl: interactionOptions.url })
        .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
    } else if (interactionOptions.operationType === InteractionOperationType.TRANSACTION_BROADCAST) {
      this.navigationService
        .routeWithState('/transaction-signed', {
          interactionUrl: interactionOptions.url,
          wallets: interactionOptions.wallets,
          signedTxs: interactionOptions.signedTxs,
          transactions: interactionOptions.transactions,
          translationKey: 'transaction-signed'
        })
        .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
    } else if (interactionOptions.operationType === InteractionOperationType.MESSAGE_SIGN_REQUEST) {
      console.log('messageSignResponse', interactionOptions.messageSignResponse)
      this.navigationService
        .routeWithState('/transaction-signed', {
          interactionUrl: interactionOptions.url,
          translationKey: 'message-signing-request',
          messageSignResponse: interactionOptions.messageSignResponse
        })
        .catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
    } else {
      return assertNever('INVALID_OPERATION_TYPE', interactionOptions.operationType)
    }
  }

  private startDeeplink(url: string): void {
    this.deepLinkService
      .sameDeviceDeeplink(url)
      .then(() => {
        this.navigationService.routeToAccountsTab().catch(handleErrorLocal(ErrorCategory.IONIC_NAVIGATION))
      })
      .catch(handleErrorLocal(ErrorCategory.DEEPLINK_SERVICE))
  }
}
