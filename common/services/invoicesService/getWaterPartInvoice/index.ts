import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty } from '@utils/helpers'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'
import { getPriceFromCustomServices } from '@utils/helpers'

export const getWaterPartInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.WaterPart]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.WaterPart]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  const waterPart =
    getPriceFromCustomServices(
      company?.customServices,
      ServiceType.WaterPart
    ) ?? company?.waterPart
  const waterPrice =
    getPriceFromCustomServices(service?.customServices, ServiceType.Water) ??
    service?.waterPriceTotal
  if (
    !isEmpty(waterPrice) &&
    !isNaN(waterPrice) &&
    !isEmpty(waterPart) &&
    !isNaN(waterPart)
  ) {
    const price = waterPrice * (waterPart / 100)

    return {
      type: ServiceType.WaterPart,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }
}
