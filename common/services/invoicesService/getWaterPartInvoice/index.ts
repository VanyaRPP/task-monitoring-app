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
  if (currInvoicesCollection?.[ServiceType.WaterPart]) {
    const invoice = currInvoicesCollection[ServiceType.WaterPart]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  const hasCustomServices =
    getPriceFromCustomServices(company?.customServices, ServiceType.Water) != null ||
    getPriceFromCustomServices(service?.customServices, ServiceType.Water) != null ||
    getPriceFromCustomServices(company?.customServices, ServiceType.WaterPart) != null ||
    getPriceFromCustomServices(service?.customServices, ServiceType.WaterPart) != null

  const prevInvoice = prevInvoicesCollection?.[ServiceType.WaterPart]
  if (prevInvoice && hasCustomServices) {
    return {
      type: prevInvoice.type,
      price: +toRoundFixed(prevInvoice.price),
      sum: +toRoundFixed(prevInvoice.sum),
    }
  }

  const waterPriceTotal = getPriceFromCustomServices(company?.customServices, ServiceType.Water) 
  ?? getPriceFromCustomServices(service?.customServices, ServiceType.Water) 
  ?? service?.waterPriceTotal

  const waterPart = getPriceFromCustomServices(company?.customServices, ServiceType.WaterPart) 
  ?? getPriceFromCustomServices(service?.customServices, ServiceType.WaterPart) 
  ?? company?.waterPart

  if (
    !isEmpty(waterPriceTotal) &&
    !isNaN(waterPriceTotal) &&
    !isEmpty(waterPart) &&
    !isNaN(waterPart)
  ) {
    const price = waterPriceTotal * (waterPart / 100)

    return {
      type: ServiceType.WaterPart,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }
  return
}