import { calculateDebt } from './calculate'
import { resolveExcludedPeriods } from './excludedPeriodPresets'
import {
  dayNumber,
  excludedRanges,
  IExcludedPeriod,
  monthExclusion,
  periodsWithin,
} from './exclusions'
import { IDebtMonthInput } from './types'

const period = (
  startDate: string,
  endDate: string,
  type: IExcludedPeriod['type'] = 'custom'
): IExcludedPeriod => ({
  id: `${startDate}-${endDate}`,
  type,
  startDate,
  endDate,
})

const CMU_206 = period('2022-02-24', '2023-12-29', 'cmu_206')

/** Months with a fixed charge and index, made-up figures. */
const months = (
  from: [number, number],
  count: number,
  extra: (index: number) => Partial<IDebtMonthInput> = () => ({})
): IDebtMonthInput[] =>
  Array.from({ length: count }, (_, index) => {
    const total = from[0] * 12 + from[1] - 1 + index
    return {
      year: Math.floor(total / 12),
      month: (total % 12) + 1,
      charged: 100,
      inflationIndex: 102,
      ...extra(index),
    }
  })

describe('excludedRanges / monthExclusion', () => {
  it('counts overlapping and touching periods once', () => {
    const ranges = excludedRanges([
      period('2025-03-01', '2025-03-20'),
      period('2025-03-10', '2025-04-05'),
      period('2025-04-06', '2025-04-10'),
    ])
    expect(ranges).toHaveLength(1)
    expect(monthExclusion(ranges, 2025, 3).excludedDays).toBe(31)
    expect(monthExclusion(ranges, 2025, 4).excludedDays).toBe(10)
  })

  it('ignores a reversed or unreadable period', () => {
    expect(
      excludedRanges([
        period('2025-05-10', '2025-05-01'),
        period('2025-02-30', '2025-03-01'),
        period('', '2025-03-01'),
      ])
    ).toEqual([])
    expect(dayNumber('2024-02-29')).not.toBeNull()
    expect(dayNumber('2025-02-29')).toBeNull()
  })

  it('КМУ №206: February 2022 keeps its index, December 2023 loses it', () => {
    const ranges = excludedRanges([CMU_206])
    // 24-28 Feb excluded: 23 days remain.
    expect(monthExclusion(ranges, 2022, 2)).toEqual({
      excludedDays: 5,
      indexApplies: true,
    })
    expect(monthExclusion(ranges, 2022, 3)).toEqual({
      excludedDays: 31,
      indexApplies: false,
    })
    // 1-29 Dec excluded: 2 days remain.
    expect(monthExclusion(ranges, 2023, 12)).toEqual({
      excludedDays: 29,
      indexApplies: false,
    })
    expect(monthExclusion(ranges, 2024, 1)).toEqual({
      excludedDays: 0,
      indexApplies: true,
    })
  })

  it('takes the 16-day line exactly: 16 days left keep the index, 15 do not', () => {
    // April has 30 days.
    expect(
      monthExclusion(
        excludedRanges([period('2025-04-01', '2025-04-14')]),
        2025,
        4
      ).indexApplies
    ).toBe(true)
    expect(
      monthExclusion(
        excludedRanges([period('2025-04-01', '2025-04-15')]),
        2025,
        4
      ).indexApplies
    ).toBe(false)
  })
})

