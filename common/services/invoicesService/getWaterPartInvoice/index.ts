import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty } from '@utils/helpers'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'

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

  if (
    !isEmpty(service?.waterPriceTotal) &&
    !isNaN(service.waterPriceTotal) &&
    !isEmpty(company?.waterPart) &&
    !isNaN(company?.waterPart)
  ) {
    const price = service.waterPriceTotal * (company.waterPart / 100)

    return {
      type: ServiceType.WaterPart,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }
}
