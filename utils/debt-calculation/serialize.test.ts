import { sanitizeOverrides, sanitizeSnapshot } from './serialize'

const APT = '507f1f77bcf86cd799439011'
const APT2 = '507f1f77bcf86cd799439012'

describe('sanitizeOverrides', () => {
  it('пропускає відомі числові поля квартири', () => {
    expect(
      sanitizeOverrides({
        [APT]: {
          area: 67.08,
          tariff: 5.25,
          openingDebt: 352.17,
          legalFees: 3000,
          courtFee: 1211.2,
        },
      })
    ).toEqual({
      [APT]: {
        area: 67.08,
        tariff: 5.25,
        openingDebt: 352.17,
        legalFees: 3000,
        courtFee: 1211.2,
      },
    })
  })

  it('пропускає місяці з правильним ключем', () => {
    expect(
      sanitizeOverrides({
        [APT]: { months: { '2026-04': { paid: 1000, charged: 266.46 } } },
      })
    ).toEqual({
      [APT]: { months: { '2026-04': { paid: 1000, charged: 266.46 } } },
    })
  })

  it('відкидає ключ квартири, що не ObjectId', () => {
    expect(sanitizeOverrides({ 'не-id': { area: 10 } })).toEqual({})
    expect(sanitizeOverrides({ __proto__: { area: 10 } })).toEqual({})
  })

  it('відкидає ключ місяця поза форматом YYYY-MM', () => {
    expect(
      sanitizeOverrides({
        [APT]: {
          months: {
            '2026-4': { paid: 1 },
            '2026-13': { paid: 1 },
            квітень: { paid: 1 },
            '2026-04': { paid: 1 },
          },
        },
      })
    ).toEqual({ [APT]: { months: { '2026-04': { paid: 1 } } } })
  })

  it('викидає невідомі поля, рядки й об’єкти', () => {
    expect(
      sanitizeOverrides({
        [APT]: {
          area: 10,
          evil: { $ne: null },
          note: 'текст',
          months: { '2026-04': { paid: 5, evil: 'x' } },
        },
      })
    ).toEqual({ [APT]: { area: 10, months: { '2026-04': { paid: 5 } } } })
  })

  it('перетворює числові рядки, відкидає NaN і порожні', () => {
    expect(
      sanitizeOverrides({
        [APT]: { area: '67.08', tariff: 'abc', openingDebt: '' },
      })
    ).toEqual({ [APT]: { area: 67.08 } })
  })

  it('не зберігає порожні гілки', () => {
    expect(sanitizeOverrides({ [APT]: {} })).toEqual({})
    expect(sanitizeOverrides({ [APT]: { months: {} } })).toEqual({})
    expect(sanitizeOverrides({ [APT]: { months: { '2026-04': {} } } })).toEqual(
      {}
    )
  })

  it('тримає кілька квартир', () => {
    const result = sanitizeOverrides({
      [APT]: { area: 10 },
      [APT2]: { tariff: 5 },
    })
    expect(Object.keys(result)).toEqual([APT, APT2])
  })

  it('не падає на сміттєвому вході', () => {
    expect(sanitizeOverrides(null)).toEqual({})
    expect(sanitizeOverrides('рядок')).toEqual({})
    expect(sanitizeOverrides(42)).toEqual({})
  })

  it('обмежує кількість квартир і місяців', () => {
    const many = Object.fromEntries(
      Array.from({ length: 1500 }, (_, i) => [
        i.toString(16).padStart(24, '0'),
        { area: 1 },
      ])
    )
    expect(Object.keys(sanitizeOverrides(many))).toHaveLength(1000)

    const manyMonths = Object.fromEntries(
      Array.from({ length: 1500 }, (_, i) => [
        `${2000 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`,
        { paid: 1 },
      ])
    )
    const result = sanitizeOverrides({ [APT]: { months: manyMonths } })
    expect(Object.keys(result[APT].months)).toHaveLength(1200)
  })
})

