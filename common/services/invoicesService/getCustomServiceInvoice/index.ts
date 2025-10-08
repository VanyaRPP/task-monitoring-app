import { IGetInvoiceByTypeProps } from '../types'
import { ServiceType } from '@utils/constants'
import { toRoundFixed } from '@utils/helpers'
import _isEmpty from 'lodash/isEmpty'
import { getPriceFromCustomServices } from '@utils/helpers'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

export const getCustomServiceInvoices = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): Array<IPaymentField> => {
  if (
    (!service?.customServices && !company?.customServices) ||
    Object.keys(currInvoicesCollection).length > 0
  ) {
    return []
  }

  const serviceCustoms = Array.isArray(service?.customServices)
    ? service.customServices
    : []
  const companyCustoms = Array.isArray(company?.customServices)
    ? company.customServices
    : []

  const customServices = serviceCustoms.map((serviceItem) => {
    const companyItem = companyCustoms.find(
      (c) => c?.fieldName === serviceItem?.fieldName
    )

    const price = +toRoundFixed(companyItem?.price ?? serviceItem?.price ?? 0)

    return {
      name: serviceItem?.label || 'Невідома послуга',
      price,
      sum: price,
      type: ServiceType.Custom,
      fieldName: serviceItem?.fieldName || 'custom',
      customService: true,
    }
  })

  return customServices
}