describe('calculateDebt - monthly method, payments', () => {
  it('a partial payment keeps the losses the paid debt had already run up', () => {
    // 1000 owed from January; +10% in February and March; half paid in April.
    const input = (paid: number): IDebtMonthInput[] => [
      { year: 2025, month: 1, charged: 1000, inflationIndex: 100 },
      { year: 2025, month: 2, charged: 0, inflationIndex: 110 },
      { year: 2025, month: 3, charged: 0, inflationIndex: 110 },
      { year: 2025, month: 4, charged: 0, paid, inflationIndex: 100 },
    ]
    const before = calculateDebt({
      months: input(0).slice(0, 3),
      inflationMethod: 'monthly',
    })
    const after = calculateDebt({
      months: input(500),
      inflationMethod: 'monthly',
    })

    expect(before.inflation).toBeCloseTo(210, 6) // 1000 × (1.21 − 1)
    // Nothing is lost: 500 paid keeps its 105, the open 500 its 105.
    expect(after.inflation).toBeCloseTo(210, 6)
    expect(after.body).toBe(500)
  })

  it('a full payment stops indexation of that debt', () => {
    const result = calculateDebt({
      months: [
        { year: 2025, month: 1, charged: 1000, inflationIndex: 100 },
        { year: 2025, month: 2, charged: 0, inflationIndex: 110 },
        { year: 2025, month: 3, charged: 0, paid: 1000, inflationIndex: 150 },
        { year: 2025, month: 4, charged: 0, inflationIndex: 150 },
      ],
      inflationMethod: 'monthly',
    })

    // Paid at the start of March: only February's 10% stays, later rises don't reach it.
    expect(
      result.rows.map(({ inflationLoss }) => +inflationLoss.toFixed(2))
    ).toEqual([0, 100, 100, 100])
  })

  it('an overpayment settles the next charge instead of vanishing', () => {
    // 100 owed in January, 150 paid in February: 50 over. March bills 100, of
    // which 50 is already covered, so only 50 is left to index.
    const result = calculateDebt({
      months: [
        { year: 2025, month: 1, charged: 100, inflationIndex: 100 },
        { year: 2025, month: 2, charged: 0, paid: 150, inflationIndex: 110 },
        { year: 2025, month: 3, charged: 100, inflationIndex: 110 },
        { year: 2025, month: 4, charged: 0, inflationIndex: 110 },
      ],
      inflationMethod: 'monthly',
    })

    expect(result.body).toBe(50)
    // 50 × (1.331 / 1.21 − 1); the paid-off January debt had accrued nothing.
    expect(result.inflation).toBeCloseTo(5, 6)
  })

  it('a new charge is not indexed for the months before it arose', () => {
    const result = calculateDebt({
      months: [
        { year: 2025, month: 1, charged: 0, inflationIndex: 100 },
        { year: 2025, month: 2, charged: 0, inflationIndex: 120 },
        { year: 2025, month: 3, charged: 1000, inflationIndex: 120 },
        { year: 2025, month: 4, charged: 0, inflationIndex: 105 },
      ],
      inflationMethod: 'monthly',
    })

    expect(result.inflation).toBeCloseTo(50, 6) // only April's 5%
  })

  it('deflation lowers what accrued but never below zero, also for paid debt', () => {
    const result = calculateDebt({
      months: [
        { year: 2025, month: 1, charged: 1000, inflationIndex: 100 },
        { year: 2025, month: 2, charged: 0, inflationIndex: 104 },
        { year: 2025, month: 3, charged: 0, inflationIndex: 95 },
        { year: 2025, month: 4, charged: 0, paid: 1000, inflationIndex: 110 },
      ],
      inflationMethod: 'monthly',
    })

    // 1.04 × 0.95 = 0.988: a net fall, so the paid debt ran up nothing.
    expect(result.inflation).toBe(0)
  })
})

