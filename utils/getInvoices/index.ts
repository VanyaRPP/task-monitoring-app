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
  prevPayment?: Partial<IPayment>
  currInvoicesCollection: InvoicesCollection
  prevInvoicesCollection: InvoicesCollection
}

const SCOPED_KEY_PREFIX = 'sid:'

/**
 * Ключ рядка в колекції поточного платежу.
 *
 * Рядок із `serviceId` — це per-domain копія типізованої послуги (власний
 * лічильник електрики/води тощо). Таких рядків на інвойсі може бути кілька
 * одного типу, тому вони НЕ можуть жити під ключем свого ServiceType: вони б
 * перетирали один одного і нативний рядок. Даємо їм власний простір ключів, а
 * назад у список їх повертає getScopedTypedInvoices — без перерахунку, як є.
 */
const invoiceCollectionKey = (invoice: IPaymentField): string => {
  if (invoice?.serviceId && invoice?.type !== ServiceType.Custom) {
    return `${SCOPED_KEY_PREFIX}${invoice.serviceId}`
  }
  return invoice.name || invoice.type
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
  // Bypass the missing-context guard when the previous payment has Custom
  // items — they can seed a Custom row even without service/company/payment.
  // Other per-type getters keep their own null-safety guards.
  const hasPrevCustomItems = !!prevPayment?.invoice?.some(
    (inv) => inv?.type === ServiceType.Custom && !!inv?.fieldName
  )
  if (
    (isEmpty(company) || isEmpty(service)) &&
    (isEmpty(payment) || isEmpty(payment?.invoice)) &&
    !hasPrevCustomItems
  ) {
    return []
  }

  const currInvoicesCollection =
    payment?.invoice?.reduce((acc, invoice) => {
      acc[invoiceCollectionKey(invoice)] = invoice
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
    ...getScopedTypedInvoices({ currInvoicesCollection }),
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
      prevPayment,
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
      isIndividual:
        companyMaintenance !== undefined && companyMaintenance !== null,
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

  if (company?.servicePricePerMeter === 0) return

  if (
    !isNaN(company?.totalArea) &&
    (!isNaN(company?.servicePricePerMeter) || !isNaN(service?.rentPrice))
  ) {
    // `company.servicePricePerMeter` may be null (Number(null)===0 sneaks past
    // the !isNaN guard) and `service` may be null while it's still loading.
    // Resolve the price defensively and skip if neither source is usable. Note
    // we use `== null` (not `!price`) so a legitimate 0 still produces a row.
    const price = company.servicePricePerMeter || service?.rentPrice
    if (price == null) return

    return {
      type: ServiceType.Maintenance,
      amount: +toRoundFixed(company.totalArea),
      price: +toRoundFixed(price),
      sum: +toRoundFixed(company.totalArea * price),
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
      ((prevService?.inflicionPrice || 100) / 100 < 1
        ? 1
        : (prevService?.inflicionPrice || 100) / 100)

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
      losses: +toRoundFixed(+invoice?.losses) || undefined,
      sum: +toRoundFixed(
        +invoice.sum || +invoice.price * (+invoice.amount - +invoice.lastAmount)
      ),
    }
  }

  if (!isEmpty(service?.electricityPrice)) {
    const prevElectricity = prevInvoicesCollection[ServiceType.Electricity]
    const prevAmount = +toRoundFixed(prevElectricity?.amount ?? 0)

    return {
      type: ServiceType.Electricity,
      amount: prevAmount,
      lastAmount: prevAmount,
      losses: +toRoundFixed(service?.losses) || undefined,
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
    return
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

/**
 * Рядки per-domain типізованих послуг (власний лічильник) із поточного платежу.
 *
 * Повертаються як є: у них уже лежить свій тариф, показники, втрати і
 * `serviceId`, за яким рядок прив'язаний до послуги каталогу. Перерахунок за
 * тарифом місячної послуги тут зіпсував би саме те, заради чого послуга й
 * заведена окремо.
 */
export const getScopedTypedInvoices = ({
  currInvoicesCollection,
}: Pick<
  IGetInvoiceByTypeProps,
  'currInvoicesCollection'
>): Array<IPaymentField> =>
  Object.entries(currInvoicesCollection)
    .filter(([key]) => key.startsWith(SCOPED_KEY_PREFIX))
    .map(([, invoice]) => invoice)

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

export const getCustomServiceInvoices = ({
  company,
  service,
  prevService,
  prevPayment,
  currInvoicesCollection,
  prevInvoicesCollection,
}: IGetInvoiceByTypeProps): Array<IPaymentField> => {
  if (Object.keys(currInvoicesCollection).length > 0) {
    return []
  }

  const serviceCustoms = Array.isArray(service?.customServices)
    ? service.customServices
    : []
  const companyCustoms = Array.isArray(company?.customServices)
    ? company.customServices
    : []
  const prevCustomItems = (prevPayment?.invoice ?? []).filter(
    (inv) => inv?.type === ServiceType.Custom && !!inv?.fieldName
  )

  if (
    serviceCustoms.length === 0 &&
    companyCustoms.length === 0 &&
    prevCustomItems.length === 0
  ) {
    return []
  }

  const customByFieldName = new Map<
    string,
    {
      serviceItem?: (typeof serviceCustoms)[number]
      companyItem?: (typeof companyCustoms)[number]
      prevItem?: (typeof prevCustomItems)[number]
    }
  >()

  serviceCustoms.forEach((serviceItem) => {
    if (!serviceItem?.fieldName) return

    customByFieldName.set(serviceItem.fieldName, {
      serviceItem,
      companyItem: companyCustoms.find(
        (companyItem) => companyItem?.fieldName === serviceItem.fieldName
      ),
      prevItem: prevCustomItems.find(
        (prevItem) => prevItem.fieldName === serviceItem.fieldName
      ),
    })
  })

  companyCustoms.forEach((companyItem) => {
    if (
      !companyItem?.fieldName ||
      customByFieldName.has(companyItem.fieldName)
    ) {
      return
    }

    customByFieldName.set(companyItem.fieldName, {
      serviceItem: serviceCustoms.find(
        (serviceItem) => serviceItem?.fieldName === companyItem.fieldName
      ),
      companyItem,
      prevItem: prevCustomItems.find(
        (prevItem) => prevItem.fieldName === companyItem.fieldName
      ),
    })
  })

  prevCustomItems.forEach((prevItem) => {
    if (customByFieldName.has(prevItem.fieldName!)) return
    customByFieldName.set(prevItem.fieldName!, { prevItem })
  })

  return Array.from(customByFieldName.entries()).map(
    ([fieldName, { serviceItem, companyItem, prevItem }]) => {
      const price = +toRoundFixed(
        companyItem?.price ?? serviceItem?.price ?? prevItem?.price ?? 0
      )

      return {
        name:
          serviceItem?.label ||
          companyItem?.label ||
          prevItem?.name ||
          'Невідома послуга',
        amount: 1,
        price,
        sum: price,
        type: ServiceType.Custom,
        fieldName,
        serviceId: String(
          serviceItem?._id || companyItem?._id || prevItem?.serviceId || ''
        ),
        customService: true,
      }
    }
  )
}

export interface IGetSingleCustomServiceInvoiceProps {
  company?: Partial<IRealestate>
  service?: Partial<IService>
  fieldName: string
}

export const getSingleCustomServiceInvoice = ({
  company,
  service,
  fieldName,
}: IGetSingleCustomServiceInvoiceProps): IPaymentField | undefined => {
  if (!fieldName) return

  const serviceCustom = Array.isArray(service?.customServices)
    ? service.customServices
    : []

  const companyCustom = Array.isArray(company?.customServices)
    ? company.customServices
    : []

  const serviceItem = serviceCustom.find((item) => item.fieldName === fieldName)

  if (!serviceItem) return

  const companyItem = companyCustom.find((item) => item.fieldName === fieldName)

  const price = +toRoundFixed(companyItem?.price ?? serviceItem?.price ?? 0)

  return {
    name: serviceItem?.label || 'Невідома послуга',
    type: ServiceType.Custom,
    fieldName: serviceItem.fieldName,
    serviceId: String(serviceItem?._id || ''),
    amount: 1,
    price,
    sum: price,
  }
}
