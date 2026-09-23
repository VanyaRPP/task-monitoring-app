import { calculateDebt } from './calculate'
import { IDebtMonthInput } from './types'

/**
 * Golden-фікстура: рядки 160–203 листа «Акт» із `Розрахунок.xlsx` —
 * квартира 67.08 м², період листопад 2021 — червень 2025.
 *
 * Формат: [рік, місяць, сплачено, тариф грн/м², індекс інфляції %].
 * Тариф росте з 5.25 до 6.25 у липні 2024 — це в даних, не помилка.
 */
const AKT_ROWS: [number, number, number, number, number][] = [
  [2021, 11, 0, 5.25, 100.8],
  [2021, 12, 0, 5.25, 100.6],
  [2022, 1, 0, 5.25, 101.3],
  [2022, 2, 0, 5.25, 101.6],
  [2022, 3, 0, 5.25, 104.5],
  [2022, 4, 0, 5.25, 103.1],
  [2022, 5, 0, 5.25, 102.7],
  [2022, 6, 0, 5.25, 103.1],
  [2022, 7, 0, 5.25, 100.7],
  [2022, 8, 0, 5.25, 101.1],
  [2022, 9, 0, 5.25, 101.9],
  [2022, 10, 500, 5.25, 102.5],
  [2022, 11, 0, 5.25, 100.7],
  [2022, 12, 0, 5.25, 100.7],
  [2023, 1, 352.17, 5.25, 100.8],
  [2023, 2, 0, 5.25, 100.7],
  [2023, 3, 0, 5.25, 101.5],
  [2023, 4, 0, 5.25, 100.2],
  [2023, 5, 2000, 5.25, 100.5],
  [2023, 6, 1000, 5.25, 100.8],
  [2023, 7, 1000, 5.25, 99.4],
  [2023, 8, 0, 5.25, 98.6],
  [2023, 9, 0, 5.25, 100.5],
  [2023, 10, 0, 5.25, 100.8],
  [2023, 11, 0, 5.25, 100.5],
  [2023, 12, 0, 5.25, 100.7],
  [2024, 1, 0, 5.25, 100.4],
  [2024, 2, 500, 5.25, 100.3],
  [2024, 3, 0, 5.25, 100.5],
  [2024, 4, 0, 5.25, 100.2],
  [2024, 5, 0, 5.25, 100.6],
  [2024, 6, 0, 5.25, 102.2],
  [2024, 7, 500, 6.25, 100],
  [2024, 8, 0, 6.25, 100.6],
  [2024, 9, 500, 6.25, 101.5],
  [2024, 10, 0, 6.25, 101.8],
  [2024, 11, 0, 6.25, 101.9],
  [2024, 12, 1000, 6.25, 101.4],
  [2025, 1, 1000, 6.25, 101.2],
  [2025, 2, 0, 6.25, 100.8],
  [2025, 3, 0, 6.25, 101.5],
  [2025, 4, 420, 6.25, 100.7],
  [2025, 5, 0, 6.25, 101.3],
  [2025, 6, 500, 6.25, 100.8],
]

const AKT_AREA = 67.08
/** Кол. I9 Акта — «Заборгованість на 01.11.2021». */
const AKT_OPENING_DEBT = 352.17

const aktMonths: IDebtMonthInput[] = AKT_ROWS.map(
  ([year, month, paid, tariff, inflationIndex]) => ({
    year,
    month,
    paid,
    tariff,
    inflationIndex,
    area: AKT_AREA,
  })
)

