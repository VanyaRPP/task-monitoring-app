import { IApartmentOverrides, IMonthOverride } from './build-input'
import { IYearMonth } from './months'
import { InflationMethod } from './types'

/** What gets persisted: INPUTS only, never the computed result. */
export interface IDebtCalculationSnapshot {
  domain?: string
  company?: string
  periodFrom?: IYearMonth
  periodTo?: IYearMonth
  annualRatePercent?: number
  inflationMethod?: InflationMethod
  /** `{ companyId: { ...company edits, months: { 'YYYY-MM': {...} } } }` */
  overrides?: Record<string, IApartmentOverrides>
}

const MONTH_FIELDS = [
  'area',
  'tariff',
  'charged',
  'paid',
  'inflationIndex',
] as const

const APARTMENT_FIELDS = [
  'area',
  'tariff',
  'openingDebt',
  'legalFees',
  'courtFee',
] as const

/** Guards against a bloated document: counts run to companies and months, not thousands. */
const MAX_APARTMENTS = 1000
const MAX_MONTHS = 1200

const OBJECT_ID = /^[0-9a-fA-F]{24}$/
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/
/** Long enough to reject junk; Date validates the rest. */
const MAX_TIMESTAMP_LENGTH = 32

const finite = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const num = Number(value)

  return Number.isFinite(num) ? num : undefined
}

const pickNumbers = <K extends string>(
  source: unknown,
  fields: readonly K[]
): Partial<Record<K, number>> => {
  const out: Partial<Record<K, number>> = {}
  if (!source || typeof source !== 'object') return out

  for (const field of fields) {
    const value = finite((source as Record<string, unknown>)[field])
    if (value !== undefined) out[field] = value
  }

  return out
}

/** Accepts only a parseable ISO date, normalized to canonical form. */
const sanitizeTimestamp = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length > MAX_TIMESTAMP_LENGTH) {
    return undefined
  }

  const time = Date.parse(value)

  return Number.isFinite(time) ? new Date(time).toISOString() : undefined
}

const sanitizeMonths = (
  source: unknown
): Record<string, IMonthOverride> | undefined => {
  if (!source || typeof source !== 'object') return undefined

  const out: Record<string, IMonthOverride> = {}
  let count = 0

  for (const [period, raw] of Object.entries(source)) {
    if (!PERIOD.test(period) || count >= MAX_MONTHS) continue

    const month: IMonthOverride = pickNumbers(raw, MONTH_FIELDS)
    const updatedAt = sanitizeTimestamp((raw as IMonthOverride)?.updatedAt)
    // A timestamp on its own, with no value beside it, is an empty row.
    if (Object.keys(month).length === 0) continue
    if (updatedAt) month.updatedAt = updatedAt

    out[period] = month
    count += 1
  }

  return Object.keys(out).length > 0 ? out : undefined
}

const sanitizeYearMonth = (source: unknown): IYearMonth | undefined => {
  const { year, month } = pickNumbers(source, ['year', 'month'] as const)

  return Number.isInteger(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
    ? { year, month }
    : undefined
}

/**
 * Reduces the user's edits to something safe to put into Mongo.
 *
 * This is the trust boundary: the object arrives whole from the browser and
 * lands in a Mixed field. Only known keys with numeric values pass, company
 * keys must be ObjectIds and month keys `YYYY-MM`. Empty branches are dropped
 * so the document does not accrete junk on every save.
 */
export const sanitizeOverrides = (
  source: unknown
): Record<string, IApartmentOverrides> => {
  if (!source || typeof source !== 'object') return {}

  const out: Record<string, IApartmentOverrides> = {}
  let count = 0

  for (const [companyId, raw] of Object.entries(source)) {
    if (!OBJECT_ID.test(companyId) || count >= MAX_APARTMENTS) continue

    const apartment: IApartmentOverrides = pickNumbers(raw, APARTMENT_FIELDS)
    const months = sanitizeMonths((raw as IApartmentOverrides)?.months)
    if (months) apartment.months = months

    if (Object.keys(apartment).length === 0) continue

    out[companyId] = apartment
    count += 1
  }

  return out
}

/** Normalizes the full calculation snapshot before it is written. */
export const sanitizeSnapshot = (source: unknown): IDebtCalculationSnapshot => {
  const raw = (source ?? {}) as Record<string, unknown>
  const domain = String(raw.domain ?? '')
  const company = String(raw.company ?? '')
  const rate = finite(raw.annualRatePercent)

  return {
    ...(OBJECT_ID.test(domain) ? { domain } : {}),
    ...(OBJECT_ID.test(company) ? { company } : {}),
    ...(sanitizeYearMonth(raw.periodFrom)
      ? { periodFrom: sanitizeYearMonth(raw.periodFrom) }
      : {}),
    ...(sanitizeYearMonth(raw.periodTo)
      ? { periodTo: sanitizeYearMonth(raw.periodTo) }
      : {}),
    ...(rate !== undefined && rate >= 0 && rate <= 100
      ? { annualRatePercent: rate }
      : {}),
    inflationMethod: raw.inflationMethod === 'monthly' ? 'monthly' : 'balance',
    overrides: sanitizeOverrides(raw.overrides),
  }
}
