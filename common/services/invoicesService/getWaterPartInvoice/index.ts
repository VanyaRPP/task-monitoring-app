import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty } from '@utils/helpers'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'
import { getPriceFromCustomServices } from '@utils/helpers'

export const getWaterPartInvoice = ({
  company,
  service,
  prevService,
  prevPayment,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  const paymentInvoices = prevPayment?.invoice

  if (paymentInvoices?.some(i => i.type === ServiceType.WaterPart)) {
    const waterPartInvoice = paymentInvoices.find(i => i.type === ServiceType.WaterPart)

    return {
      type: waterPartInvoice.type,
      price: +toRoundFixed(+waterPartInvoice.sum || +waterPartInvoice.price),
      sum: +toRoundFixed(+waterPartInvoice.sum || +waterPartInvoice.price),
    }
  }

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
    getPriceFromCustomServices(company?.customServices, ServiceType.WaterPart) ??
    company?.waterPart

  const isCompanyHasWaterPart =
    !isEmpty(waterPart) && !isNaN(waterPart)

  let waterPrice: number | undefined

  if (isCompanyHasWaterPart) {
  const priceFromCustom = getPriceFromCustomServices(company?.customServices, ServiceType.WaterPart)

  if (priceFromCustom == null) {
    return
  }

  waterPrice = priceFromCustom ?? company?.waterPart
  } else {
  const priceFromCustom = getPriceFromCustomServices(service?.customServices, ServiceType.WaterPart)

  if (priceFromCustom == null) {
    return
  }

  waterPrice = priceFromCustom ?? service?.waterPriceTotal
}

  if (
    !isEmpty(waterPrice) &&
    !isNaN(waterPrice) &&
    !isEmpty(waterPart) &&
    !isNaN(waterPart)
  ) {
    const sum = waterPrice * (waterPart / 100)

    return {
      type: ServiceType.WaterPart,
      price: +toRoundFixed(sum),
      sum: +toRoundFixed(sum),
    }
  }
  return
}
