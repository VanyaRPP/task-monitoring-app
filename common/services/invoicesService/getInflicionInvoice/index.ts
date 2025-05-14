import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty } from '@utils/helpers'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'

export const getInflicionInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Inflicion]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Inflicion]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  if (company?.inflicion) {
    if (isEmpty(prevService?.inflicionPrice)) {
      return {
        type: ServiceType.Inflicion,
        price: 0,
        sum: 0,
      }
    }
    const prevPlacing = prevInvoicesCollection[ServiceType.Placing]
    const price =
      (prevPlacing?.sum ||
        company.totalArea * (company.pricePerMeter || service.rentPrice || 0)) *
      (Math.max(prevService?.inflicionPrice - 100, 0) / 100)

    return {
      type: ServiceType.Inflicion,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }
}
