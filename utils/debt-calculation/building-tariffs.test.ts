import { buildDebtCalculationInput } from './build-input'
import {
  apartmentOf,
  apartmentRanges,
  groupOfApartment,
  IBuildingTariffs,
  sanitizeBuildingTariffs,
  tariffInMonth,
  tariffsByMonth,
  tariffWarnings,
} from './building-tariffs'
import { calculateDebt } from './calculate'

const BUILDING: IBuildingTariffs = {
  groups: [
    { label: 'І поверх', apartments: '1-3; 31-33; 61-63' },
    { label: 'вище І поверху', apartments: '' },
  ],
  periods: [
    { from: '2018-06-10', to: '2019-06-10', tariffs: [4.1, 5.2] },
    { from: '2019-06-11', to: '2021-11-30', tariffs: [4.1, 6] },
    { from: '2024-01-01', tariffs: [7, 9] },
  ],
}

describe('apartments', () => {
  it('reads ranges and single numbers, nothing from «решта квартир»', () => {
    expect(apartmentRanges('№№ 1-3; 31-33; 7')).toEqual([
      [1, 3],
      [31, 33],
      [7, 7],
    ])
    expect(apartmentRanges('решта квартир')).toEqual([])
  })

  it('finds the apartment number in the company name or description', () => {
    expect(apartmentOf('Квартира №18, вул. Тестова 8')).toBe(18)
    expect(apartmentOf('Іваненко', 'кв. 32')).toBe(32)
    // A house number is not an apartment.
    expect(apartmentOf('вул. Тестова 8')).toBeUndefined()
  })

  it('puts a listed apartment in its group, the others in the rest', () => {
    expect(groupOfApartment(BUILDING, 32)).toBe(0)
    expect(groupOfApartment(BUILDING, 18)).toBe(1)
  })

  it('cannot tell without a number, unless the group is picked or alone', () => {
    expect(groupOfApartment(BUILDING, undefined)).toBeUndefined()
    expect(groupOfApartment(BUILDING, undefined, 0)).toBe(0)
    expect(groupOfApartment(BUILDING, 32, 1)).toBe(1)
    expect(
      groupOfApartment(
        { groups: [{ label: '', apartments: '1-10' }] },
        undefined
      )
    ).toBe(0)
  })
})

describe('tariffInMonth', () => {
  it('gives a month inside a period its tariff', () => {
    expect(tariffInMonth(BUILDING, 1, { year: 2019, month: 1 })).toEqual({
      value: 5.2,
    })
  })

  it('splits a month the tariff changed in by days', () => {
    // 1-10 June at 5.20, 11-30 June at 6.00.
    const june = tariffInMonth(BUILDING, 1, { year: 2019, month: 6 })

    expect(june.value).toBeCloseTo((5.2 * 10 + 6 * 20) / 30, 10)
    expect(june).toEqual({
      value: june.value,
      parts: [
        { fromDay: 1, toDay: 10, value: 5.2 },
        { fromDay: 11, toDay: 30, value: 6 },
      ],
    })
  })

  it('does not split it for a group whose tariff stayed the same', () => {
    expect(tariffInMonth(BUILDING, 0, { year: 2019, month: 6 })).toEqual({
      value: 4.1,
    })
  })

  it('keeps a period going until the next one, past its own end', () => {
    // «по 30.11.2021», then nothing until 2024: the last tariff stands.
    expect(tariffInMonth(BUILDING, 1, { year: 2022, month: 6 })).toEqual({
      value: 6,
    })
  })

  it('has nothing for months before the first period', () => {
    expect(tariffInMonth(BUILDING, 1, { year: 2018, month: 5 })).toBeUndefined()
    expect(
      tariffsByMonth(
        BUILDING,
        1,
        { year: 2018, month: 5 },
        { year: 2018, month: 7 }
      )
    ).toEqual({ '2018-06': { value: 5.2 }, '2018-07': { value: 5.2 } })
  })
})

describe('the building tariffs in the calculation', () => {
  const company = { totalArea: 50, pricePerMeter: 3 }
  const FROM = { year: 2019, month: 5 }
  const TO = { year: 2019, month: 7 }
  const build = (extra: Parameters<typeof buildDebtCalculationInput>[0]) =>
    buildDebtCalculationInput({
      company,
      from: FROM,
      to: TO,
      buildingTariffs: tariffsByMonth(BUILDING, 1, FROM, TO),
      ...extra,
    })

  it('bills the month of a change by both tariffs', () => {
    const { rows } = calculateDebt(build({}))

    expect(rows.map(({ charged }) => charged)).toEqual([
      260,
      // 50 m² × (5.20 × 10 + 6.00 × 20) / 30
      286.67, 300,
    ])
  })

  it('outranks the tariff from the services, not the company’s own', () => {
    const fromServices = build({
      prefillMonths: { '2019-05': { tariff: 4 } },
    })
    expect(fromServices.months[0].tariff).toBe(5.2)

    const own = build({ overrides: { tariff: 8 } })
    expect(own.months.map(({ tariff }) => tariff)).toEqual([8, 8, 8])
    expect(own.months[1].tariffParts).toBeUndefined()
  })

  it('leaves a charge from the payments as it is, even off area × tariff', () => {
    const { rows } = calculateDebt(
      build({ prefillMonths: { '2019-05': { charged: 199.99 } } })
    )

    expect(rows[0].charged).toBe(199.99)
    expect(rows[0].tariff).toBe(5.2)
  })
})

describe('tariffWarnings', () => {
  it('points out a day no period covers', () => {
    expect(
      tariffWarnings({
        groups: [{ label: 'Усі', apartments: '' }],
        periods: [
          { from: '2019-10-01', to: '2020-02-28', tariffs: [5] },
          { from: '2020-03-01', tariffs: [6] },
        ],
      })
    ).toEqual([
      'Між 28.02.2020 і 01.03.2020 немає тарифу: ці дні рахуються за попереднім.',
    ])
  })

  it('points out a tariff left blank', () => {
    expect(
      tariffWarnings({
        groups: [{ label: '', apartments: '' }],
        periods: [{ from: '2020-03-01', tariffs: [null] }],
      })
    ).toEqual(['Період з 01.03.2020: немає тарифу для «групи 1».'])
  })
})

describe('sanitizeBuildingTariffs', () => {
  it('keeps known fields, real dates and a tariff per group', () => {
    expect(
      sanitizeBuildingTariffs({
        street: '0123456789abcdef01234567',
        address: ' вул. Тестова, 7 ',
        groups: [{ label: 'Усі', apartments: '', extra: 1 }],
        periods: [
          { from: '2024-01-01', tariffs: ['7.5', 3] },
          { from: '2019-13-01', tariffs: [1] },
          { from: '2019-01-01', to: 'вчора', tariffs: [-1] },
        ],
        hacked: true,
      })
    ).toEqual({
      street: '0123456789abcdef01234567',
      address: 'вул. Тестова, 7',
      groups: [{ label: 'Усі', apartments: '' }],
      periods: [
        { from: '2019-01-01', tariffs: [null] },
        { from: '2024-01-01', tariffs: [7.5] },
      ],
    })
  })

  it('drops a street that is not an id, and a table with no groups', () => {
    expect(
      sanitizeBuildingTariffs({
        street: { $ne: null },
        groups: [{ label: 'A' }],
        periods: [],
      })
    ).toEqual({ groups: [{ label: 'A', apartments: '' }], periods: [] })
    expect(sanitizeBuildingTariffs({ groups: [], periods: [] })).toBeUndefined()
  })
})
