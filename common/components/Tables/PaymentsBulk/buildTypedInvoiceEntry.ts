import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
import { toRoundFixed } from '@utils/helpers'
import { resolveTypedServiceTariff } from './typedServiceTariff'

interface TypedEntryArgs {
  /** Послуга з каталогу домену. */
  customService: { _id?: unknown; name?: string; fieldName?: string }
  /** Тип, під яким рядок піде в інвойс (electricityPrice / waterPrice). */
  serviceType: ServiceType
  company?: { customServices?: unknown } | null
  service?: { customServices?: unknown; losses?: unknown } | null
  /** Показник лічильника за попередній період. */
  prevReading: number
  /** Заготовка рядка з getCustomServiceInvoices (name, fieldName, serviceId). */
  base?: Partial<IPaymentField>
}

/**
 * Рядок інвойсу для per-domain послуги з лічильником у Payment Bulk.
 *
 * Тип рядка — той самий, яким цю ж послугу додає інвойс із каталогу
 * (buildInvoiceAddPayloadFromCatalogRow), тому EditInvoiceTable віддає його
 * Electricity/Water-коміркам і рахує за тією ж формулою, що й булк. Рядки
 * одного типу розрізняються по `serviceId`.
 *
 * `sum` навмисно 0: суму рахує комірка "Загальне" з показників і тарифу.
 */
export function buildTypedInvoiceEntry({
  customService,
  serviceType,
  company,
  service,
  prevReading,
  base = {},
}: TypedEntryArgs): IPaymentField {
  const serviceId = String(customService?._id ?? '')
  const fieldName = customService?.fieldName

  const losses =
    serviceType === ServiceType.Electricity
      ? +toRoundFixed(service?.losses) || undefined
      : undefined

  return {
    ...base,
    type: serviceType,
    name: customService?.name,
    customName: customService?.name,
    fieldName,
    serviceId,
    customService: true,
    price: resolveTypedServiceTariff(
      { company, service },
      { serviceId, fieldName }
    ),
    ...(losses ? { losses } : {}),
    lastAmount: prevReading,
    amount: prevReading,
    sum: 0,
  } as IPaymentField
}
