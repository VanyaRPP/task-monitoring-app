import { IApartmentOverrides, IMonthOverride } from './build-input'
import { IYearMonth } from './months'
import { InflationMethod } from './types'

/** Те, що зберігається: тільки ВХІДНІ дані, ніколи не результат. */
export interface IDebtCalculationSnapshot {
  domain?: string
  periodFrom?: IYearMonth
  periodTo?: IYearMonth
  annualRatePercent?: number
  inflationMethod?: InflationMethod
  /** `{ companyId: { ...правки квартири, months: { 'YYYY-MM': {...} } } }` */
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

/** Межі проти роздутого документа: рахунок іде на квартири й місяці, не тисячі. */
const MAX_APARTMENTS = 1000
const MAX_MONTHS = 1200

const OBJECT_ID = /^[0-9a-fA-F]{24}$/
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/

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

const sanitizeMonths = (
  source: unknown
): Record<string, IMonthOverride> | undefined => {
  if (!source || typeof source !== 'object') return undefined

  const out: Record<string, IMonthOverride> = {}
  let count = 0

  for (const [period, raw] of Object.entries(source)) {
    if (!PERIOD.test(period) || count >= MAX_MONTHS) continue

    const month = pickNumbers(raw, MONTH_FIELDS)
    if (Object.keys(month).length === 0) continue

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
 * Приводить правки користувача до того, що безпечно класти в Mongo.
 *
 * Це межа довіри: об'єкт приходить із браузера цілим і лягає в поле типу
 * Mixed. Пропускаємо лише відомі ключі з числовими значеннями, ключі квартир
 * мають бути ObjectId, ключі місяців — `YYYY-MM`. Порожні гілки викидаємо, щоб
 * документ не обростав сміттям на кожному збереженні.
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

/** Нормалізує повний знімок розрахунку перед записом у базу. */
export const sanitizeSnapshot = (source: unknown): IDebtCalculationSnapshot => {
  const raw = (source ?? {}) as Record<string, unknown>
  const domain = String(raw.domain ?? '')
  const rate = finite(raw.annualRatePercent)

  return {
    ...(OBJECT_ID.test(domain) ? { domain } : {}),
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
