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
      inflationMethod: 'monthly',
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

  it('рахує як сторінка: 3 місяці по 500 грн, помісячно (ст. 625)', () => {
    const { result, period, inflationMethod } = calculateCompanyDebt({
      companyId: 'c1',
      company: { totalArea: 50, pricePerMeter: 10 },
      indexByPeriod,
      defaultPeriod,
    })

    expect(period).toEqual(defaultPeriod)
    expect(inflationMethod).toBe('monthly')
    // січень 500 × (1.008 × 1.015 − 1) + лютий 500 × 1.5%; березень ще ні
    expect(result.inflation).toBeCloseTo(11.56 + 7.5, 2)
  })

  it('збережений «за залишком» рахується за залишком', () => {
    const { result, inflationMethod } = calculateCompanyDebt({
      companyId: 'c1',
      company: { totalArea: 50, pricePerMeter: 10 },
      indexByPeriod,
      saved: { inflationMethod: 'balance' },
      defaultPeriod,
    })

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

describe('calculateCompanyDebt - saved excluded periods', () => {
  const company = { totalArea: 50, pricePerMeter: 10 }
  const indexByPeriod = { '2025-01': 101.2, '2025-02': 100.8, '2025-03': 101.5 }
  const defaultPeriod = {
    from: { year: 2025, month: 1 },
    to: { year: 2025, month: 3 },
  }
  const exclusion = {
    id: 'p1',
    type: 'custom' as const,
    startDate: '2025-02-01',
    endDate: '2025-02-28',
  }

  it('the debtors list counts what the page saved for this company', () => {
    const plain = calculateCompanyDebt({
      companyId: 'c1',
      company,
      indexByPeriod,
      defaultPeriod,
    })
    const excluded = calculateCompanyDebt({
      companyId: 'c1',
      company,
      indexByPeriod,
      defaultPeriod,
      saved: { overrides: { c1: { excludedPeriods: [exclusion] } } },
    })

    expect(excluded.result.inflation).toBeLessThan(plain.result.inflation)
    expect(excluded.result.interest).toBeLessThan(plain.result.interest)
    expect(excluded.result.body).toBe(plain.result.body)
  })

  it('another company is not affected by it', () => {
    const plain = calculateCompanyDebt({
      companyId: 'c2',
      company,
      indexByPeriod,
      defaultPeriod,
    })
    const other = calculateCompanyDebt({
      companyId: 'c2',
      company,
      indexByPeriod,
      defaultPeriod,
      saved: { overrides: { c1: { excludedPeriods: [exclusion] } } },
    })

    expect(other.result).toEqual(plain.result)
  })
})

describe('calculateCompanyDebt - the moratorium by default', () => {
  const company = { totalArea: 50, pricePerMeter: 10 }
  // Across the end of КМУ №206: from November 2023 to February 2024.
  const indexByPeriod = {
    '2023-11': 100.5,
    '2023-12': 100.7,
    '2024-01': 100.4,
    '2024-02': 100.3,
  }
  const defaultPeriod = {
    from: { year: 2023, month: 11 },
    to: { year: 2024, month: 2 },
  }
  const run = (saved?: Parameters<typeof calculateCompanyDebt>[0]['saved']) =>
    calculateCompanyDebt({
      companyId: 'c1',
      company,
      indexByPeriod,
      defaultPeriod,
      saved,
    }).result

  it('a company with no saved calculation is counted with it, as the page opens', () => {
    const fresh = run(undefined)
    const without = run({ overrides: { c1: { openingDebt: 0 } } })

    expect(fresh.interest).toBeLessThan(without.interest)
    // November and most of December are out: only 2 days of December remain.
    expect(fresh.totals.days).toBe(2 + 31 + 29)
  })

  it('a saved calculation without its own list keeps none', () => {
    const saved = run({ overrides: { c1: { openingDebt: 0 } } })
    expect(saved.totals.days).toBe(30 + 31 + 31 + 29)
  })

  it('a saved calculation with an empty or its own list is counted by it', () => {
    const own = run({
      overrides: {
        c1: {
          excludedPeriods: [
            {
              id: 'p',
              type: 'custom',
              startDate: '2024-01-01',
              endDate: '2024-01-31',
            },
          ],
        },
      },
    })
    expect(own.totals.days).toBe(30 + 31 + 29)
  })
})