describe('sanitizeSnapshot', () => {
  const valid = {
    domain: APT,
    periodFrom: { year: 2026, month: 1 },
    periodTo: { year: 2026, month: 9 },
    annualRatePercent: 3,
    inflationMethod: 'monthly',
    overrides: { [APT2]: { openingDebt: 8371.52 } },
  }

  it('пропускає коректний знімок цілком', () => {
    expect(sanitizeSnapshot(valid)).toEqual(valid)
  })

  it('відкидає домен, що не ObjectId', () => {
    expect(
      sanitizeSnapshot({ ...valid, domain: 'nope' }).domain
    ).toBeUndefined()
  })

  it('відкидає некоректний період', () => {
    const result = sanitizeSnapshot({
      ...valid,
      periodFrom: { year: 2026, month: 13 },
      periodTo: { year: 2026.5, month: 2 },
    })
    expect(result.periodFrom).toBeUndefined()
    expect(result.periodTo).toBeUndefined()
  })

  it('метод за замовчуванням — помісячний (ст. 625), будь-що чуже теж', () => {
    expect(sanitizeSnapshot({}).inflationMethod).toBe('monthly')
    expect(sanitizeSnapshot({ inflationMethod: 'хакер' }).inflationMethod).toBe(
      'monthly'
    )
    // A calculation saved «за залишком» stays so.
    expect(
      sanitizeSnapshot({ inflationMethod: 'balance' }).inflationMethod
    ).toBe('balance')
  })

  it('відкидає ставку поза 0–100', () => {
    expect(
      sanitizeSnapshot({ annualRatePercent: -1 }).annualRatePercent
    ).toBeUndefined()
    expect(
      sanitizeSnapshot({ annualRatePercent: 500 }).annualRatePercent
    ).toBeUndefined()
    expect(sanitizeSnapshot({ annualRatePercent: 0 }).annualRatePercent).toBe(0)
  })

  it('не падає на порожньому вході', () => {
    expect(sanitizeSnapshot(null)).toEqual({
      inflationMethod: 'monthly',
      overrides: {},
    })
  })
})

describe('коректура в збереженні', () => {
  it('зберігається разом з іншими полями місяця, мінус включно', () => {
    const company = '507f1f77bcf86cd799439012'

    expect(
      sanitizeOverrides({
        [company]: { months: { '2019-11': { correction: '-6.86', paid: 0 } } },
      })
    ).toEqual({
      [company]: { months: { '2019-11': { correction: -6.86, paid: 0 } } },
    })
  })
})

describe('загальні значення місяця, число початку і дні', () => {
  it('зберігає щомісячні нараховано, сплачено, коректуру, число початку й дні місяця', () => {
    const saved = {
      [APT]: {
        charged: 498.67,
        paid: 100,
        correction: -5,
        startDay: 10,
        months: { '2025-04': { days: 20, paid: 50 } },
      },
    }

    expect(sanitizeOverrides(saved)).toEqual(saved)
  })

  it('відкидає число початку й дні, що не є днями місяця', () => {
    const result = sanitizeOverrides({
      [APT]: {
        area: 10,
        startDay: 40,
        months: { '2025-04': { days: 2.5 }, '2025-05': { days: -3, paid: 1 } },
      },
      [APT2]: { startDay: 0, courtFee: 5 },
    })

    expect(result[APT]).toEqual({
      area: 10,
      months: { '2025-05': { paid: 1 } },
    })
    expect(result[APT2]).toEqual({ courtFee: 5 })
  })
})

describe('виключені періоди в збереженні', () => {
  const period = {
    id: 'p1',
    type: 'cmu_206',
    startDate: '2022-02-24',
    endDate: '2023-12-29',
  }

  it('зберігає їх разом з правками компанії', () => {
    const saved = {
      [APT]: {
        openingDebt: 100,
        excludedPeriods: [
          period,
          {
            id: 'p2',
            type: 'custom',
            startDate: '2025-03-01',
            endDate: '2025-05-31',
          },
        ],
      },
    }

    expect(sanitizeOverrides(saved)).toEqual(saved)
  })

  it('залишає лише справжні дати у правильному порядку й відомий тип', () => {
    const result = sanitizeOverrides({
      [APT]: {
        excludedPeriods: [
          { ...period, id: 'ok', type: 'щось-інше' },
          {
            ...period,
            id: 'reversed',
            startDate: '2024-01-01',
            endDate: '2023-01-01',
          },
          { ...period, id: 'fake', startDate: '2025-02-30' },
          { ...period, id: 'text', endDate: 'вчора' },
          null,
          'не період',
        ],
      },
    })

    expect(result[APT].excludedPeriods).toEqual([
      { ...period, id: 'ok', type: 'custom' },
    ])
  })

  it('порожній список не лишає сліду, а їх не більше 50', () => {
    expect(sanitizeOverrides({ [APT]: { excludedPeriods: [] } })).toEqual({})

    const many = Array.from({ length: 80 }, (_, index) => ({
      ...period,
      id: `p${index}`,
    }))
    expect(
      sanitizeOverrides({ [APT]: { excludedPeriods: many } })[APT]
        .excludedPeriods
    ).toHaveLength(50)
  })

  it('старий розрахунок без виключень не змінюється', () => {
    expect(sanitizeOverrides({ [APT]: { openingDebt: 5 } })).toEqual({
      [APT]: { openingDebt: 5 },
    })
  })
})
