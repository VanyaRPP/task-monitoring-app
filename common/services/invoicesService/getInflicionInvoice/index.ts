import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty, getPriceFromCustomServices } from '@utils/helpers'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'

export const getInflicionInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {

  const invoice = currInvoicesCollection?.[ServiceType.Inflicion]
  if (invoice) {
    return {
      type: invoice.type,
      price: +toRoundFixed(invoice.sum ?? +invoice.price),
      sum: +toRoundFixed(invoice.sum ?? +invoice.price),
    }
  }
  const prevPlacing = prevInvoicesCollection?.[ServiceType.Placing]
  const base =
    prevPlacing?.sum ??
    company?.totalArea * (service?.rentPrice ?? 0)

  const inflicionEnabled =
    getPriceFromCustomServices(company?.customServices, ServiceType.Inflicion) ??
    company?.inflicion

  if (!inflicionEnabled) return

  const prevInflicionPrice =
    getPriceFromCustomServices(prevService?.customServices, ServiceType.Inflicion) ??
    prevService?.inflicionPrice

  const price =
    base * (Math.max(prevInflicionPrice - 100, 0) / 100)

  if (isEmpty(prevInflicionPrice)) {
    return {
      type: ServiceType.Inflicion,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }

  return {
    type: ServiceType.Inflicion,
    price: +toRoundFixed(price),
    sum: +toRoundFixed(price),
  }
}
