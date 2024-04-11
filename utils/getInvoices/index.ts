import {
  IPayment,
  IPaymentField,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'

export type InvoicesCollection = {
  [key in ServiceType | string]?: IPaymentField
}

export interface IGetInvoiceProps {
  company: Partial<IRealestate>
  service: Partial<IService>
  payment: Partial<IPayment>
  prevPayment: Partial<IPayment>
}

export interface IGetInvoiceByTypeProps {
  company: Partial<IRealestate>
  service: Partial<IService>
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
 * @param prevPayment - represents Payment from previous month
 * @returns array of invoices for provided props
 */
export const getInvoices = ({
  company,
  service,
  payment,
  prevPayment,
}: IGetInvoiceProps): Array<IPaymentField> => {
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
        currInvoicesCollection,
        prevInvoicesCollection,
      })
    ),
    ...getCustomInvoices({
      company,
      service,
      currInvoicesCollection,
      prevInvoicesCollection,
    }),
  ]

  return invoices.filter((invoice) => invoice)
}

export const getMaintenanceInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.Maintenance in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.Maintenance]
  }

  if (company?.pricePerMeter && company?.rentPart) {
    return {
      type: ServiceType.Maintenance,
      amount: company.rentPart,
      price: company.pricePerMeter,
      sum: company.rentPart * company.pricePerMeter,
    }
  }
}

export const getPlacingInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.Placing in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.Placing]
  }

  const prevPlacing = prevInvoicesCollection[ServiceType.Placing]

  if (service && ServiceType.Inflicion in service && company?.inflicion) {
    const inflicionIndex = service[ServiceType.Inflicion] - 100
    const inflicionPrice = (inflicionIndex / 100) * (+prevPlacing?.sum || 0)
    const price = (+prevPlacing?.sum || 0) + inflicionPrice

    return {
      type: ServiceType.Placing,
      price: price,
      sum: price,
    }
  }

  return {
    type: ServiceType.Placing,
    price: +prevPlacing?.sum || 0,
    sum: +prevPlacing?.sum || 0,
  }
}

export const getInflicionInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.Inflicion in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.Inflicion]
  }

  if (service && ServiceType.Inflicion in service && company?.inflicion) {
    const prevPlacing = prevInvoicesCollection[ServiceType.Placing]
    const inflicionIndex = service[ServiceType.Inflicion] - 100
    const inflicionPrice = (inflicionIndex / 100) * (+prevPlacing?.sum || 0)

    return {
      type: ServiceType.Inflicion,
      price: inflicionPrice,
      sum: inflicionPrice,
    }
  }
}

export const getElectricityInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.Electricity in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.Electricity]
  }

  if (service && ServiceType.Electricity in service) {
    const prevElectricity = prevInvoicesCollection[ServiceType.Electricity]

    return {
      type: ServiceType.Electricity,
      amount: +prevElectricity?.amount || 0,
      lastAmount: +prevElectricity?.amount || 0,
      price: service[ServiceType.Electricity],
      sum: 0,
    }
  }
}

export const getWaterPartInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.WaterPart in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.WaterPart]
  }

  if (service && ServiceType.Water in service && company?.waterPart) {
    const price = (service[ServiceType.Water] * company.waterPart) / 100
    return {
      type: ServiceType.WaterPart,
      price: price,
      sum: price,
    }
  }
}

export const getWaterInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.Water in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.Water]
  }

  if (service && ServiceType.Water in service && !company?.waterPart) {
    const prevWater = prevInvoicesCollection[ServiceType.Water]

    return {
      type: ServiceType.Water,
      amount: +prevWater?.amount || 0,
      lastAmount: +prevWater?.amount || 0,
      price: service[ServiceType.Water],
      sum: 0,
    }
  }
}

export const getGarbageCollectorInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.GarbageCollector in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.GarbageCollector]
  }

  if (
    service &&
    ServiceType.GarbageCollector in service &&
    company?.garbageCollector
  ) {
    const price =
      (service[ServiceType.GarbageCollector] * company?.servicePricePerMeter) /
      100

    return {
      type: ServiceType.GarbageCollector,
      price: price,
      sum: price,
    }
  }
}

export const getCleaningInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.Cleaning in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.Cleaning]
  }

  if (company?.cleaning) {
    return {
      type: ServiceType.Cleaning,
      price: company.cleaning,
      sum: company.cleaning,
    }
  }
}

export const getDiscountInvoice = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (ServiceType.Discount in currInvoicesCollection) {
    return currInvoicesCollection[ServiceType.Discount]
  }

  if (company?.discount) {
    return {
      type: ServiceType.Discount,
      price: company.discount,
      sum: company.discount,
    }
  }
}

export const getCustomInvoices = ({
  company,
  service,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): Array<IPaymentField> => {
  return Object.values(currInvoicesCollection).filter(
    (invoice: IPaymentField) => invoice.type === ServiceType.Custom
  )
}
