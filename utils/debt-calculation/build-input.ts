import { IInflationIndex } from '@modules/models/InflationIndex'
import { buildMonthRange, formatPeriod, IYearMonth } from './months'
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  IDebtCalculationInput,
  IDebtMonthInput,
  InflationMethod,
} from './types'

/** A manual edit of one month. An empty field falls back to the default. */
export interface IMonthOverride {
  area?: number
  tariff?: number
  charged?: number
  /** Change to the debt, negative lowers it (see `IDebtMonthInput`). */
  correction?: number
  paid?: number
  inflationIndex?: number
  /** `'photo'` while the month holds figures read off a photo, untouched since. */
  source?: string
  /** ISO stamp of the last manual edit of this month, surfaced in the UI. */
  updatedAt?: string
}

/** Manual edits for one company; keys in `months` are `YYYY-MM`. */
export interface IApartmentOverrides {
  area?: number
  tariff?: number
  openingDebt?: number
  legalFees?: number
  courtFee?: number
  months?: Record<string, IMonthOverride>
}

/** The bare minimum needed from a company, so we avoid dragging in IRealestate. */
export interface IApartmentDefaults {
  totalArea?: number
  pricePerMeter?: number
}

export interface IBuildDebtInputArgs {
  company?: IApartmentDefaults | null
  from?: IYearMonth
  to?: IYearMonth
  /** The CPI reference table collapsed into `{ 'YYYY-MM': 100.8 }`. */
  indexByPeriod?: Record<string, number>
  overrides?: IApartmentOverrides
  /**
   * Prefilled from the DB per month (keys are `YYYY-MM`). Ranks BELOW any
   * manual edit: the user always outranks the database.
   */
  prefillMonths?: Record<string, IMonthOverride & { openingBalance?: number }>
  /**
   * The debt at the period start derived from the DB history (see
   * `prefillOpeningDebt`). A manual opening debt still wins.
   */
  prefillOpeningDebt?: number
  annualRatePercent?: number
  inflationMethod?: InflationMethod
}

/** Collapses the reference-table response into a map keyed by period. */
export const indexesByPeriod = (
  indexes: Pick<IInflationIndex, 'year' | 'month' | 'value'>[] = []
): Record<string, number> =>
  indexes.reduce<Record<string, number>>((acc, { year, month, value }) => {
    acc[formatPeriod({ year, month })] = value
    return acc
  }, {})

/**
 * Assembles the input for {@link calculateDebt} out of what the page holds.
 *
 * Precedence runs from most to least specific:
 * month edit → company edit → DB prefill → company record.
 *
 * `charged` deliberately has no default: until it is typed in, the engine
 * derives `area × tariff` itself, so editing either shows up in the total at
 * once.
 */
export const buildDebtCalculationInput = ({
  company,
  from,
  to,
  indexByPeriod = {},
  overrides = {},
  prefillMonths = {},
  prefillOpeningDebt,
  annualRatePercent = DEFAULT_ANNUAL_RATE_PERCENT,
  inflationMethod = 'balance',
}: IBuildDebtInputArgs): IDebtCalculationInput => {
  const months: IDebtMonthInput[] = buildMonthRange(from, to).map(
    (yearMonth) => {
      const period = formatPeriod(yearMonth)
      const month = overrides.months?.[period] ?? {}
      const prefill = prefillMonths[period] ?? {}
      // A «Вхідне сальдо» dated inside the period (after its first month) is a
      // debt that appears that month; at the first month it is the opening debt.
      const brought =
        prefill.openingBalance && from && formatPeriod(from) !== period
          ? prefill.openingBalance
          : 0
      const prefillCharged =
        brought !== 0 ? (prefill.charged ?? 0) + brought : prefill.charged

      return {
        ...yearMonth,
        area:
          month.area ??
          overrides.area ??
          prefill.area ??
          company?.totalArea ??
          0,
        tariff:
          month.tariff ??
          overrides.tariff ??
          prefill.tariff ??
          company?.pricePerMeter ??
          0,
        charged: month.charged ?? prefillCharged,
        correction: month.correction ?? prefill.correction,
        paid: month.paid ?? prefill.paid ?? 0,
        inflationIndex:
          month.inflationIndex ??
          prefill.inflationIndex ??
          indexByPeriod[period],
      }
    }
  )

  return {
    months,
    openingDebt: overrides.openingDebt ?? prefillOpeningDebt ?? 0,
    annualRatePercent,
    inflationMethod,
    legalFees: overrides.legalFees ?? 0,
    courtFee: overrides.courtFee ?? 0,
  }
}

/**
 * The company's edits without the figures that now live in payments: the
 * charge, correction and payment of the given months, and optionally the
 * opening debt. Area, tariff and index edits stay.
 *
 * A typed-in zero charge stays too: a month the paper billed nothing for gets
 * no invoice, and without the zero it would fall back to area × tariff and
 * show a debt that never existed.
 */
export const withoutTypedFigures = (
  overrides: IApartmentOverrides,
  periods: string[],
  openingDebt: boolean
): IApartmentOverrides => {
  const months = { ...overrides.months }

  for (const period of periods) {
    const month = months[period]
    if (!month) continue

    const kept: IMonthOverride = {}
    for (const [field, value] of Object.entries(month)) {
      if (
        !['charged', 'correction', 'paid', 'source', 'updatedAt'].includes(
          field
        )
      ) {
        kept[field] = value
      }
    }
    if (month.charged === 0) kept.charged = 0

    if (Object.keys(kept).length > 0) months[period] = kept
    else delete months[period]
  }

  const next: IApartmentOverrides = { ...overrides, months }
  if (openingDebt) delete next.openingDebt

  return next
}
