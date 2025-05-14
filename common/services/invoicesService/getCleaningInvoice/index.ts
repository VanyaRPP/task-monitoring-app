import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'
import { toRoundFixed } from '@utils/helpers'
import _isEmpty from 'lodash/isEmpty'

const getPriceFromCustomServices = (
  items: any[] | undefined,
  fieldName: string
): number | undefined => {
  const found = items?.find((item) => item.fieldName === fieldName)
  return found && !isNaN(found.price) ? +found.price : undefined
}

export const getCleaningInvoice = ({
  company,
  service,
  currInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  const invoice = currInvoicesCollection?.[ServiceType.Cleaning]

  if (invoice) {
    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.price || +invoice.sum),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  const servicePrice = getPriceFromCustomServices(
    service?.customServices,
    ServiceType.Cleaning
  )
  const companyPrice = getPriceFromCustomServices(
    company?.customServices,
    ServiceType.Cleaning
  )

  const price = servicePrice ?? companyPrice

  if (price !== undefined) {
    return {
      type: ServiceType.Cleaning,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }

  if (!_isEmpty(company?.cleaning) && !isNaN(company.cleaning)) {
    return {
      type: ServiceType.Cleaning,
      price: +toRoundFixed(company.cleaning),
      sum: +toRoundFixed(company.cleaning),
    }
  }
}
