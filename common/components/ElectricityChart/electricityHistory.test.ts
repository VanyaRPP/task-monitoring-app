import { expect } from '@jest/globals'
import type { IService } from '@common/api/serviceApi/service.api.types'
import dayjs from 'dayjs'
import {
  buildElectricityRows,
  filterByAddress,
  getAddressOptions,
  NO_ADDRESS,
} from './electricityHistory'

// tariff 12 with VAT -> 10 without; 10 × 1000 = 10000; billed 11000 -> +10%
const monthService = (month: string, overrides: Partial<IService> = {}) =>
  ({
    _id: `id-${month}`,
    date: new Date(`${month}-01T12:00:00Z`),
    electricityPrice: 12,
    consumedElectricity: 1000,
    generalElectricity: 11000,
    losses: 10,
    ...overrides,
  }) as IService

describe('buildElectricityRows', () => {
  it('gives all six figures of a month', () => {
    expect(buildElectricityRows([monthService('2026-03')])).toEqual([
      {
        month: '03.2026',
        tariffWithVat: 12,
        tariffWithoutVat: 10,
        totalWithVat: 13200,
        totalWithoutVat: 11000,
        consumed: 1000,
        losses: 10,
      },
    ])
  })

  it('takes the tariff of the custom electricity row, as the form does', () => {
    const [row] = buildElectricityRows([
      monthService('2026-03', {
        electricityPrice: 6,
        customServices: [
          { fieldName: 'electricityPrice', price: 12 } as any,
          { fieldName: 'waterPrice', price: 99 } as any,
        ],
      }),
    ])

    expect(row.tariffWithVat).toBe(12)
  })

  it('goes through the months in order and leaves a gap for a missing one', () => {
    const rows = buildElectricityRows([
      monthService('2026-01'),
      monthService('2025-11'),
    ])

    expect(rows.map((row) => row.month)).toEqual([
      '11.2025',
      '12.2025',
      '01.2026',
    ])
    expect(rows[1]).toEqual({
      month: '12.2025',
      tariffWithVat: null,
      tariffWithoutVat: null,
      totalWithVat: null,
      totalWithoutVat: null,
      consumed: null,
      losses: null,
    })
  })

  it('shows exactly the selected period', () => {
    const rows = buildElectricityRows(
      [monthService('2026-01'), monthService('2026-03')],
      [dayjs('2026-02-15'), dayjs('2026-04-15')]
    )

    expect(rows.map((row) => [row.month, row.consumed])).toEqual([
      ['02.2026', null],
      ['03.2026', 1000],
      ['04.2026', null],
    ])
  })

  it('is empty when the period has no services', () => {
    expect(
      buildElectricityRows(
        [monthService('2026-01')],
        [dayjs('2024-01-01'), dayjs('2024-12-01')]
      )
    ).toEqual([])
    expect(buildElectricityRows([])).toEqual([])
  })

  it('takes the service created last when a month has two', () => {
    const older = monthService('2026-03', {
      _id: '64d68421d9ba2fc8fea79d01',
      consumedElectricity: 1,
    })
    const newer = monthService('2026-03', {
      _id: '64d68421d9ba2fc8fea79d02',
      consumedElectricity: 2,
    })

    expect(buildElectricityRows([newer, older])[0].consumed).toBe(2)
  })

  it('shows the saved losses even when they differ from the calculation', () => {
    const [row] = buildElectricityRows([
      monthService('2026-03', { losses: 7.5 }),
    ])

    expect(row.losses).toBe(7.5)
  })

  it('calculates losses that were not saved', () => {
    const [row] = buildElectricityRows([
      monthService('2026-03', { losses: null }),
    ])

    expect(row.losses).toBe(10)
  })

  it.each([
    ['the schema default', 0, null],
    ['a leftover -100%', -100, null],
    ['a value typed by hand', 5, 5],
  ])('without the inputs treats %s correctly', (_, saved, expected) => {
    const [row] = buildElectricityRows([
      monthService('2026-03', { generalElectricity: null, losses: saved }),
    ])

    expect(row.losses).toBe(expected)
  })
})

describe('addresses', () => {
  const street = { _id: 'street-1', address: 'Шевченка 1', city: 'Житомир' }
  const services = [
    monthService('2026-03', { street }),
    monthService('2026-02'),
    monthService('2026-01', { street }),
  ]

  it('lists each address once, including the services without one', () => {
    expect(getAddressOptions(services)).toEqual([
      { value: 'street-1', label: 'Шевченка 1 (м. Житомир)' },
      { value: NO_ADDRESS, label: 'Без адреси' },
    ])
  })

  it('keeps the services of one address only', () => {
    expect(filterByAddress(services, 'street-1')).toHaveLength(2)
    expect(filterByAddress(services, NO_ADDRESS)).toEqual([services[1]])
  })
})
