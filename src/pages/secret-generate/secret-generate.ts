import { ChangeDetectorRef, Component, ViewChild, RendererFactory2, Renderer2 } from '@angular/core'
import { NavController, Platform } from 'ionic-angular'
import { SecretRulesPage } from '../secret-rules/secret-rules'
import { Secret } from '../../models/secret'
import { CameraNativeService } from '../../providers/camera/camera.native.service'
import { AudioNativeService } from '../../providers/audio/audio.native.service'
import { EntropyService } from '../../providers/entropy/entropy.service'
import { GyroscopeNativeService } from '../../providers/gyroscope/gyroscope.native.service'
import { TouchEntropyComponent } from '../../components/touch-entropy/touch-entropy'
import { AndroidPermissions } from '@ionic-native/android-permissions'

declare var window: any

@Component({
  selector: 'secret-generate',
  templateUrl: 'secret-generate.html'
})

export class SecretGeneratePage {

  private renderer: Renderer2

  @ViewChild('touchEntropy')
  touchEntropy: TouchEntropyComponent

  entropy = {
    isFull: false
  }

  constructor(
    private navController: NavController,
    public gyroService: GyroscopeNativeService,
    public entropyService: EntropyService,
    public cameraService: CameraNativeService,
    public audioService: AudioNativeService,
    private platform: Platform,
    private changeDetectorRef: ChangeDetectorRef,
    private androidPermissions: AndroidPermissions,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null)
  }

  ionViewWillEnter() {
    this.cameraService.viewWillEnter()
    this.injectCSS()
    this.platform.ready()
      .then(result => {
        console.log('checking permissions')
        return this.checkPermissions()
      })
      .then(permissions => {
        console.log(permissions)
        let requests = []

        if (!permissions[0].hasPermission) {
          requests.push(this.androidPermissions.PERMISSION.CAMERA)
        }

        if (!permissions[1].hasPermission) {
          requests.push(this.androidPermissions.PERMISSION.RECORD_AUDIO)
        }

        if (requests.length === 0) {
          return Promise.resolve()
        }

        return this.androidPermissions.requestPermissions(requests)
      }).then(result => {
        console.log(result)
        this.initEntropy()
      })
      .catch(error => {
        // we are not on cordova, so permissions do not matter
        if (error === 'cordova_not_available') {
          return this.initEntropy()
        }

        // we got a permission denied, requesting them again
        console.warn('permissions missing')
        console.warn(error)
      })
  }

  private injectCSS() {
    // inject css to html, body, .ion-app, ion-content
    this.renderer.addClass(document.body, 'hide-tabbar')
  }

  private uninjectCSS() {
    // removes injected css
    this.renderer.removeClass(document.body, 'hide-tabbar')
  }

  checkPermissions(): Promise<any> {
    return Promise.all([
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA),
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO)
    ])
  }

  initEntropy() {
    this.entropyService.addEntropySource(this.cameraService)
    this.entropyService.addEntropySource(this.audioService)
    this.entropyService.addEntropySource(this.gyroService)
    this.entropyService.addEntropySource(this.touchEntropy)
    this.entropyService.startEntropyCollection().then(() => {
      this.entropyService.getEntropyUpdateObservable().subscribe(() => {
        this.checkEntropy()
      })
    })
  }

  checkEntropy() {
    this.changeDetectorRef.detectChanges()
    if (Math.min(100, this.audioService.getCollectedEntropyPercentage()) + Math.min(100, this.cameraService.getCollectedEntropyPercentage()) + Math.min(100, this.gyroService.getCollectedEntropyPercentage()) + Math.min(100, this.touchEntropy.getCollectedEntropyPercentage()) >= 400) {
      this.entropy.isFull = true
    }
  }

  ionViewWillLeave() {
    this.uninjectCSS()
  }

  ionViewDidLeave() {
    this.cameraService.viewDidLeave()
    this.uninjectCSS()
    this.entropyService.stopEntropyCollection()
  }

  goToSecretRulesPage() {
    this.entropyService.getEntropyAsHex().then(hashHex => {
      let secret = new Secret(hashHex)
      this.navController.push(SecretRulesPage, { secret: secret })
    })
  }
}
