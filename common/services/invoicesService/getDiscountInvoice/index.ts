import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'
import { toRoundFixed, getPriceFromCustomServices } from '@utils/helpers'

export const getDiscountInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Discount]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Discount]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  const companyDiscount = getPriceFromCustomServices(company?.customServices, 'discount') 
  ?? getPriceFromCustomServices(company?.customServices, 'discount') 
  ?? company?.discount
  return {
    type: ServiceType.Discount,
    price: +toRoundFixed(companyDiscount),
    sum: +toRoundFixed(companyDiscount),
  }
}
