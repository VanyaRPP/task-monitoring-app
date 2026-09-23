import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Operations, ServiceType } from '@utils/constants'
import { resolveServiceType } from '@utils/domain/resolve-service-type'
import dayjs from 'dayjs'
import { IMonthOverride } from './build-input'
import { formatPeriod } from './months'

/** Те, що префілу потрібно від платежу. Структурно сумісне з IExtendedPayment. */
export interface IPrefillPayment {
  type?: string
  company?: string | { _id?: string }
  generalSum?: number
  invoiceCreationDate?: Date | string
  paidAt?: Date | string
  monthService?: string | { date?: Date | string }
  invoice?: IPaymentField[]
}

/** Те, що префілу потрібно від місячної послуги домену. */
export interface IPrefillService {
  date?: Date | string
  rentPrice?: number
}

export interface IBuildMonthPrefillArgs {
  companyId?: string
  payments?: IPrefillPayment[]
  services?: IPrefillService[]
}

/**
 * Місяць читаємо локальним часом, як і решта додатка.
 *
 * Дати місячних послуг створюються з `dayjs(...).startOf('month')` у київському
 * часі й лягають у базу як UTC на кілька годин раніше. Читання через
 * `getUTCMonth` зсунуло б такий запис на попередній місяць.
 */
const periodOfDate = (value?: Date | string): string | undefined => {
  if (!value) return undefined

  const date = dayjs(value)

  return date.isValid()
    ? formatPeriod({ year: date.year(), month: date.month() + 1 })
    : undefined
}

const idOf = (value?: string | { _id?: string }): string =>
  typeof value === 'string' ? value : String(value?._id ?? '')

const isHousingFeeLine = (line?: IPaymentField): boolean => {
  if (!line) return false
  if (line.type === ServiceType.HousingFee) return true

  return (
    resolveServiceType({
      _id: line.serviceId,
      fieldName: line.fieldName,
    }) === ServiceType.HousingFee
  )
}

/**
 * Сума рядків квартплати в рахунку, або `undefined`, якщо таких рядків немає.
 *
 * Свідомо НЕ падаємо на `generalSum`: у рахунку можуть бути й інші послуги, і
 * тихо зарахувати їх у квартплату — це завищити борг. Немає рядка — хай
 * двигун рахує `площа × тариф`.
 */
export const housingFeeCharged = (
  payment?: IPrefillPayment
): number | undefined => {
  const lines = (payment?.invoice ?? []).filter(isHousingFeeLine)
  if (lines.length === 0) return undefined

  return lines.reduce((acc, { sum }) => acc + (Number(sum) || 0), 0)
}

/**
 * Збирає помісячний префіл із того, що вже є в базі: тариф — з місячних послуг
 * домену, нараховано — з рахунків (debit), сплачено — з оплат (credit).
 *
 * Це саме ПРЕФІЛ: ручні правки користувача лежать окремо і завжди його б'ють
 * (див. `buildDebtCalculationInput`).
 */
export const buildMonthPrefill = ({
  companyId,
  payments = [],
  services = [],
}: IBuildMonthPrefillArgs): Record<string, IMonthOverride> => {
  const prefill: Record<string, IMonthOverride> = {}
  const at = (period: string): IMonthOverride =>
    (prefill[period] = prefill[period] ?? {})

  for (const service of services) {
    const period = periodOfDate(service?.date)
    const tariff = Number(service?.rentPrice)

    if (period && Number.isFinite(tariff) && tariff > 0) {
      at(period).tariff = tariff
    }
  }

  for (const payment of payments) {
    if (companyId && idOf(payment?.company) !== companyId) continue

    if (payment?.type === Operations.Credit) {
      const period = periodOfDate(payment.paidAt ?? payment.invoiceCreationDate)
      if (!period) continue

      at(period).paid =
        (at(period).paid ?? 0) + (Number(payment.generalSum) || 0)
      continue
    }

    if (payment?.type !== Operations.Debit) continue

    const monthService = payment.monthService
    const serviceDate =
      typeof monthService === 'string' ? undefined : monthService?.date
    const period = periodOfDate(serviceDate ?? payment.invoiceCreationDate)
    if (!period) continue

    const charged = housingFeeCharged(payment)
    if (charged != null) {
      at(period).charged = (at(period).charged ?? 0) + charged
    }
  }

  return prefill
}
