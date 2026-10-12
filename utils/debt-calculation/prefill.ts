import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Operations, ServiceType } from '@utils/constants'
import { resolveServiceType } from '@utils/domain/resolve-service-type'
import dayjs from 'dayjs'
import { IMonthOverride } from './build-input'
import {
  formatPeriod,
  IYearMonth,
  parsePeriod,
  periodKey,
  yearMonthOf,
} from './months'

/**
 * `fieldName` of the invoice line that carries a debt brought in from outside
 * the system - the «Вхідне сальдо» invoice a photo import creates at the start
 * of the known history. It is a debt, not a charge for that month.
 */
export const OPENING_BALANCE_FIELD = 'openingBalance'

export const isOpeningBalanceLine = (line?: IPaymentField): boolean =>
  line?.fieldName === OPENING_BALANCE_FIELD

/**
 * `fieldName` of a housing-fee line that corrects the month's charge (a
 * recalculation, usually negative). It stays a housing-fee line - everything
 * summing the housing fee sees the net - but the debt page shows it in its
 * own column.
 */
export const CORRECTION_FIELD = 'housingFeeCorrection'

/** A month of the prefill: the calculation's inputs plus a debt brought in. */
export interface IMonthPrefill extends IMonthOverride {
  /** Sum of «Вхідне сальдо» lines dated this month. */
  openingBalance?: number
}

/** What the prefill needs from a payment. Structurally compatible with IExtendedPayment. */
export interface IPrefillPayment {
  type?: string
  company?: string | { _id?: string }
  generalSum?: number
  invoiceCreationDate?: Date | string
  paidAt?: Date | string
  monthService?: string | { date?: Date | string }
  invoice?: IPaymentField[]
}

/** What the prefill needs from a domain's monthly service. */
export interface IPrefillService {
  date?: Date | string
  rentPrice?: number
}

export interface IBuildMonthPrefillArgs {
  companyId?: string
  payments?: IPrefillPayment[]
  services?: IPrefillService[]
  timeZone?: string
}

/**
 * The month is read in local time, like everywhere else in the app.
 *
 * Monthly-service dates are created with `dayjs(...).startOf('month')` in Kyiv
 * time and land in the DB as a UTC instant a few hours earlier. Reading them
 * with `getUTCMonth` would shift such a record into the previous month.
 */
export const periodOfDate = (
  value?: Date | string,
  timeZone?: string
): string | undefined => {
  if (!value) return undefined

  const date = dayjs(value)

  return date.isValid()
    ? formatPeriod(yearMonthOf(date.toDate(), timeZone))
    : undefined
}

const idOf = (value?: string | { _id?: string }): string =>
  typeof value === 'string' ? value : String(value?._id ?? '')

export const isHousingFeeLine = (line?: IPaymentField): boolean => {
  if (!line || isOpeningBalanceLine(line)) return false
  if (line.type === ServiceType.HousingFee) return true

  return (
    resolveServiceType({
      _id: line.serviceId,
      fieldName: line.fieldName,
    }) === ServiceType.HousingFee
  )
}

/**
 * The housing-fee lines of an invoice summed, or `undefined` when there are
 * none.
 *
 * Deliberately does NOT fall back to `generalSum`: an invoice may carry other
 * services, and quietly counting them as housing fee would overstate the debt.
 * With no matching line, let the engine derive `area × tariff` instead.
 */
export const housingFeeCharged = (
  payment?: IPrefillPayment
): number | undefined => {
  const lines = (payment?.invoice ?? []).filter(isHousingFeeLine)
  if (lines.length === 0) return undefined

  return lines.reduce((acc, { sum }) => acc + (Number(sum) || 0), 0)
}

/** The correction lines of an invoice summed; 0 when there are none. */
export const housingFeeCorrection = (payment?: IPrefillPayment): number =>
  (payment?.invoice ?? [])
    .filter((line) => line?.fieldName === CORRECTION_FIELD)
    .reduce((acc, { sum }) => acc + (Number(sum) || 0), 0)