describe('calculateDebt — golden: Розрахунок.xlsx', () => {
  const result = calculateDebt({
    months: aktMonths,
    openingDebt: AKT_OPENING_DEBT,
  })

  it('дає рядок на кожен місяць періоду', () => {
    expect(result.rows).toHaveLength(44)
  })

  it('відтворює підсумки Акта', () => {
    // C204, D204, J204 — прямі суми з листа.
    expect(result.totals.charged).toBeCloseTo(16300.44, 6)
    expect(result.totals.paid).toBeCloseTo(9272.17, 6)
    expect(result.totals.days).toBe(1338)
  })

  it('відтворює тіло боргу (E207)', () => {
    expect(result.body).toBeCloseTo(7380.44, 6)
  })

  it('відтворює 3% річних (E208 = SUM(H160:H203))', () => {
    expect(result.interest).toBeCloseTo(516.9665973905232, 6)
  })

  it('відтворює інфляційні втрати (E209 = M203)', () => {
    expect(result.inflation).toBeCloseTo(4395.853893921326, 6)
  })

  it('відтворює сукупний коефіцієнт (L203)', () => {
    expect(result.coefficient).toBeCloseTo(1.5956086485251997, 9)
  })

  it('відтворює разом (E205)', () => {
    // 12293.2566 на листі — там M204 вбито числом з 2 знаками замість
    // посилання на M203; від повної точності це відрізняється на 0.0039.
    expect(result.total).toBeCloseTo(12293.26049131185, 6)
  })

  it('не застосовує індекс першого місяця (L160 = 1)', () => {
    const [first] = result.rows

    expect(first.coefficient).toBe(1)
    expect(first.inflationLoss).toBe(0)
    expect(first.debt).toBeCloseTo(704.34, 6)
    expect(first.charged).toBeCloseTo(352.17, 6)
    expect(first.interest).toBeCloseTo(1.7367287671232876, 9)
  })

  it('відтворює другий місяць (рядок 161)', () => {
    const second = result.rows[1]

    expect(second.coefficient).toBeCloseTo(1.006, 9)
    expect(second.debt).toBeCloseTo(1056.51, 6)
    expect(second.inflationLoss).toBeCloseTo(6.33906, 6)
    expect(second.interest).toBeCloseTo(2.691929589041096, 9)
  })

  it('ділить на 366 у високосному 2024-му (H186)', () => {
    const jan2024 = result.rows.find(
      ({ year, month }) => year === 2024 && month === 1
    )

    expect(jan2024.days).toBe(31)
    expect(jan2024.interest).toBeCloseTo(12.726745081967213, 9)
  })

  it('інфляційні = значення останнього місяця, не сума по місяцях', () => {
    const sumOfRows = result.rows.reduce(
      (acc, { inflationLoss }) => acc + inflationLoss,
      0
    )

    expect(result.inflation).toBe(result.rows[43].inflationLoss)
    expect(sumOfRows).toBeGreaterThan(result.inflation)
  })
})

describe('calculateDebt — метод monthly', () => {
  it('індексує кожне нарахування від його власного місяця', () => {
    const result = calculateDebt({
      months: aktMonths,
      openingDebt: AKT_OPENING_DEBT,
      inflationMethod: 'monthly',
    })

    expect(result.inflation).toBeCloseTo(744.9697244172174, 6)
  })

  it('не змінює ні тіло боргу, ні річні', () => {
    const balance = calculateDebt({
      months: aktMonths,
      openingDebt: AKT_OPENING_DEBT,
    })
    const monthly = calculateDebt({
      months: aktMonths,
      openingDebt: AKT_OPENING_DEBT,
      inflationMethod: 'monthly',
    })

    expect(monthly.body).toBe(balance.body)
    expect(monthly.interest).toBe(balance.interest)
  })

  it('оплата гасить найстаріше нарахування першим (FIFO)', () => {
    // Два нарахування по 100; індекс росте лише після другого місяця, тож
    // старий лот індексується 1.10, новий — 1.00. Оплата 100 гасить старий,
    // і на індексацію лишається тільки новий лот, тобто 0.
    const result = calculateDebt({
      months: [
        { year: 2024, month: 1, charged: 100, inflationIndex: 100 },
        { year: 2024, month: 2, charged: 100, paid: 100, inflationIndex: 110 },
      ],
      inflationMethod: 'monthly',
    })

    expect(result.body).toBeCloseTo(100, 6)
    expect(result.inflation).toBeCloseTo(0, 6)
  })

  it('без оплат індексує обидва нарахування їхніми відрізками', () => {
    const result = calculateDebt({
      months: [
        { year: 2024, month: 1, charged: 100, inflationIndex: 100 },
        { year: 2024, month: 2, charged: 100, inflationIndex: 110 },
      ],
      inflationMethod: 'monthly',
    })

    // Перший лот проходить +10%, другий виник уже в місяці з цим індексом.
    expect(result.inflation).toBeCloseTo(10, 6)
    // Метод balance нарахував би 10% на весь залишок 200.
    expect(
      calculateDebt({
        months: [
          { year: 2024, month: 1, charged: 100, inflationIndex: 100 },
          { year: 2024, month: 2, charged: 100, inflationIndex: 110 },
        ],
      }).inflation
    ).toBeCloseTo(20, 6)
  })
})

