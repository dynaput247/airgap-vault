import { ProtocolService, SerializerService } from '@airgap/angular-core'
import { Component, Input } from '@angular/core'
import { IACMessageDefinitionObject, IAirGapTransaction, ICoinProtocol, SignedTransaction } from '@airgap/coinlib-core'
import BigNumber from 'bignumber.js'
import { TokenService } from 'src/app/services/token/TokenService'

@Component({
  selector: 'airgap-signed-transaction',
  templateUrl: './signed-transaction.component.html',
  styleUrls: ['./signed-transaction.component.scss']
})
export class SignedTransactionComponent {
  @Input()
  public signedTxs: IACMessageDefinitionObject[] | undefined // TODO: Type

  @Input()
  public syncProtocolString: string

  public airGapTxs: IAirGapTransaction[]
  public fallbackActivated: boolean = false
  public rawTxData: string
  public aggregatedInfo:
    | {
        numberOfTxs: number
        totalAmount: BigNumber
        totalFees: BigNumber
      }
    | undefined

  constructor(
    private readonly protocolService: ProtocolService,
    private readonly serializerService: SerializerService,
    private readonly tokenService: TokenService
  ) {
    //
  }

  public async ngOnChanges(): Promise<void> {
    if (this.syncProtocolString) {
      try {
        this.signedTxs = await this.serializerService.deserialize(this.syncProtocolString)
      } catch (err) {
        console.log('ERROR', err)
        this.fallbackActivated = true
        this.rawTxData = this.syncProtocolString
      }
    }

    if (this.signedTxs) {
      const protocol: ICoinProtocol = await this.protocolService.getProtocol(this.signedTxs[0].protocol, undefined, false)
      try {
        // tslint:disable-next-line:no-unnecessary-type-assertion
        this.airGapTxs = (
          await Promise.all(
            this.signedTxs.map((signedTx) => protocol.getTransactionDetailsFromSigned(signedTx.payload as SignedTransaction))
          )
        ).reduce((flatten, toFlatten) => flatten.concat(toFlatten))
        if (
          this.airGapTxs.length > 1 &&
          this.airGapTxs.every((tx: IAirGapTransaction) => tx.protocolIdentifier === this.airGapTxs[0].protocolIdentifier)
        ) {
          this.aggregatedInfo = {
            numberOfTxs: this.airGapTxs.length,
            totalAmount: this.airGapTxs.reduce((pv: BigNumber, cv: IAirGapTransaction) => pv.plus(cv.amount), new BigNumber(0)),
            totalFees: this.airGapTxs.reduce((pv: BigNumber, cv: IAirGapTransaction) => pv.plus(cv.fee), new BigNumber(0))
          }
        }
        try {
          if (this.airGapTxs.length !== 1) {
            throw Error('TokenTransferDetails returned more than 1 transaction!')
          }
          this.airGapTxs = [
            await this.tokenService.getTokenTransferDetailsFromSigned(this.airGapTxs[0], this.signedTxs[0].payload as SignedTransaction)
          ]
        } catch (error) {
          console.error('unable to parse token transaction, using ethereum transaction details instead')
        }

        this.fallbackActivated = false
      } catch (e) {
        this.fallbackActivated = true
        // tslint:disable-next-line:no-unnecessary-type-assertion
        this.rawTxData = (this.signedTxs[0].payload as SignedTransaction).transaction
      }
    }
  }
}
