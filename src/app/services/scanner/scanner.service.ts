import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'

declare var QRScanner: any

@Injectable({
  providedIn: 'root'
})
export class ScannerService {
  public isShowing: boolean = false

  constructor(private readonly platform: Platform) {}

  public askForPermission(): void {
    if (this.platform.is('hybrid')) {
      QRScanner.openSettings()
    }
  }

  public hasPermission(): Promise<boolean[]> {
    if (this.platform.is('hybrid')) {
      return new Promise((resolve, reject) => {
        const onDone = (err, status) => {
          if (err) {
            // here we can handle errors and clean up any loose ends.
            console.error('Scanner permission ', err)
            reject([false, false])
          }
          if (status.authorized) {
            console.log('Scanner permission granted')
            resolve([true, true])
          } else if (status.denied) {
            console.warn('Scanner permission denied')
            reject([false, true])
            // The video preview will remain black, and scanning is disabled. We can
            // try to ask the user to change their mind, but we'll have to send them
            // to their device settings with `QRScanner.openSettings()`.
          } else {
            console.warn('Scanner permission denied')
            reject([false, false])
            // we didn't get permission, but we didn't get permanently denied. (On
            // Android, a denial isn't permanent unless the user checks the "Don't
            // ask again" box.) We can ask again at the next relevant opportunity.
          }
        }
        QRScanner.prepare(onDone)
      })
    } else {
      throw new Error('Permission status can only be requested on native devices')
    }
  }

  public scan(successCallback: (text: string) => void, errorCallback: ((text: string) => void) | null = null) {
    const scanCallback = (err, text) => {
      if (err) {
        console.error('Scanner scan error', err)
        if (errorCallback) {
          errorCallback(err)
        }
      }

      console.log('Scanner scan success', text)
      successCallback(text)
    }

    QRScanner.scan(scanCallback)
  }

  public show() {
    if (this.platform.is('hybrid')) {
      if (this.isShowing) {
        return
      }
      this.isShowing = true
      QRScanner.show()
    }
  }

  public stopScan() {
    if (this.platform.is('hybrid')) {
      QRScanner.cancelScan(null)
    }
  }

  public destroy() {
    if (this.platform.is('hybrid')) {
      this.isShowing = false
      QRScanner.destroy()
    }
  }
}
