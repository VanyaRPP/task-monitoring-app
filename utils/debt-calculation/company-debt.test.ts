import {
  calculateCompanyDebt,
  defaultDebtPeriod,
  resolveSnapshotSettings,
} from './company-debt'

describe('defaultDebtPeriod', () => {
  it('дванадцять місяців до останнього завершеного', () => {
    expect(defaultDebtPeriod(new Date(2026, 9, 15))).toEqual({
      from: { year: 2025, month: 10 },
      to: { year: 2026, month: 9 },
    })
  })

  it('переходить через Новий рік', () => {
    expect(defaultDebtPeriod(new Date(2026, 0, 10))).toEqual({
      from: { year: 2025, month: 1 },
      to: { year: 2025, month: 12 },
    })
  })

  it('з часовим поясом рахує місяць за Києвом, а не за UTC', () => {
    // 1 жовтня, 01:30 за Києвом — у UTC ще 30 вересня.
    const now = new Date('2026-09-30T22:30:00.000Z')

    expect(defaultDebtPeriod(now, 'Europe/Kyiv').to).toEqual({
      year: 2026,
      month: 9,
    })
    expect(defaultDebtPeriod(now, 'UTC').to).toEqual({ year: 2026, month: 8 })
  })
})

describe('resolveSnapshotSettings', () => {
  it('без збереженого розрахунку — значення сторінки за замовчуванням', () => {
    expect(resolveSnapshotSettings(null, 'c1')).toEqual({
      overrides: {},
      annualRatePercent: 3,
      inflationMethod: 'balance',
      periodFrom: undefined,
      periodTo: undefined,
    })
  })

  it('бере налаштування й правки саме цієї компанії', () => {
    const settings = resolveSnapshotSettings(
      {
        annualRatePercent: 5,
        inflationMethod: 'monthly',
        periodFrom: { year: 2025, month: 1 },
        overrides: { c1: { area: 40 }, c2: { area: 99 } },
      },
      'c1'
    )

    expect(settings).toMatchObject({
      overrides: { area: 40 },
      annualRatePercent: 5,
      inflationMethod: 'monthly',
      periodFrom: { year: 2025, month: 1 },
    })
  })
})

describe('calculateCompanyDebt', () => {
  const defaultPeriod = {
    from: { year: 2025, month: 1 },
    to: { year: 2025, month: 3 },
  }
  const indexByPeriod = { '2025-01': 101.2, '2025-02': 100.8, '2025-03': 101.5 }

  it('рахує як сторінка: 3 місяці по 500 грн за залишком', () => {
    const { result, period, inflationMethod } = calculateCompanyDebt({
      companyId: 'c1',
      company: { totalArea: 50, pricePerMeter: 10 },
      indexByPeriod,
      defaultPeriod,
    })

    expect(period).toEqual(defaultPeriod)
    expect(inflationMethod).toBe('balance')
    // 1500 × (1.008 × 1.015 − 1); see calculate.test.ts
    expect(result.inflation).toBeCloseTo(34.68, 2)
  })

  it('період і метод зі збереженого розрахунку мають перевагу', () => {
    const { result, period } = calculateCompanyDebt({
      companyId: 'c1',
      company: { totalArea: 50, pricePerMeter: 10 },
      indexByPeriod,
      saved: {
        periodFrom: { year: 2025, month: 2 },
        periodTo: { year: 2025, month: 3 },
        inflationMethod: 'monthly',
      },
      defaultPeriod,
    })

    expect(period.from).toEqual({ year: 2025, month: 2 })
    // лютий 500 × 1.5%, березень ще не індексувався
    expect(result.inflation).toBeCloseTo(7.5, 2)
  })
})