describe('calculateDebt - excluded periods', () => {
  const base = months([2025, 1], 6)

  it('takes an excluded month out of the losses and its days out of interest', () => {
    const plain = calculateDebt({ months: base, inflationMethod: 'monthly' })
    const excluded = calculateDebt({
      months: base,
      inflationMethod: 'monthly',
      excludedPeriods: [period('2025-03-01', '2025-03-31')],
    })

    const march = excluded.rows[2]
    expect(march).toMatchObject({
      excludedDays: 31,
      indexApplied: false,
      days: 0,
    })
    expect(march.interest).toBe(0)
    expect(march.coefficient).toBeCloseTo(excluded.rows[1].coefficient, 12)
    expect(excluded.inflation).toBeLessThan(plain.inflation)
    expect(excluded.interest).toBeCloseTo(
      plain.interest - plain.rows[2].interest,
      9
    )
  })

  it('a partly excluded month loses only those days of interest', () => {
    const result = calculateDebt({
      months: base,
      excludedPeriods: [period('2025-04-20', '2025-04-30')],
    })
    const april = result.rows[3]

    // 19 of 30 days remain: the index still counts, interest for 19 days.
    expect(april).toMatchObject({
      excludedDays: 11,
      indexApplied: true,
      days: 19,
    })
    expect(april.interest).toBeCloseTo((april.debt * 0.03 * 19) / 365, 9)
  })

  it('several and overlapping periods exclude each day once', () => {
    const one = calculateDebt({
      months: base,
      excludedPeriods: [period('2025-02-01', '2025-04-30')],
    })
    const pieces = calculateDebt({
      months: base,
      excludedPeriods: [
        period('2025-02-01', '2025-03-15'),
        period('2025-03-01', '2025-04-10'),
        period('2025-04-05', '2025-04-30'),
      ],
    })

    expect(pieces.rows).toEqual(one.rows)
    expect(pieces.interest).toBe(one.interest)
  })

  it('a period wholly outside the calculation changes nothing', () => {
    const plain = calculateDebt({ months: base })
    const outside = calculateDebt({
      months: base,
      excludedPeriods: [period('2022-02-24', '2023-12-29', 'cmu_206')],
    })

    expect(outside).toEqual(plain)
  })

  it('leaves the debt itself alone, for both methods', () => {
    const payments = months([2025, 1], 6, (index) => ({ paid: index * 40 }))
    for (const inflationMethod of ['balance', 'monthly'] as const) {
      const plain = calculateDebt({ months: payments, inflationMethod })
      const excluded = calculateDebt({
        months: payments,
        inflationMethod,
        excludedPeriods: [period('2025-02-10', '2025-05-20')],
      })
      expect(excluded.body).toBe(plain.body)
      expect(excluded.rows.map(({ debt }) => debt)).toEqual(
        plain.rows.map(({ debt }) => debt)
      )
    }
  })

  it('losses that accrued before a moratorium stay; accrual resumes after it', () => {
    const result = calculateDebt({
      months: months([2022, 1], 26, (index) => ({
        charged: index === 0 ? 1000 : 0,
      })),
      inflationMethod: 'monthly',
      excludedPeriods: [period('2022-02-24', '2023-12-29', 'cmu_206')],
    })
    const loss = (year: number, month: number) =>
      result.rows.find((row) => row.year === year && row.month === month)
        .inflationLoss

    // February 2022 indexed (+2%), then nothing until January 2024.
    expect(loss(2022, 2)).toBeCloseTo(20, 6)
    expect(loss(2023, 12)).toBeCloseTo(20, 6)
    expect(loss(2024, 1)).toBeCloseTo(1000 * (1.02 * 1.02 - 1), 6)
  })

  it('works for the balance method too', () => {
    const plain = calculateDebt({ months: base })
    const excluded = calculateDebt({
      months: base,
      excludedPeriods: [period('2025-02-01', '2025-06-30')],
    })

    expect(excluded.coefficient).toBe(1)
    expect(excluded.inflation).toBe(0)
    expect(excluded.interest).toBeCloseTo(plain.rows[0].interest, 9)
    expect(plain.inflation).toBeGreaterThan(0)
  })
})

describe('periodsWithin', () => {
  it('cuts the periods to the calculation and drops those outside it', () => {
    expect(
      periodsWithin(
        [
          CMU_206,
          period('2025-03-01', '2025-05-31'),
          period('2019-01-01', '2019-12-31'),
        ],
        '2023-01-01',
        '2025-03-31'
      )
    ).toEqual([
      { ...CMU_206, startDate: '2023-01-01', endDate: '2023-12-29' },
      { ...period('2025-03-01', '2025-05-31'), endDate: '2025-03-31' },
    ])
  })
})

