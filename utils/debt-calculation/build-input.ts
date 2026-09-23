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
  paid?: number
  inflationIndex?: number
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
  prefillMonths?: Record<string, IMonthOverride>
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
  annualRatePercent = DEFAULT_ANNUAL_RATE_PERCENT,
  inflationMethod = 'balance',
}: IBuildDebtInputArgs): IDebtCalculationInput => {
  const months: IDebtMonthInput[] = buildMonthRange(from, to).map(
    (yearMonth) => {
      const period = formatPeriod(yearMonth)
      const month = overrides.months?.[period] ?? {}
      const prefill = prefillMonths[period] ?? {}

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
        charged: month.charged ?? prefill.charged,
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
    openingDebt: overrides.openingDebt ?? 0,
    annualRatePercent,
    inflationMethod,
    legalFees: overrides.legalFees ?? 0,
    courtFee: overrides.courtFee ?? 0,
  }
}
