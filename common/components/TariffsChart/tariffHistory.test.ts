import { expect } from '@jest/globals'
import type { IService } from '@common/api/serviceApi/service.api.types'
import dayjs from 'dayjs'
import { getChangeText } from './changeText'
import {
  buildTariffHistory,
  getLatestPoint,
  getTariffChange,
} from './tariffHistory'

const monthService = (month: string, overrides: Partial<IService> = {}) =>
  ({
    _id: `id-${month}`,
    date: new Date(`${month}-01T12:00:00Z`),
    // the schema defaults of the tariff columns
    rentPrice: 0,
    electricityPrice: 0,
    waterPrice: 0,
    waterPriceTotal: 0,
    garbageCollectorPrice: 0,
    inflicionPrice: 0,
    customServices: [],
    ...overrides,
  }) as IService

const row = (_id: string, fieldName: string, label: string, price: number) =>
  ({ _id, fieldName, label, price }) as any

const summary = (services: IService[]) =>
  buildTariffHistory(services).series.map(({ name, points }) => [
    name,
    points.map(({ value }) => value),
  ])

describe('buildTariffHistory', () => {
  it('has only the services the domain has a tariff for', () => {
    expect(
      summary([
        monthService('2026-01', {
          rentPrice: 10,
          customServices: [row('a', 'okhorona', 'Охорона', 500)],
        }),
      ])
    ).toEqual([
      ['Утримання', [10]],
      ['Охорона', [500]],
    ])
  })

  it('makes one series of a column and the custom row that repeats it', () => {
    const history = buildTariffHistory([
      monthService('2026-01', { electricityPrice: 11 }),
      monthService('2026-02', {
        electricityPrice: 12,
        customServices: [
          row('a', 'electricityPrice', 'Електроенергія (грн/кВт)', 12),
        ],
      }),
    ])

    expect(history.series).toEqual([
      {
        key: 'electricityPrice',
        name: 'Електроенергія (грн/кВт)',
        unit: 'грн/кВт',
        points: [
          { month: '01.2026', value: 11 },
          { month: '02.2026', value: 12 },
        ],
      },
    ])
  })

  it('knows a catalog service by its pinned id', () => {
    expect(
      summary([
        monthService('2026-01', { rentPrice: 10 }),
        monthService('2026-02', {
          customServices: [
            row(
              '677d414283b6ef93c6b8ea2c',
              'utrymanniaPrymishchen',
              'Утримання приміщень',
              15
            ),
          ],
        }),
      ])
    ).toEqual([['Утримання приміщень', [10, 15]]])
  })

  it('keeps two meters of one kind apart', () => {
    expect(
      summary([
        monthService('2026-01', {
          electricityPrice: 12,
          customServices: [
            row('a', 'electricityPrice', 'Електропостачання', 12),
            row('b', 'electricityPrice', 'Електрика, склад', 9),
          ],
        }),
      ])
    ).toEqual([
      ['Електропостачання', [12]],
      ['Електрика, склад', [9]],
    ])
  })

  it('follows a custom service through a rename, under the latest name', () => {
    expect(
      summary([
        monthService('2026-02', {
          customServices: [row('a', 'okhoronaNova', 'Охорона нова', 600)],
        }),
        monthService('2026-01', {
          customServices: [row('a', 'okhorona', 'Охорона', 500)],
        }),
      ])
    ).toEqual([['Охорона нова', [500, 600]]])
  })

  it('leaves a gap where the service or its month is missing', () => {
    expect(
      summary([
        monthService('2026-01', { waterPrice: 30 }),
        monthService('2026-03', {
          customServices: [row('a', 'okhorona', 'Охорона', 500)],
        }),
      ])
    ).toEqual([
      ['Водопостачання', [30, null, null]],
      ['Охорона', [null, null, 500]],
    ])
  })

  it('draws a zero entered for a listed service', () => {
    expect(
      summary([
        monthService('2026-01', {
          customServices: [row('a', 'okhorona', 'Охорона', 500)],
        }),
        monthService('2026-02', {
          customServices: [row('a', 'okhorona', 'Охорона', 0)],
        }),
      ])
    ).toEqual([['Охорона', [500, 0]]])
  })

  it('names the listed services that never had a tariff', () => {
    const history = buildTariffHistory([
      monthService('2026-01', {
        rentPrice: 10,
        customServices: [
          row('a', 'okhorona', 'Охорона', 0),
          row('b', 'waterPrice', 'Вода', 0),
        ],
      }),
    ])

    expect(history.series.map(({ name }) => name)).toEqual(['Утримання'])
    expect(history.unpriced).toEqual(['Вода', 'Охорона'])
  })

  it('looks at the selected period only', () => {
    const history = buildTariffHistory(
      [
        monthService('2025-12', {
          customServices: [row('a', 'okhorona', 'Охорона', 500)],
        }),
        monthService('2026-01', { rentPrice: 10 }),
      ],
      [dayjs('2026-01-01'), dayjs('2026-02-01')]
    )

    expect(history.series.map(({ name }) => name)).toEqual(['Утримання'])
    expect(history.series[0].points.map(({ month }) => month)).toEqual([
      '01.2026',
      '02.2026',
    ])
  })
})

describe('the change of a tariff', () => {
  const points = (...values: (number | null)[]) =>
    values.map((value, index) => ({ month: `0${index + 1}.2026`, value }))
  const text = (values: (number | null)[], unit?: string) =>
    getChangeText(getTariffChange(points(...values)), unit)

  it('goes from the first known month to the latest one', () => {
    const series = points(null, 12, 20, 15, null)

    expect(getLatestPoint(series)).toEqual({ month: '04.2026', value: 15 })
    expect(getTariffChange(series)).toEqual({
      since: '02.2026',
      diff: 3,
      percent: 25,
    })
  })

  it('reads as a rise or a fall with its share', () => {
    expect(text([10, 10.5], 'грн/м²')).toBe('↑ 0,5 грн/м² (+5 %) з 01.2026')
    expect(text([200, 150])).toBe('↓ 50 (−25 %) з 01.2026')
  })

  it('counts an index in percentage points', () => {
    expect(text([100.8, 101.9], '%')).toBe('↑ 1,1 в. п. з 01.2026')
  })

  it('takes no share of zero', () => {
    expect(text([0, 5])).toBe('↑ 5 з 01.2026')
  })

  it('compares the ends, whatever happened between them', () => {
    expect(text([10, 14, 10])).toBe('Стільки ж, як у 01.2026')
  })

  it('has nothing to compare with a single month', () => {
    expect(text([null, 10])).toBe('Тариф є лише за один місяць')
  })
})
