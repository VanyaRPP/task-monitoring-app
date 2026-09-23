import { toRoundFixed } from '@utils/helpers'
import { daysInMonth, daysInYear } from './months'
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  IDebtCalculationInput,
  IDebtCalculationResult,
  IDebtMonthRow,
} from './types'

/**
 * Непогашена частина одного нарахування разом із коефіцієнтом індексації того
 * місяця, в якому воно виникло. Потрібен лише методу `monthly`.
 */
interface IDebtLot {
  amount: number
  coefficient: number
}

/** Копійчаний допуск — щоб залишок 1e-12 не тримав лот "живим". */
const EPSILON = 1e-9

const round2 = (value: number): number => +toRoundFixed(value)

/** Оплата гасить найстаріші нарахування першими (FIFO). */
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
 * Інфляційні втрати помісячним методом: кожен непогашений лот індексується
 * власним відрізком періоду, а дефляційний відрізок не йде в мінус.
 */
const lotsInflation = (lots: IDebtLot[], coefficient: number): number =>
  lots.reduce(
    (acc, lot) =>
      acc + lot.amount * Math.max(coefficient / lot.coefficient - 1, 0),
    0
  )

/**
 * Розрахунок заборгованості за послуги з управління багатоквартирним будинком,
 * 3% річних та інфляційних втрат.
 *
 * Відтворює Акт ОСББ (`Розрахунок.xlsx`) один-в-один при
 * `inflationMethod: 'balance'` — див. golden-тест у `calculate.test.ts`.
 *
 * Ключові правила, які легко загубити:
 * - індекс ПЕРШОГО місяця не застосовується: індексація починається з місяця,
 *   наступного за місяцем виникнення боргу (ст. 625 ЦК, лист ВСУ № 62-97р);
 * - інфляційні втрати — це значення останнього місяця, а НЕ сума по місяцях:
 *   коефіцієнт уже накопичувальний;
 * - річні ж навпаки додаються за кожен місяць окремо;
 * - дефляція не дає від'ємних втрат.
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