describe('calculateDebt - days of accrual', () => {
  const base = months([2025, 4], 2)

  it('counts interest from the start day of the first month', () => {
    // April has 30 days; from the 10th that is 21 of them.
    const full = calculateDebt({ months: base })
    const fromTenth = calculateDebt({
      months: base.map((month, index) =>
        index === 0 ? { ...month, startDay: 10 } : month
      ),
    })

    expect(fromTenth.rows[0].days).toBe(21)
    expect(fromTenth.rows[0].interest).toBeCloseTo(
      (fromTenth.rows[0].debt * 0.03 * 21) / 365,
      9
    )
    expect(fromTenth.rows[1]).toEqual(full.rows[1])
    // Only interest moves: the debt and the index do not.
    expect(fromTenth.body).toBe(full.body)
    expect(fromTenth.inflation).toBe(full.inflation)
  })

  it('a typed number of days wins over the start day', () => {
    const result = calculateDebt({
      months: [{ ...base[0], startDay: 10, days: 20 }],
    })
    expect(result.rows[0].days).toBe(20)
  })

  it('keeps a typed number within the month, and zero means no interest', () => {
    const [over, none] = calculateDebt({
      months: [
        { ...base[0], days: 45 },
        { ...base[1], days: 0 },
      ],
    }).rows

    expect(over.days).toBe(30)
    expect(none.days).toBe(0)
    expect(none.interest).toBe(0)
  })

  it('takes excluded days off only from the days the debt accrues', () => {
    // From the 10th (21 days); 20-30 April excluded: 11 of those 21 go.
    const [april] = calculateDebt({
      months: [{ ...base[0], startDay: 10 }],
      excludedPeriods: [period('2025-04-20', '2025-04-30')],
    }).rows
    expect(april.days).toBe(10)

    // An exclusion before the start day takes nothing off.
    const [before] = calculateDebt({
      months: [{ ...base[0], startDay: 10 }],
      excludedPeriods: [period('2025-04-01', '2025-04-05')],
    }).rows
    expect(before.days).toBe(21)
  })

  it('a start day beyond the month end is the last day', () => {
    const [february] = calculateDebt({
      months: [{ year: 2025, month: 2, charged: 100, startDay: 31 }],
    }).rows
    expect(february.days).toBe(1)
  })
})

describe('calculateDebt - the charge follows the days', () => {
  const april = { year: 2025, month: 4, area: 50, tariff: 10 }

  it('bills area × tariff for the days left when the debt starts mid-month', () => {
    // 500 for the 30 days of April; from the 10th it is 21 of them: 350.
    const whole = calculateDebt({ months: [april] }).rows[0]
    const fromTenth = calculateDebt({
      months: [{ ...april, startDay: 10 }],
    }).rows[0]

    expect(whole.charged).toBe(500)
    expect(fromTenth.charged).toBe(350)
    expect(fromTenth.debt).toBe(350)
  })

  it('days typed into a month work the same way', () => {
    const typed = calculateDebt({ months: [{ ...april, days: 15 }] }).rows[0]

    expect(typed.charged).toBe(250)
    expect(typed.days).toBe(15)
  })

  it('a charge that was typed in or invoiced is the figure itself', () => {
    const typed = calculateDebt({
      months: [{ ...april, charged: 498.67, startDay: 10, days: 15 }],
    }).rows[0]

    expect(typed.charged).toBe(498.67)
  })

  it('excluded periods lower interest, not the charge', () => {
    const plain = calculateDebt({ months: [{ ...april, startDay: 10 }] })
      .rows[0]
    const excluded = calculateDebt({
      months: [{ ...april, startDay: 10 }],
      excludedPeriods: [period('2025-04-20', '2025-04-30')],
    }).rows[0]

    expect(excluded.charged).toBe(plain.charged)
    expect(excluded.days).toBeLessThan(plain.days)
  })

  it('a full month, with no start day, is billed exactly as before', () => {
    const odd = { year: 2025, month: 3, area: 67.08, tariff: 5.25 }
    expect(calculateDebt({ months: [odd] }).rows[0].charged).toBe(352.17)
  })
})

describe('resolveExcludedPeriods', () => {
  const own = [period('2025-03-01', '2025-03-31')]

  it('uses the calculation own list, even an empty one', () => {
    expect(resolveExcludedPeriods(own, false)).toBe(own)
    expect(resolveExcludedPeriods([], false)).toEqual([])
    expect(resolveExcludedPeriods(own, true)).toBe(own)
  })

  it('gives a calculation never saved the КМУ №206 moratorium', () => {
    expect(resolveExcludedPeriods(undefined, false)).toEqual([
      expect.objectContaining({
        type: 'cmu_206',
        startDate: '2022-02-24',
        endDate: '2023-12-29',
      }),
    ])
  })

  it('gives a saved calculation without a list nothing', () => {
    expect(resolveExcludedPeriods(undefined, true)).toEqual([])
  })
})
