import { toRoundFixed } from '@utils/helpers'
import { daysInMonth, daysInYear } from './months'
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  IDebtCalculationInput,
  IDebtCalculationResult,
  IDebtMonthRow,
} from './types'

/**
 * The unpaid remainder of a single charge together with the indexation
 * coefficient of the month it arose in. Only the `monthly` method needs it.
 */
interface IDebtLot {
  amount: number
  coefficient: number
}

/** Sub-kopeck tolerance, so a 1e-12 remainder does not keep a lot alive. */
const EPSILON = 1e-9

const round2 = (value: number): number => +toRoundFixed(value)

/** A payment settles the oldest charges first (FIFO). */
const applyPayment = (lots: IDebtLot[], paid: number): void => {
  let rest = paid

  while (rest > EPSILON && lots.length > 0) {
    const [oldest] = lots

    if (oldest.amount <= rest + EPSILON) {
      rest -= oldest.amount
      lots.shift()
    } else {
      oldest.amount -= rest
      rest = 0
    }
  }
}

/**
 * Inflation losses, monthly method: every unpaid lot is indexed over its own
 * slice of the period, and a deflationary slice never goes negative.
 */
const lotsInflation = (lots: IDebtLot[], coefficient: number): number =>
  lots.reduce(
    (acc, lot) =>
      acc + lot.amount * Math.max(coefficient / lot.coefficient - 1, 0),
    0
  )

/**
 * Debt for multi-apartment building management services, plus annual interest
 * and inflation losses.
 *
 * With `inflationMethod: 'balance'` this reproduces the HOA Act
 * (`Розрахунок.xlsx`) to the kopeck - see the golden test in
 * `calculate.test.ts`.
 *
 * Rules that are easy to lose:
 * - the FIRST month's index is never applied: indexation starts from the month
 *   following the one the debt arose in (art. 625 Civil Code, Supreme Court
 *   letter 62-97р);
 * - inflation losses are the last month's value, NOT a sum across months, as
 *   the coefficient is already cumulative;
 * - interest, by contrast, IS summed month by month;
 * - deflation never produces negative losses.
 */
export const calculateDebt = ({
  months = [],
  openingDebt = 0,
  annualRatePercent = DEFAULT_ANNUAL_RATE_PERCENT,
  inflationMethod = 'balance',
  interestOnCurrentCharge = true,
  legalFees = 0,
  courtFee = 0,
}: IDebtCalculationInput): IDebtCalculationResult => {
  const lots: IDebtLot[] = []
  if (openingDebt > 0) {
    lots.push({ amount: openingDebt, coefficient: 1 })
  }

  const rows: IDebtMonthRow[] = []
  let debt = openingDebt
  let coefficient = 1
  let totalCharged = 0
  let totalPaid = 0
  let totalInterest = 0
  let totalDays = 0

  months.forEach((month, index) => {
    const area = +month.area || 0
    const tariff = +month.tariff || 0
    const charged =
      month.charged == null ? round2(area * tariff) : +month.charged || 0
    const paid = +month.paid || 0
    const inflationIndex = +month.inflationIndex || 100

    coefficient = index === 0 ? 1 : coefficient * (inflationIndex / 100)

    const debtBeforeCharge = debt - paid
    debt = debtBeforeCharge + charged

    lots.push({ amount: charged, coefficient })
    applyPayment(lots, paid)

    const days = daysInMonth(month.year, month.month)
    const interestBase = interestOnCurrentCharge ? debt : debtBeforeCharge
    const interest =
      ((Math.max(interestBase, 0) * (annualRatePercent / 100)) /
        daysInYear(month.year)) *
      days

    rows.push({
      year: month.year,
      month: month.month,
      area,
      tariff,
      charged,
      paid,
      debt,
      days,
      inflationIndex,
      coefficient,
      inflationLoss:
        inflationMethod === 'monthly'
          ? lotsInflation(lots, coefficient)
          : Math.max(debt * coefficient - debt, 0),
      interest,
    })

    totalCharged += charged
    totalPaid += paid
    totalInterest += interest
    totalDays += days
  })

  const last = rows[rows.length - 1]
  const body = last ? last.debt : openingDebt
  const inflation = last ? last.inflationLoss : 0

  return {
    rows,
    totals: {
      charged: totalCharged,
      paid: totalPaid,
      interest: totalInterest,
      days: totalDays,
    },
    body,
    interest: totalInterest,
    inflation,
    coefficient: last ? last.coefficient : 1,
    legalFees,
    courtFee,
    total: body + totalInterest + inflation + legalFees + courtFee,
  }
}
