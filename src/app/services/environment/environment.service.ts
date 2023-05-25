import { Inject, Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'
import { BehaviorSubject, Observable } from 'rxjs'
import { EnvironmentPlugin } from 'src/app/capacitor-plugins/definitions'
import { ENVIRONMENT_PLUGIN } from 'src/app/capacitor-plugins/injection-tokens'

export type EnvironmentContext = 'empty' | 'knox'

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private readonly context$: BehaviorSubject<EnvironmentContext> = new BehaviorSubject<EnvironmentContext>('empty')

  constructor(
    @Inject(ENVIRONMENT_PLUGIN) private readonly environment: EnvironmentPlugin,
    private readonly platform: Platform
  ) {
    if (this.platform.is('hybrid')) {
      this.environment.addListener('envContextChanged', ({ context }) => {
        this.context$.next(context)
      })
    }
  }

  public getContextObservable(): Observable<EnvironmentContext> {
    return this.context$.asObservable()
  }
}