describe('calculateDebt — межові випадки', () => {
  it('порожній період дає нулі й повертає борг на початок як тіло', () => {
    const result = calculateDebt({ months: [], openingDebt: 500 })

    expect(result.rows).toHaveLength(0)
    expect(result.body).toBe(500)
    expect(result.interest).toBe(0)
    expect(result.inflation).toBe(0)
    expect(result.coefficient).toBe(1)
    expect(result.total).toBe(500)
  })

  it('дефляція не дає від’ємних інфляційних втрат', () => {
    const result = calculateDebt({
      months: [
        { year: 2024, month: 1, charged: 1000, inflationIndex: 100 },
        { year: 2024, month: 2, charged: 0, inflationIndex: 95 },
      ],
    })

    expect(result.coefficient).toBeCloseTo(0.95, 9)
    expect(result.inflation).toBe(0)
  })

  it('рахує нараховане як площа × тариф із заокругленням до копійки', () => {
    const result = calculateDebt({
      months: [{ year: 2024, month: 1, area: 67.08, tariff: 5.25 }],
    })

    expect(result.rows[0].charged).toBe(352.17)
  })

  it('явно задане «нараховано» перекриває площу й тариф', () => {
    const result = calculateDebt({
      months: [
        { year: 2024, month: 1, area: 67.08, tariff: 5.25, charged: 400 },
      ],
    })

    expect(result.rows[0].charged).toBe(400)
  })

  it('взятий з пропущеного місяця індекс не зсуває коефіцієнт', () => {
    const result = calculateDebt({
      months: [
        { year: 2024, month: 1, charged: 100, inflationIndex: 100 },
        { year: 2024, month: 2, charged: 100 },
      ],
    })

    expect(result.coefficient).toBe(1)
  })

  it('поважає ставку, відмінну від 3%', () => {
    const base = calculateDebt({
      months: [{ year: 2023, month: 1, charged: 36500 }],
    })
    const doubled = calculateDebt({
      months: [{ year: 2023, month: 1, charged: 36500 }],
      annualRatePercent: 6,
    })

    expect(base.interest).toBeCloseTo(93, 6)
    expect(doubled.interest).toBeCloseTo(186, 6)
  })

  it('interestOnCurrentCharge: false знімає річні з внеску того ж місяця', () => {
    const result = calculateDebt({
      months: [{ year: 2023, month: 1, charged: 36500 }],
      interestOnCurrentCharge: false,
    })

    expect(result.interest).toBe(0)
    expect(result.body).toBe(36500)
  })

  it('переплата не породжує від’ємних річних', () => {
    const result = calculateDebt({
      months: [{ year: 2023, month: 1, charged: 100, paid: 1000 }],
    })

    expect(result.body).toBeCloseTo(-900, 6)
    expect(result.interest).toBe(0)
  })

  it('додає юридичні послуги та держмито в підсумок', () => {
    const result = calculateDebt({
      months: [{ year: 2023, month: 1, charged: 1000 }],
      legalFees: 3000,
      courtFee: 1211.2,
    })

    expect(result.total).toBeCloseTo(
      result.body + result.interest + result.inflation + 3000 + 1211.2,
      6
    )
  })
})
