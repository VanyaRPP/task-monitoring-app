import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty, getPriceFromCustomServices } from '@utils/helpers'
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

  const waterPrice = getPriceFromCustomServices(company?.customServices, ServiceType.Water) 
  ?? getPriceFromCustomServices(service?.customServices, ServiceType.Water) 
  ?? service?.waterPrice

  const waterPart = getPriceFromCustomServices(company?.customServices, ServiceType.WaterPart) 
  ?? getPriceFromCustomServices(service?.customServices, ServiceType.WaterPart) 
  ?? company?.waterPart

  if (
    !isEmpty(waterPrice) &&
    !isNaN(waterPrice) &&
    (!waterPart || isNaN(waterPart))
  ) {
    const prevWater = prevInvoicesCollection[ServiceType.Water]

    return {
      type: ServiceType.Water,
      amount: +toRoundFixed(prevWater?.amount),
      lastAmount: +toRoundFixed(prevWater?.amount),
      price: +toRoundFixed(waterPrice),
      sum: 0,
    }
  }
}
