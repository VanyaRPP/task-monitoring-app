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
  // 1. Пріоритет — invoice
  const invoice = currInvoicesCollection?.[ServiceType.Cleaning]
  if (invoice) {
    const price = +toRoundFixed(+invoice.price  +invoice.sum)
    const sum = +toRoundFixed(+invoice.sum  +invoice.price)
    return { type: invoice.type, price, sum }
  }

  // 2. Спроба через customServices
  const serviceCustomPrice = getPriceFromCustomServices(
    service?.customServices,
    ServiceType.Cleaning
  )

  const companyCustomPrice = getPriceFromCustomServices(
    company?.customServices,
    ServiceType.Cleaning
  )

  const customPrice = companyCustomPrice ?? serviceCustomPrice
  if (customPrice !== undefined) {
    const price = +toRoundFixed(customPrice)
    return { type: ServiceType.Cleaning, price, sum: price }
  }

  // 3. Старий варіант через company[ServiceType.Cleaning]
  if (!_isEmpty(company?.cleaning) && !isNaN(company.cleaning)) {
    const price = +toRoundFixed(company.cleaning)
    return { type: ServiceType.Cleaning, price, sum: price }
  }

  return
}