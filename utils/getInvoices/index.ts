import {
  IPayment,
  IPaymentField,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { getCustomInvoices } from '@common/services/invoicesService/getCustomInvoices'
import { getDiscountInvoice } from '@common/services/invoicesService/getDiscountInvoice'
import { getElectricityInvoice } from '@common/services/invoicesService/getElectricityInvoice'
import { getInflicionInvoice } from '@common/services/invoicesService/getInflicionInvoice'
import { getWaterInvoice } from '@common/services/invoicesService/getWaterInvoice'
import { getWaterPartInvoice } from '@common/services/invoicesService/getWaterPartInvoice'
import { current } from '@reduxjs/toolkit'
import { ServiceType } from '@utils/constants'
import { isEmpty, toRoundFixed } from '@utils/helpers'

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
  prevPayment?: Partial<IPayment>
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
export const getInvoicesOld = ({
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

export const getMaintenanceInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Maintenance]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Maintenance]
    const companyMaintenance =
      company?.servicePricePerMeter >= 0
        ? company?.servicePricePerMeter
        : undefined

    return {
      type: invoice.type,
      amount: +toRoundFixed(invoice.amount),
      price:
        companyMaintenance !== undefined && companyMaintenance !== null
          ? +toRoundFixed(companyMaintenance)
          : +toRoundFixed(invoice.price),
      sum:
        companyMaintenance !== undefined && companyMaintenance !== null
          ? +toRoundFixed(companyMaintenance * +invoice.amount)
          : +toRoundFixed(+invoice.sum || +invoice.price * +invoice.amount),
    }
  }

  if (company.servicePricePerMeter === 0) return

  if (
    !isNaN(company?.totalArea) &&
    (!isNaN(company?.servicePricePerMeter) || !isNaN(service?.rentPrice))
  ) {
    return {
      type: ServiceType.Maintenance,
      amount: +toRoundFixed(company.totalArea),
      price: +toRoundFixed(company.servicePricePerMeter || service.rentPrice),
      sum: +toRoundFixed(
        company.totalArea * (company.servicePricePerMeter || service.rentPrice)
      ),
    }
  }
}

export const getPlacingInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Placing]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Placing]

    return {
      type: invoice.type,
      amount: +toRoundFixed(+invoice.amount),
      price: +toRoundFixed(+invoice.price || +invoice.sum),
      sum: +toRoundFixed(+invoice.sum || +invoice.price * +invoice.amount),
    }
  }

  if (company?.inflicion) {
    const prevPlacing = prevInvoicesCollection[ServiceType.Placing]
    const price =
      (prevPlacing?.sum ||
        company.totalArea * (company.pricePerMeter || service?.rentPrice)) *
      ((prevService?.inflicionPrice || 100) / 100)

    return {
      type: ServiceType.Placing,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }

  return {
    type: ServiceType.Placing,
    amount: +toRoundFixed(company?.totalArea),
    price: +toRoundFixed(company?.pricePerMeter || service?.rentPrice),
    sum: +toRoundFixed(
      company?.totalArea * (company?.pricePerMeter || service?.rentPrice)
    ),
  }
}

export const getGarbageCollectorInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.GarbageCollector]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.GarbageCollector]

    if (company?.garbageCollector === false) {
      return {
        type: ServiceType.GarbageCollector,
        price: 0,
        sum: 0,
      }
    }

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  if (company?.garbageCollector === false) {
    return {
      type: ServiceType.GarbageCollector,
      price: 0,
      sum: 0,
    }
  }

  if (
    !isEmpty(service?.garbageCollectorPrice) &&
    !isNaN(service.garbageCollectorPrice) &&
    company?.garbageCollector
  ) {
    
    const price = service.garbageCollectorPrice * (company?.rentPart / 100)

    return {
      type: ServiceType.GarbageCollector,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }
}

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
