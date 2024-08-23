import {
  IPayment,
  IPaymentField,
} from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
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
  if ((isEmpty(company) || isEmpty(service)) && isEmpty(payment)) {
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

    return {
      type: invoice.type,
      amount: +toRoundFixed(invoice.amount),
      price: +toRoundFixed(+invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price * +invoice.amount),
    }
  }

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
      company?.totalArea * company?.pricePerMeter || service?.rentPrice
    ),
  }
}

export const getInflicionInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Inflicion]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Inflicion]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }
  }

  if (company?.inflicion) {
    if (isEmpty(prevService?.inflicionPrice)) {
      return {
        type: ServiceType.Inflicion,
        price: 0,
        sum: 0,
      }
    }
    const prevPlacing = prevInvoicesCollection[ServiceType.Placing]
    const price =
      (prevPlacing?.sum ||
        company.totalArea * (company.pricePerMeter || service.rentPrice || 0)) *
      (Math.max(prevService?.inflicionPrice - 100, 0) / 100)

    return {
      type: ServiceType.Inflicion,
      price: +toRoundFixed(price),
      sum: +toRoundFixed(price),
    }
  }
}

export const getElectricityInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Electricity]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Electricity]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.price),
      amount: +toRoundFixed(+invoice.amount),
      lastAmount: +toRoundFixed(+invoice.lastAmount),
      sum: +toRoundFixed(
        +invoice.sum || +invoice.price * (+invoice.amount - +invoice.lastAmount)
      ),
    }
  }

  if (!isEmpty(service?.electricityPrice)) {
    const prevElectricity = prevInvoicesCollection[ServiceType.Electricity]

    return {
      type: ServiceType.Electricity,
      amount: +toRoundFixed(prevElectricity?.amount),
      lastAmount: +toRoundFixed(prevElectricity?.amount),
      price: +toRoundFixed(service.electricityPrice),
      sum: 0,
    }
  }
}

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

export const getWaterInvoice = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): IPaymentField | undefined => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    if (!currInvoicesCollection[ServiceType.Water]) {
      return
    }

    const invoice = currInvoicesCollection[ServiceType.Water]

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.price),
      amount: +toRoundFixed(+invoice.amount),
      lastAmount: +toRoundFixed(+invoice.lastAmount),
      sum: +toRoundFixed(
        +invoice.sum || +invoice.price * (+invoice.amount - +invoice.lastAmount)
      ),
    }
  }

  if (
    !isEmpty(service?.waterPrice) &&
    !isNaN(service.waterPrice) &&
    (!company?.waterPart || isNaN(company?.waterPart))
  ) {
    const prevWater = prevInvoicesCollection[ServiceType.Water]

    return {
      type: ServiceType.Water,
      amount: +toRoundFixed(prevWater?.amount),
      lastAmount: +toRoundFixed(prevWater?.amount),
      price: +toRoundFixed(service.waterPrice),
      sum: 0,
    }
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

    return {
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
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

  return {
    type: ServiceType.Discount,
    price: +toRoundFixed(company?.discount),
    sum: +toRoundFixed(company?.discount),
  }
}

export const getCustomInvoices = ({
  company,
  service,
  prevService,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): Array<IPaymentField> => {
  return Object.values(currInvoicesCollection)
    .filter((invoice: IPaymentField) => invoice.type === ServiceType.Custom)
    .map((invoice) => ({
      name: invoice.name,
      type: invoice.type,
      price: +toRoundFixed(+invoice.sum || +invoice.price),
      sum: +toRoundFixed(+invoice.sum || +invoice.price),
    }))
}
