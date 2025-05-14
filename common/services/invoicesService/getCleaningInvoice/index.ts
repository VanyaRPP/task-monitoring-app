import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { toRoundFixed, isEmpty } from '@utils/helpers'
import { ServiceType } from '@utils/constants'
import { IGetInvoiceByTypeProps } from '../types'

export const getCleaningInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Cleaning]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Cleaning]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.price || +invoice.sum),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  if (!isEmpty(company?.cleaning) && !isNaN(company.cleaning)) {
    return {
      type: ServiceType.Cleaning,
      price: +toRoundFixed(company.cleaning),
      sum: +toRoundFixed(company.cleaning),
    }
  }
}
