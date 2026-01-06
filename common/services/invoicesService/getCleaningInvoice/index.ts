import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'
import { toRoundFixed } from '@utils/helpers'
import _isEmpty from 'lodash/isEmpty'
import { getPriceFromCustomServices } from '@utils/helpers'

export const getCleaningInvoice = ({
  company,
  service,
  currInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  const invoice = currInvoicesCollection?.[ServiceType.Cleaning]
  const cleaningPrice = company?.cleaning
  if (invoice) {
    const price = +toRoundFixed(+invoice.price || +invoice.sum)
    const sum = +toRoundFixed(+invoice.sum || +invoice.price)
    return { type: invoice.type, price, sum }
  }

  if (!service) return
  if (!_isEmpty(cleaningPrice) && !isNaN(cleaningPrice)) return

  const price = +toRoundFixed(cleaningPrice)
  const sum = price

  return {
    type: ServiceType.Cleaning,
    price,
    sum,
  }
}
