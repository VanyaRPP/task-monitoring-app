import { buildDebtCalculationInput } from './build-input'
import { calculateDebt } from './calculate'
import {
  changesInMonth,
  normalizeChanges,
  valueInMonth,
  valueRuns,
} from './changes'
import { sanitizeOverrides } from './serialize'

const TARIFF = [
  { from: '2019-02', value: 5.89 },
  { from: '2024-01', value: 9.91 },
]

describe('valueInMonth', () => {
  it('keeps the field value until the first change, then each change', () => {
    expect(valueInMonth(TARIFF, 5.25, '2018-08')).toBe(5.25)
    expect(valueInMonth(TARIFF, 5.25, '2019-01')).toBe(5.25)
    expect(valueInMonth(TARIFF, 5.25, '2019-02')).toBe(5.89)
    expect(valueInMonth(TARIFF, 5.25, '2023-12')).toBe(5.89)
    expect(valueInMonth(TARIFF, 5.25, '2025-06')).toBe(9.91)
  })

  it('leaves the months before a change empty when the field is empty', () => {
    expect(valueInMonth(TARIFF, undefined, '2018-12')).toBeUndefined()
  })
})

describe('normalizeChanges', () => {
  it('sorts by month and keeps the later entry of a repeated month', () => {
    expect(
      normalizeChanges([
        { from: '2024-01', value: 9 },
        { from: '2019-02', value: 5.89 },
        { from: '2024-01', value: 9.91 },
      ])
    ).toEqual(TARIFF)
  })
})

describe('changes in the calculation', () => {
  const company = { totalArea: 50, pricePerMeter: 4 }
  const FROM = { year: 2018, month: 12 }
  const TO = { year: 2019, month: 3 }

  it('charges each month by the tariff in force then', () => {
    const { rows } = calculateDebt(
      buildDebtCalculationInput({
        company,
        from: FROM,
        to: TO,
        overrides: {
          tariff: 5,
          changes: { tariff: [{ from: '2019-02', value: 6 }] },
        },
      })
    )

    expect(rows.map(({ tariff }) => tariff)).toEqual([5, 5, 6, 6])
    expect(rows.map(({ charged }) => charged)).toEqual([250, 250, 300, 300])
  })

  it('stops a monthly payment with a change to zero', () => {
    const { months } = buildDebtCalculationInput({
      company,
      from: FROM,
      to: TO,
      overrides: {
        paid: 300,
        changes: { paid: [{ from: '2019-02', value: 0 }] },
      },
    })

    expect(months.map(({ paid }) => paid)).toEqual([300, 300, 0, 0])
  })

  it('still yields to a typed month and to the payments', () => {
    const { months } = buildDebtCalculationInput({
      company,
      from: FROM,
      to: TO,
      overrides: {
        tariff: 5,
        changes: { tariff: [{ from: '2019-01', value: 6 }] },
        months: { '2019-02': { tariff: 7 } },
      },
      prefillMonths: { '2019-03': { paid: 40 } },
    })

    expect(months.map(({ tariff }) => tariff)).toEqual([5, 6, 7, 6])
    expect(months[3].paid).toBe(40)
  })
})

describe('valueRuns', () => {
  it('merges months with one value into stretches', () => {
    const months = [
      { year: 2018, month: 12, tariff: 5 },
      { year: 2019, month: 1, tariff: 5 },
      { year: 2019, month: 2, tariff: 6 },
    ]

    expect(valueRuns(months, ({ tariff }) => tariff)).toEqual([
      {
        value: 5,
        from: { year: 2018, month: 12 },
        to: { year: 2019, month: 1 },
      },
      {
        value: 6,
        from: { year: 2019, month: 2 },
        to: { year: 2019, month: 2 },
      },
    ])
  })
})

describe('changesInMonth', () => {
  it('names the fields that change in a month', () => {
    expect(
      changesInMonth(
        { tariff: TARIFF, paid: [{ from: '2019-02', value: 0 }] },
        {
          year: 2019,
          month: 2,
        }
      )
    ).toEqual([
      { field: 'tariff', value: 5.89 },
      { field: 'paid', value: 0 },
    ])
  })
})

describe('saving changes', () => {
  const ID = '0123456789abcdef01234567'

  it('keeps valid changes, sorted, and drops the rest', () => {
    const saved = sanitizeOverrides({
      [ID]: {
        changes: {
          tariff: [
            { from: '2024-01', value: '9.91' },
            { from: '2019-02', value: 5.89 },
            { from: '2019-13', value: 1 },
            { from: '2020-01', value: 'abc' },
          ],
          hacked: [{ from: '2019-02', value: 1 }],
        },
      },
    })

    expect(saved[ID].changes).toEqual({ tariff: TARIFF })
  })

  it('stores nothing for no valid change', () => {
    const saved = sanitizeOverrides({
      [ID]: { tariff: 5, changes: { tariff: [{ from: 'x', value: 1 }] } },
    })

    expect(saved[ID]).toEqual({ tariff: 5 })
  })
})
