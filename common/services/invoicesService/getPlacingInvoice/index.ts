import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty } from '@utils/helpers'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'
import { getPriceFromCustomServices } from '@utils/helpers'

export const getPlacingInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Placing]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Placing]

    return {
      type: invoice.type,
      amount: +toRoundFixed(+invoice.amount),
      price: +toRoundFixed(+invoice.price || +invoice.sum),
      sum: +toRoundFixed(+invoice.sum || +invoice.price * +invoice.amount),
    }
  }

  const inflicionCompany =
    getPriceFromCustomServices(
      company?.customServices,
      ServiceType.Inflicion) 
    ?? getPriceFromCustomServices(
      service?.customServices,
      ServiceType.Inflicion) 
    ?? company?.inflicion

  const rentPrice = getPriceFromCustomServices(
    company?.customServices,
    'rentPrice') 
  ?? getPriceFromCustomServices(
    service?.customServices,
    'rentPrice')
  ?? service?.rentPrice

  if (inflicionCompany) {
    const prevPlacing = prevInvoicesCollection[ServiceType.Placing]
    const price =
      (prevPlacing?.sum ||
        company.totalArea * (company.pricePerMeter || rentPrice)) *
      ((prevService?.inflicionPrice || 100) / 100)

    return {
      type: ServiceType.Placing,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }

  return {
    type: ServiceType.Placing,
    amount: +toRoundFixed(company?.totalArea),
    price: +toRoundFixed(company?.pricePerMeter || rentPrice),
    sum: +toRoundFixed(
      company?.totalArea * (company?.pricePerMeter || rentPrice)
    ),
  }
}