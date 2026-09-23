import { IYearMonth } from './months'

/**
 * How inflation losses are accrued.
 *
 * `balance` - what the paper Act does: the cumulative index for the whole
 *   period multiplies the ENTIRE outstanding balance, recent charges included.
 *
 * `monthly` - what art. 625 of the Civil Code and Supreme Court practice
 *   require: every charge is indexed from the month FOLLOWING the one it arose
 *   in, and payments settle the oldest debt first (FIFO). Yields a noticeably
 *   smaller figure.
 */
export type InflationMethod = 'balance' | 'monthly'

/** Annual rate under art. 625 of the Civil Code, absent a contractual one. */
export const DEFAULT_ANNUAL_RATE_PERCENT = 3

/** One month of the period - typed in by hand or prefilled from the DB. */
export interface IDebtMonthInput extends IYearMonth {
  /** Total area, m². */
  area?: number
  /** Tariff (membership fee), UAH per m². */
  tariff?: number
  /** Charged, UAH. Computed as `area × tariff` when omitted. */
  charged?: number
  /** Paid, UAH. */
  paid?: number
  /** Monthly consumer price index, %: `100.8` means +0.8%. */
  inflationIndex?: number
}

export interface IDebtCalculationInput {
  months: IDebtMonthInput[]
  /** Opening debt for the period, UAH. */
  openingDebt?: number
  /** Annual rate, %. Defaults to {@link DEFAULT_ANNUAL_RATE_PERCENT}. */
  annualRatePercent?: number
  /** Defaults to `balance`, matching the Act. */
  inflationMethod?: InflationMethod
  /**
   * Whether interest accrues on a charge during the very month it was billed.
   *
   * `true` (default) reproduces the Act. `false` approximates a by-law whose
   * due date falls in the following month, so a charge only starts accruing
   * from the next month. The exact due day will land here once the HOA
   * confirms it.
   */
  interestOnCurrentCharge?: boolean
  /** Legal fees, UAH - its own line in the summary. */
  legalFees?: number
  /** Court fee, UAH - its own line in the summary. */
  courtFee?: number
}

/** A calculated month - one row of the monthly breakdown. */
export interface IDebtMonthRow extends IYearMonth {
  area: number
  tariff: number
  /** Charged, UAH (column D of the Act). */
  charged: number
  /** Paid, UAH (column C). */
  paid: number
  /** Debt at month end, UAH (column I). */
  debt: number
  /** Calendar days in the month (column J). */
  days: number
  /** Monthly inflation index, % (column K). */
  inflationIndex: number
  /** Cumulative indexation coefficient since the period start (column L). */
  coefficient: number
  /** Inflation losses as of this month, UAH (column M). */
  inflationLoss: number
  /** Annual interest for this month, UAH (column H). */
  interest: number
}

export interface IDebtCalculationResult {
  rows: IDebtMonthRow[]
  totals: {
    charged: number
    paid: number
    /** Interest summed over every month - this is what the summary shows. */
    interest: number
    days: number
  }
  /** Principal: `opening debt + Σ charged − Σ paid`. */
  body: number
  /** Annual interest - mirrors `totals.interest` so the summary reads well. */
  interest: number
  /**
   * Inflation losses under the chosen method.
   *
   * This is the LAST month's figure, not a sum across months: the coefficient
   * is cumulative and already covers the whole period.
   */
  inflation: number
  /** Cumulative indexation coefficient for the period. */
  coefficient: number
  legalFees: number
  courtFee: number
  /** `body + interest + inflation + legalFees + courtFee`. */
  total: number
}
