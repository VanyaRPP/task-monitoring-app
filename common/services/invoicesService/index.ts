import {
  IPaymentField,
  IPayment,
} from '@common/api/paymentApi/payment.api.types'
import {
  // getMaintenanceInvoice,
  getPlacingInvoice,
  getInflicionInvoice,
  getElectricityInvoice,
  getWaterInvoice,
  getWaterPartInvoice,
  // getGarbageCollectorInvoice,
  getCleaningInvoice,
  getDiscountInvoice,
  getCustomInvoices,
  getCustomServiceInvoices,
} from '@utils/getInvoices' //TODO: we rewrite each service
import {
  getMaintenanceInvoice,
} from '@common/services/getMaintenanceInvoice'
import {
  getGarbageCollectorInvoice,
} from '@common/services/getGarbageCollectorInvoice'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'
import { isEmpty } from '@utils/helpers'

export type InvoicesCollection = {
  [key in ServiceType | string]?: IPaymentField
}

export interface IGetInvoiceProps {
  company?: Partial<IRealestate>
  service?: Partial<IService>
  payment?: Partial<IPayment>
  prevService?: Partial<IService>
  prevPayment?: Partial<IPayment>
}

export interface IGetInvoiceByTypeProps {
  company?: Partial<IRealestate>
  service?: Partial<IService>
  prevService?: Partial<IService>
  currInvoicesCollection: InvoicesCollection
  prevInvoicesCollection: InvoicesCollection
}

/**
 * Generating initial invoices data, based on received props.
 *
 * If `payment` received - all data will be collected from this `payment`.
 *
 * -or-
 *
 * If `company`, `service`, `prevPayment` is received without `payment` - all data will be generaded by following rules:
 *
 *      price:      from `service` or by corresponding formula or 0
 *      amount:     from `prevPayment#amount` or 0 (optional)
 *      lastAmount: from `prevPayment#amount` or 0 (optional)
 *
 * @param company - represents Company
 * @param service - represents Service
 * @param payment - represents Payment
 * @param prevService - represents Service from previous month
 * @param prevPayment - represents Payment from previous month
 * @returns array of invoices for provided props
 */
export const getInvoices = ({
  company,
  service,
  payment,
  prevService,
  prevPayment,
}: IGetInvoiceProps): Array<IPaymentField> => {
  if (
    (isEmpty(company) || isEmpty(service)) &&
    (isEmpty(payment) || isEmpty(payment?.invoice))
  ) {
    return []
  }

  const currInvoicesCollection =
    payment?.invoice?.reduce((acc, invoice) => {
      acc[invoice.name || invoice.type] = invoice
      return acc
    }, {} as InvoicesCollection) || {}

  const prevInvoicesCollection =
    prevPayment?.invoice?.reduce((acc, invoice) => {
      acc[invoice.name || invoice.type] = invoice
      return acc
    }, {} as InvoicesCollection) || {}

  const getInvoicesByType = [
    getMaintenanceInvoice,
    getPlacingInvoice,
    getInflicionInvoice,
    getElectricityInvoice,
    getWaterInvoice,
    getWaterPartInvoice,
    getGarbageCollectorInvoice,
    getCleaningInvoice,
    getDiscountInvoice,
  ]

  const invoices = [
    ...getInvoicesByType.map((getInvoiceByType) =>
      getInvoiceByType({
        company,
        service,
        prevService,
        currInvoicesCollection,
        prevInvoicesCollection,
      })
    ),
    ...getCustomInvoices({
      company,
      service,
      prevService,
      currInvoicesCollection,
      prevInvoicesCollection,
    }),
    ...getCustomServiceInvoices({
      company,
      service,
      prevService,
      currInvoicesCollection,
      prevInvoicesCollection,
    }),
  ]

  return invoices.filter((invoice) => invoice)
}
