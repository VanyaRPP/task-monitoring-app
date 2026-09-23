import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Operations, ServiceType } from '@utils/constants'
import { resolveServiceType } from '@utils/domain/resolve-service-type'
import dayjs from 'dayjs'
import { IMonthOverride } from './build-input'
import { formatPeriod } from './months'

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
}

/**
 * The month is read in local time, like everywhere else in the app.
 *
 * Monthly-service dates are created with `dayjs(...).startOf('month')` in Kyiv
 * time and land in the DB as a UTC instant a few hours earlier. Reading them
 * with `getUTCMonth` would shift such a record into the previous month.
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

/**
 * Builds the per-month prefill from what the DB already holds: the tariff
 * from the domain's monthly services, charges from debit invoices, payments
 * from credit records.
 *
 * This is strictly a PREFILL: the user's manual edits live separately and
 * always win over it (see `buildDebtCalculationInput`).
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
