import { toRoundFixed } from '@utils/helpers'
import { excludedRanges, monthExclusion } from './exclusions'
import { accrualDays, clampStartDay, daysInMonth, daysInYear } from './months'
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

const lotLoss = (amount: number, lot: IDebtLot, coefficient: number) =>
  amount * Math.max(coefficient / lot.coefficient - 1, 0)

/**
 * A payment settles the oldest charges first (FIFO). Returns the inflation
 * losses the settled amounts had run up by `coefficient` - paying a debt stops
 * its indexation, it does not undo what already accrued (art. 625 § 2) - and
 * what was left over once no charge was open (an overpayment).
 */
const applyPayment = (
  lots: IDebtLot[],
  paid: number,
  coefficient: number
): { settledLoss: number; overpaid: number } => {
  let rest = paid
  let settledLoss = 0

  while (rest > EPSILON && lots.length > 0) {
    const [oldest] = lots
    const settled = Math.min(oldest.amount, rest)
    settledLoss += lotLoss(settled, oldest, coefficient)

    if (oldest.amount <= rest + EPSILON) {
      rest -= oldest.amount
      lots.shift()
    } else {
      oldest.amount -= rest
      rest = 0
    }
  }
  return { settledLoss, overpaid: Math.max(rest, 0) }
}

/**
 * Inflation losses, monthly method: every unpaid lot is indexed over its own
 * slice of the period, and a deflationary slice never goes negative.
 */
const lotsInflation = (lots: IDebtLot[], coefficient: number): number =>
  lots.reduce((acc, lot) => acc + lotLoss(lot.amount, lot, coefficient), 0)

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
 * - deflation never produces negative losses;
 * - monthly method: what a paid lot had run up stays in the losses - a
 *   payment is applied at the start of its month, so that month's index does
 *   not reach the paid part;
 * - an excluded period (moratorium) takes its days out of the interest and
 *   its months out of the coefficient (see `exclusions.ts`); the debt moves
 *   as usual.
 */
export const calculateDebt = ({
  months = [],
  openingDebt = 0,
  annualRatePercent = DEFAULT_ANNUAL_RATE_PERCENT,
  inflationMethod = 'balance',
  interestOnCurrentCharge = true,
  legalFees = 0,
  courtFee = 0,
  excludedPeriods = [],
}: IDebtCalculationInput): IDebtCalculationResult => {
  const exclusions = excludedRanges(excludedPeriods)
  const lots: IDebtLot[] = []
  if (openingDebt > 0) {
    lots.push({ amount: openingDebt, coefficient: 1 })
  }

  const rows: IDebtMonthRow[] = []
  let debt = openingDebt
  let coefficient = 1
  // Monthly method: losses of the debt already paid off, kept as they were.
  let settledLoss = 0
  // Paid beyond what was owed: it settles the next charges, as it lowers the debt.
  let credit = 0
  let totalCharged = 0
  let totalCorrection = 0
  let totalPaid = 0
  let totalInterest = 0
  let totalDays = 0

  months.forEach((month, index) => {
    const area = +month.area || 0
    const tariff = +month.tariff || 0
    const calendarDays = daysInMonth(month.year, month.month)
    // The days the debt runs for in this month: the whole month, or from the
    // start day, or as typed. A charge worked out here follows them - a debt
    // from the 10th is billed for the days left - while one typed in or taken
    // from an invoice is the figure itself.
    const accrual = accrualDays(month.year, month.month, month)
    const charged =
      month.charged == null
        ? round2((area * tariff * accrual) / calendarDays)
        : +month.charged || 0
    const correction = +month.correction || 0
    const paid = +month.paid || 0
    const inflationIndex = +month.inflationIndex || 100

    const exclusion = monthExclusion(
      exclusions,
      month.year,
      month.month,
      // Excluded days count only among the days that accrue: from the start
      // day, or - for days typed in - anywhere in the month.
      month.days == null ? clampStartDay(month.startDay, calendarDays) : 1
    )
    const excludedDays = exclusion.excludedDays
    // The first month's index never applies (see above).
    const indexApplied = index > 0 && exclusion.indexApplies
    const previousCoefficient = coefficient
    coefficient =
      index === 0
        ? 1
        : indexApplied
          ? coefficient * (inflationIndex / 100)
          : coefficient

    // A correction adjusts what the month billed: it moves the debt with the
    // charge. One that outweighs the charge settles older debt, like a payment.
    const billed = charged + correction
    const opening = debt
    const debtBeforeCharge = debt - paid
    debt = debtBeforeCharge + billed

    if (billed > 0) {
      const covered = Math.min(credit, billed)
      credit -= covered
      if (billed - covered > EPSILON) {
        lots.push({ amount: billed - covered, coefficient })
      }
    }
    const settled = applyPayment(
      lots,
      paid + Math.max(-billed, 0),
      previousCoefficient
    )
    settledLoss += settled.settledLoss
    credit += settled.overpaid

    // Interest days: those accruing, less any in an excluded period.
    const days = Math.max(accrual - excludedDays, 0)
    const interestBase = interestOnCurrentCharge ? debt : debtBeforeCharge
    const interest =
      ((Math.max(interestBase, 0) * (annualRatePercent / 100)) /
        daysInYear(month.year)) *
      days

    rows.push({
      year: month.year,
      month: month.month,
      opening,
      area,
      tariff,
      charged,
      correction,
      paid,
      debt,
      days,
      excludedDays,
      indexApplied,
      inflationIndex,
      coefficient,
      inflationLoss:
        inflationMethod === 'monthly'
          ? settledLoss + lotsInflation(lots, coefficient)
          : Math.max(debt * coefficient - debt, 0),
      interest,
    })

    totalCharged += charged
    totalCorrection += correction
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
      correction: totalCorrection,
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