/**
 * Builds the per-month prefill from what the DB already holds: the tariff
 * from the domain's monthly services, charges from debit invoices, payments
 * from credit records, and any «Вхідне сальдо» (see
 * {@link prefillOpeningDebt}).
 *
 * This is strictly a PREFILL: the user's manual edits live separately and
 * always win over it (see `buildDebtCalculationInput`).
 */
export const buildMonthPrefill = ({
  companyId,
  payments = [],
  services = [],
  timeZone,
}: IBuildMonthPrefillArgs): Record<string, IMonthPrefill> => {
  const prefill: Record<string, IMonthPrefill> = {}
  const at = (period: string): IMonthPrefill =>
    (prefill[period] = prefill[period] ?? {})

  for (const service of services) {
    const period = periodOfDate(service?.date, timeZone)
    const tariff = Number(service?.rentPrice)

    if (period && Number.isFinite(tariff) && tariff > 0) {
      at(period).tariff = tariff
    }
  }

  for (const payment of payments) {
    if (companyId && idOf(payment?.company) !== companyId) continue

    if (payment?.type === Operations.Credit) {
      const period = periodOfDate(
        payment.paidAt ?? payment.invoiceCreationDate,
        timeZone
      )
      if (!period) continue

      at(period).paid =
        (at(period).paid ?? 0) + (Number(payment.generalSum) || 0)
      continue
    }

    if (payment?.type !== Operations.Debit) continue

    const monthService = payment.monthService
    const serviceDate =
      typeof monthService === 'string' ? undefined : monthService?.date
    const period = periodOfDate(
      serviceDate ?? payment.invoiceCreationDate,
      timeZone
    )
    if (!period) continue

    const charged = housingFeeCharged(payment)
    if (charged != null) {
      const correction = housingFeeCorrection(payment)
      at(period).charged = (at(period).charged ?? 0) + charged - correction
      if (correction !== 0) {
        at(period).correction = (at(period).correction ?? 0) + correction
      }
    }

    const brought = (payment.invoice ?? []).filter(isOpeningBalanceLine)
    if (brought.length > 0) {
      at(period).openingBalance = brought.reduce(
        (acc, { sum }) => acc + (Number(sum) || 0),
        at(period).openingBalance ?? 0
      )
    }
  }

  return prefill
}

const round2 = (value: number): number => Math.round(value * 100) / 100

/**
 * The debt at the start of `from`, as the DB tells it - or `undefined` when
 * the DB cannot tell (no «Вхідне сальдо» at or before `from`), in which case
 * the opening debt stays manual as before.
 *
 * History starts at the earliest «Вхідне сальдо»; from there every month's
 * charges minus payments up to `from` are carried in. So a period that starts
 * later than the imported history still opens with the right debt.
 */
export const prefillOpeningDebt = (
  prefill: Record<string, IMonthPrefill>,
  from?: IYearMonth
): number | undefined => {
  if (!from) return undefined

  const start = periodKey(from)
  const months = Object.entries(prefill)
    .map(([period, month]) => ({ key: parsePeriod(period), month }))
    .filter(
      (entry): entry is { key: IYearMonth; month: IMonthPrefill } =>
        !!entry.key && periodKey(entry.key) <= start
    )

  const brought = months.filter(({ month }) => month.openingBalance)
  if (brought.length === 0) return undefined

  const historyStart = Math.min(...brought.map(({ key }) => periodKey(key)))

  const debt = months
    .filter(({ key }) => periodKey(key) >= historyStart)
    .reduce((acc, { key, month }) => {
      const carried =
        periodKey(key) < start ? (month.charged ?? 0) - (month.paid ?? 0) : 0
      return acc + (month.openingBalance ?? 0) + carried
    }, 0)

  return round2(debt)
}
