import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty } from '@utils/helpers'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'

export const getWaterInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Water]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Water]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.price),
      amount: +toRoundFixed(+invoice.amount),
      lastAmount: +toRoundFixed(+invoice.lastAmount),
      sum: +toRoundFixed(
        +invoice.sum || +invoice.price * (+invoice.amount - +invoice.lastAmount)
      ),
    }
  }

  if (
    !isEmpty(service?.waterPrice) &&
    !isNaN(service.waterPrice) &&
    (!company?.waterPart || isNaN(company?.waterPart))
  ) {
    const prevWater = prevInvoicesCollection[ServiceType.Water]

    return {
      type: ServiceType.Water,
      amount: +toRoundFixed(prevWater?.amount),
      lastAmount: +toRoundFixed(prevWater?.amount),
      price: +toRoundFixed(service.waterPrice),
      sum: 0,
    }
  }
}
