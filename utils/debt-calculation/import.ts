import { IMonthOverride } from './build-input'
import { formatPeriod, IYearMonth, periodKey } from './months'
import { IDebtCalculationSnapshot } from './serialize'

/** One month read off a statement photo. */
export interface IDebtImportRow extends IYearMonth {
  charged: number
  /** Change to the debt, negative lowers it. */
  correction: number
  paid: number
}

export interface IDebtImport {
  domain: string
  company: string
  rows: IDebtImportRow[]
  /** Debt at the start of the first imported month. */
  openingDebt?: number
}

/** Marks a month whose figures came off a photo, until someone edits it by hand. */
export const PHOTO_SOURCE = 'photo'

const earlier = (a: IYearMonth, b: IYearMonth): IYearMonth =>
  periodKey(a) <= periodKey(b) ? a : b

const later = (a: IYearMonth, b: IYearMonth): IYearMonth =>
  periodKey(a) >= periodKey(b) ? a : b

/**
 * Lays months read off a photo over a company's saved calculation.
 *
 * Imported months become manual edits, exactly as if typed on the page, so
 * they outrank what the DB prefills and can be corrected in the table before
 * anything turns into payments. Each carries `source: 'photo'` and an
 * `updatedAt`, so the page can point out what still needs a look. Months
 * outside the import and every other setting are left alone.
 *
 * The period only ever widens. The opening debt is taken from the statement
 * only when the import reaches back to (or before) the period start - that is
 * the one case where the statement's opening balance is the debt the
 * calculation starts from. An import that lands mid-period must not reset it.
 */
export const mergeDebtImport = (
  existing: IDebtCalculationSnapshot | null | undefined,
  { domain, company, rows, openingDebt }: IDebtImport,
  now: string
): IDebtCalculationSnapshot => {
  if (rows.length === 0) {
    throw new Error('Nothing to import')
  }

  const sorted = [...rows].sort((a, b) => periodKey(a) - periodKey(b))
  const first: IYearMonth = { year: sorted[0].year, month: sorted[0].month }
  const lastRow = sorted[sorted.length - 1]
  const last: IYearMonth = { year: lastRow.year, month: lastRow.month }

  const current = existing?.overrides?.[company] ?? {}
  const months: Record<string, IMonthOverride> = { ...current.months }

  for (const { year, month, charged, correction, paid } of sorted) {
    const period = formatPeriod({ year, month })
    months[period] = {
      ...months[period],
      charged,
      correction,
      paid,
      source: PHOTO_SOURCE,
      updatedAt: now,
    }
  }

  const reachesStart =
    !existing?.periodFrom || periodKey(first) <= periodKey(existing.periodFrom)

  return {
    domain,
    company,
    periodFrom: existing?.periodFrom
      ? earlier(first, existing.periodFrom)
      : first,
    periodTo: existing?.periodTo ? later(last, existing.periodTo) : last,
    ...(existing?.annualRatePercent !== undefined
      ? { annualRatePercent: existing.annualRatePercent }
      : {}),
    inflationMethod: existing?.inflationMethod ?? 'balance',
    overrides: {
      ...existing?.overrides,
      [company]: {
        ...current,
        ...(reachesStart && openingDebt !== undefined ? { openingDebt } : {}),
        months,
      },
    },
  }
}
